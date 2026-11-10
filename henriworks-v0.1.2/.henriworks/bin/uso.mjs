#!/usr/bin/env node
// HenriWorks - uso e custo. Sem dependência, Node 20+. Coleta é determinística: hook e
// exportador OpenTelemetry do Copilot. O modelo nunca conta os próprios tokens.
//
//   node .henriworks/bin/uso.mjs configurar [--aplicar]   liga o exportador OTel em arquivo
//   node .henriworks/bin/uso.mjs importar                 lê o OTel novo (incremental)
//   node .henriworks/bin/uso.mjs painel                   gera ~/.henriworks/uso/painel/index.html
//   node .henriworks/bin/uso.mjs resumo <change|pasta>    seção "Uso e custo" do registro de conhecimento
//   node .henriworks/bin/uso.mjs orcamento <change> <créditos>   orçamento por mudança (só aviso)
//   node .henriworks/bin/uso.mjs alerta                   linha de aviso de orçamento (usada pelo hook)
//
// Dados ficam em ~/.henriworks/uso/ (ou HENRIWORKS_USO), fora de qualquer repositório. Nunca grava
// prompt, resposta, argumento de ferramenta nem comando: só carimbo, nome, contagem e categoria.

import { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { USO_DIR, lerJson, gravarJson, anexarJsonl, linhasDe, branchAtual, mudancaDaBranch, metadados, CHANGES, ARCHIVE, config } from './lib/comum.mjs';
import { precos, custo, lerTodos, lerLiberados, cruzar, estadoTexto, idadeDias, vencida as listaVencida, ehReferencia } from './lib/modelos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const OTEL_PADRAO = join(USO_DIR, 'otel', 'copilot-otel.jsonl');
const otelArquivo = () => process.env.COPILOT_OTEL_FILE_EXPORTER_PATH || OTEL_PADRAO;
const mes = (t) => String(t).slice(0, 7);

// --------------------------------------------------------------- configurar

// Estado do exportador: variável no processo atual, ou arquivo do OTel recebendo dados nos últimos 7
// dias (o VS Code pode ter a variável mesmo quando este terminal não tem).
function estadoOtel() {
  const arq = otelArquivo();
  const ambiente = process.env.COPILOT_OTEL_ENABLED === 'true' || Boolean(process.env.COPILOT_OTEL_FILE_EXPORTER_PATH);
  let recente = false;
  try { recente = existsSync(arq) && Date.now() - statSync(arq).mtimeMs < 7 * 864e5 && statSync(arq).size > 0; } catch { /* sem arquivo */ }
  return { arq, ambiente, recente, ligado: ambiente || recente };
}

function arquivoDoShell() {
  const sh = basename(process.env.SHELL || '');
  return join(homedir(), sh === 'zsh' || (process.platform === 'darwin' && !sh) ? '.zshrc' : sh === 'fish' ? '.config/fish/config.fish' : '.bashrc');
}

function configurar({ aplicar }) {
  const o = estadoOtel();
  console.log(`uso: dados em ${USO_DIR}; OTel ${o.ligado ? `ligado (${o.arq}${o.ambiente ? '' : ', visto pelo arquivo'})` : 'DESLIGADO: sem token, modelo e custo, só eventos dos hooks'}`);
  if (o.ligado && !aplicar) return;
  const win = process.platform === 'win32';
  if (aplicar) {
    mkdirSync(dirname(OTEL_PADRAO), { recursive: true });
    if (win) {
      for (const [k, v] of [['COPILOT_OTEL_ENABLED', 'true'], ['COPILOT_OTEL_FILE_EXPORTER_PATH', OTEL_PADRAO]]) spawnSync('setx', [k, v], { stdio: 'ignore' });
      console.log('variáveis de usuário gravadas (setx). Feche e abra o VS Code para valer.');
      return;
    }
    const rc = arquivoDoShell();
    const atual = existsSync(rc) ? readFileSync(rc, 'utf8') : '';
    if (atual.includes('# >>> henriworks otel')) { console.log(`${rc} já tem o bloco do HenriWorks. Feche e abra o VS Code se ainda não fez.`); return; }
    const fish = rc.endsWith('config.fish');
    const bloco = fish
      ? `\n# >>> henriworks otel\nset -gx COPILOT_OTEL_ENABLED true\nset -gx COPILOT_OTEL_FILE_EXPORTER_PATH "${OTEL_PADRAO}"\n# <<< henriworks otel\n`
      : `\n# >>> henriworks otel\nexport COPILOT_OTEL_ENABLED=true\nexport COPILOT_OTEL_FILE_EXPORTER_PATH="${OTEL_PADRAO}"\n# <<< henriworks otel\n`;
    mkdirSync(dirname(rc), { recursive: true });
    writeFileSync(rc, atual.replace(/\s*$/, '\n') + bloco);
    console.log(`bloco gravado em ${rc} (entre "# >>> henriworks otel" e "# <<< henriworks otel"; para desfazer, apague o bloco). Feche e abra o VS Code: no macOS e no Linux ele lê o ambiente do shell ao abrir.`);
    return;
  }
  console.log([
    'Para ligar (uma vez por máquina; captureContent continua desligado):',
    `  node .henriworks/bin/uso.mjs configurar --aplicar    (${win ? 'grava COPILOT_OTEL_ENABLED e COPILOT_OTEL_FILE_EXPORTER_PATH no seu usuário, com setx' : `acrescenta as duas variáveis em ${arquivoDoShell()}, num bloco marcado`})`,
    '  ou, nas configurações do VS Code: github.copilot.chat.otel.enabled=true, exporterType=file, outfile=<caminho acima>',
  ].join('\n'));
}

// ------------------------------------------------------------------ importar

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function kv(a) {
  if (!a) return {};
  if (Array.isArray(a)) {
    const o = {};
    for (const x of a) {
      if (Array.isArray(x)) o[x[0]] = x[1];
      else if (x && x.key != null) { const v = x.value; o[x.key] = v && typeof v === 'object' ? (v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue ?? v) : v; }
    }
    return o;
  }
  return typeof a === 'object' ? a : {};
}
function tempoMs(v) {
  if (v == null) return null;
  if (Array.isArray(v) && v.length === 2) return num(v[0]) * 1000 + num(v[1]) / 1e6;
  if (typeof v === 'string' && !/^\d+$/.test(v)) { const d = Date.parse(v); return Number.isNaN(d) ? null : d; }
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n > 1e17 ? n / 1e6 : n > 1e14 ? n / 1e3 : n > 1e11 ? n : n * 1000;
}

// Varre qualquer forma (OTLP JSON, span achatado, logRecord do exportador) atrás de registro com uso.
function* registros(no, prof = 0) {
  if (!no || typeof no !== 'object' || prof > 8) return;
  if (Array.isArray(no)) { for (const x of no) yield* registros(x, prof + 1); return; }
  const at = kv(no.attributes);
  if (at['gen_ai.usage.input_tokens'] != null || at['gen_ai.usage.output_tokens'] != null) {
    const t = tempoMs(no.startTimeUnixNano ?? no.startTime ?? no.timeUnixNano ?? no.hrTime ?? no.timestamp ?? no.time);
    yield {
      t: t ? new Date(t).toISOString() : null,
      nome: String(no.name ?? no._body ?? at['event.name'] ?? at['gen_ai.operation.name'] ?? ''),
      conv: at['gen_ai.conversation.id'] ?? null,
      modelo: at['gen_ai.response.model'] ?? at['gen_ai.request.model'] ?? '?',
      in: num(at['gen_ai.usage.input_tokens']),
      out: num(at['gen_ai.usage.output_tokens']),
      cr: num(at['gen_ai.usage.cache_read.input_tokens'] ?? at['gen_ai.usage.cache_read_input_tokens']),
      cw: num(at['gen_ai.usage.cache_creation.input_tokens'] ?? at['gen_ai.usage.cache_creation_input_tokens']),
      rz: num(at['gen_ai.usage.reasoning.output_tokens']),
      id: at['gen_ai.response.id'] ?? null,
      agente: at['gen_ai.agent.name'] ?? null,
      op: at['gen_ai.operation.name'] ?? null,
    };
    return;
  }
  for (const v of Object.values(no)) if (v && typeof v === 'object') yield* registros(v, prof + 1);
}

async function importar() {
  const arq = otelArquivo();
  if (!existsSync(arq)) return { novos: 0, motivo: `sem arquivo OTel (${arq})` };
  const pOff = join(USO_DIR, 'cache', 'otel-offset.json');
  const off = lerJson(pOff, {});
  const tam = statSync(arq).size;
  let inicio = off[arq] && off[arq] <= tam ? off[arq] : 0;
  const vistos = new Set(lerJson(join(USO_DIR, 'cache', 'otel-vistos.json'), []));
  let novos = 0;
  const rl = createInterface({ input: createReadStream(arq, { start: inicio, encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const linha of rl) {
    if (!linha.trim()) continue;
    let obj;
    try { obj = JSON.parse(linha); } catch { continue; }
    for (const r of registros(obj)) {
      // invoke_agent traz o total da sessão: só os registros por chamada (chat/eventos) contam.
      if (/invoke_agent/.test(r.nome) || r.op === 'invoke_agent') continue;
      const chave = r.id || createHash('sha1').update(`${r.t}|${r.modelo}|${r.in}|${r.out}|${r.conv}`).digest('hex').slice(0, 16);
      if (vistos.has(chave) || !r.t) continue;
      vistos.add(chave);
      anexarJsonl(join(USO_DIR, 'consumo', `${mes(r.t)}.jsonl`), { t: r.t, conv: r.conv, modelo: r.modelo, in: r.in, out: r.out, cr: r.cr, cw: r.cw, rz: r.rz, id: chave });
      novos++;
    }
  }
  off[arq] = tam;
  gravarJson(pOff, off);
  gravarJson(join(USO_DIR, 'cache', 'otel-vistos.json'), [...vistos].slice(-50000));
  return { novos };
}

// ---------------------------------------------------------------- leitura

function sessoes(eventos) {
  const s = new Map();
  for (const e of eventos) {
    if (!e.sid) continue;
    if (!s.has(e.sid)) s.set(e.sid, { sid: e.sid, inicio: e.t, fim: e.t, repo: e.repo, branch: e.branch, ticket: e.ticket, change: e.change, agentes: new Set(), ferramentas: 0, negacoes: {}, buscas: 0, mapaAntes: null, hwk: false });
    const x = s.get(e.sid);
    if (e.t < x.inicio) x.inicio = e.t;
    if (e.t > x.fim) x.fim = e.t;
    for (const k of ['repo', 'branch', 'ticket', 'change']) if (e[k] && !x[k]) x[k] = e[k];
    if (e.agente) { x.agentes.add(e.agente); if (/^hwk/.test(e.agente)) x.hwk = true; }
    if (e.subagente) x.agentes.add(e.subagente);
    if (e.ev === 'preToolUse') {
      x.ferramentas++;
      if (e.cat === 'mapa') { x.hwk = true; if (x.mapaAntes === null) x.mapaAntes = true; }
      if (e.cat === 'busca') { x.buscas++; if (x.mapaAntes === null) x.mapaAntes = false; }
      if (e.cat === 'hwk') x.hwk = true;
      if (e.decisao === 'negar') x.negacoes[e.motivo || 'outro'] = (x.negacoes[e.motivo || 'outro'] || 0) + 1;
    }
  }
  return [...s.values()];
}

// Consumo vai para a sessão pelo id de conversa, quando bate; senão, pela janela de tempo.
function atribuir(consumo, ss) {
  const porSid = new Map(ss.map((s) => [s.sid, s]));
  const ord = [...ss].sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  for (const c of consumo) {
    let s = c.conv && porSid.get(c.conv);
    if (!s) {
      const t = Date.parse(c.t);
      const cand = ord.filter((x) => Date.parse(x.inicio) - 60000 <= t && t <= Date.parse(x.fim) + 180000);
      s = cand[cand.length - 1];
    }
    c.sessao = s ? s.sid : null;
  }
}

function dados() {
  const tabela = precos();
  const eventos = lerTodos('eventos');
  const consumo = lerTodos('consumo');
  const ss = sessoes(eventos);
  atribuir(consumo, ss);
  const porSid = new Map(ss.map((s) => [s.sid, s]));
  for (const c of consumo) {
    const k = custo(c, tabela);
    c.usd = k.usd;
    c.creditos = k.usd / (tabela.credito_usd || 0.01);
    c.semPreco = k.semPreco;
    const s = c.sessao && porSid.get(c.sessao);
    c.change = s?.change || null;
    c.ticket = s?.ticket || null;
    c.repo = s?.repo || null;
  }
  return { tabela, eventos, consumo, ss };
}

const soma = (xs, f) => xs.reduce((a, x) => a + (f(x) || 0), 0);
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });

// ------------------------------------------------------------------ resumo

async function resumoMudanca(alvo) {
  await importar().catch(() => null);
  const id = String(alvo || '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const { consumo, ss } = dados();
  const ses = ss.filter((s) => s.change === id);
  const cs = consumo.filter((c) => c.change === id);
  if (!ses.length && !cs.length) return 'Sem dados de uso coletados para esta mudança (OTel desligado ou hooks sem permissão).';
  const tokIn = soma(cs, (c) => c.in);
  const modelos = [...new Set(cs.map((c) => c.modelo))];
  const horas = soma(ses, (s) => Math.min(Date.parse(s.fim) - Date.parse(s.inicio), 3 * 3600e3)) / 3600e3;
  const fases = {};
  for (const s of ses) for (const a of s.agentes) if (/^hwk/.test(a)) fases[a] = (fases[a] || 0) + 1;
  return [
    `- Sessões: ${ses.length} · tempo ativo aproximado: ${fmt(horas, 1)} h`,
    `- Tokens: ${fmt(tokIn)} de entrada (${fmt(tokIn ? (soma(cs, (c) => c.cr) / tokIn) * 100 : 0)}% lidos de cache), ${fmt(soma(cs, (c) => c.out))} de saída`,
    `- Custo de consumo a valor de lista: ${fmt(soma(cs, (c) => c.creditos), 0)} créditos (US$ ${fmt(soma(cs, (c) => c.usd), 2)})${cs.some((c) => c.semPreco) ? ' · há modelo sem preço na tabela' : ''}`,
    `- Modelos: ${modelos.join(', ') || 'não registrado'}`,
    `- Agentes do fluxo usados: ${Object.entries(fases).map(([a, n]) => `${a} (${n})`).join(', ') || 'nenhum registrado'}`,
  ].join('\n');
}

// ---------------------------------------------------------------- orçamento

function orcamento(change, creditos) {
  const p = join(USO_DIR, 'orcamentos.json');
  const o = lerJson(p, {});
  if (!change) return console.log(JSON.stringify(o, null, 2));
  const v = Number(creditos);
  if (!Number.isFinite(v) || v <= 0) { console.error('uso: orcamento <change-id> <créditos>'); process.exit(2); }
  o[change] = { creditos: v, alertado: 0, em: new Date().toISOString() };
  gravarJson(p, o);
  console.log(`orçamento de ${change}: ${v} créditos. Aviso ao cruzar ${config().uso.alertas.map((x) => `${x * 100}%`).join(', ')}. Nada é bloqueado.`);
}

function alerta() {
  const change = mudancaDaBranch();
  if (!change) return;
  const p = join(USO_DIR, 'orcamentos.json');
  const o = lerJson(p, {});
  const b = o[change];
  if (!b) return;
  const { consumo } = dados();
  const gasto = soma(consumo.filter((c) => c.change === change), (c) => c.creditos);
  const fracao = gasto / b.creditos;
  const limites = config().uso.alertas.filter((x) => fracao >= x && x > (b.alertado || 0));
  if (!limites.length) return;
  b.alertado = Math.max(...limites);
  gravarJson(p, o);
  console.log(`HenriWorks: a mudança ${change} já usou ${fmt(gasto)} de ${fmt(b.creditos)} créditos do orçamento (${fmt(fracao * 100)}%). É só aviso.`);
}

// ------------------------------------------------------------------ painel

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Fase do fluxo pelo agente principal da sessão (o custom agent selecionado, registrado pelo hook escopado).
const FASE = { hwk: 'Intenção', 'hwk-discovery': 'Discovery', 'hwk-grill': 'Discovery', 'hwk-triagem': 'Discovery', 'hwk-prototipo': 'Discovery', 'hwk-plan': 'Plano', 'hwk-review': 'Revisão', 'hwk-implement': 'Implementação', 'hwk-archive': 'Archive' };
const ORDEM_FASE = ['Intenção', 'Discovery', 'Plano', 'Revisão', 'Implementação', 'Archive', 'fora do fluxo'];
const faseDa = (s) => { for (const a of s?.agentes || []) if (FASE[a]) return FASE[a]; return 'fora do fluxo'; };

// Barras horizontais. Cada barra entra com atraso próprio (--d): animação só em CSS.
function barras(linhas, valor, rotulo, sufixo = '', destaque = 0) {
  if (!linhas.length) return '';
  const max = Math.max(...linhas.map(valor), 1);
  return linhas.map((l, i) => `<div class="hp-b"><span class="hp-r" title="${esc(rotulo(l))}">${esc(rotulo(l))}</span><span class="hp-t"><i class="hp-ax${i < destaque ? ' hp-sinal' : ''}" style="width:${((valor(l) / max) * 100).toFixed(1)}%;--d:${(i * 0.05).toFixed(2)}s"></i></span><span class="hp-v">${fmt(valor(l))}${sufixo}</span></div>`).join('');
}

// Colunas por dia (SVG). Rótulo só no primeiro, no último e no máximo.
function colunas(dias) {
  if (!dias.length) return '<p class="hp-vazio">sem consumo no período</p>';
  const W = 640, H = 190, base = 160, topo = 18, n = dias.length, gap = 3;
  const larg = Math.max((W - 40 - gap * (n - 1)) / n, 2);
  // O pico é o maior valor real; a escala nunca divide por zero (dias sem preço somam 0 crédito).
  const pico = Math.max(...dias.map((d) => d.cred));
  const iMax = Math.max(dias.findIndex((d) => d.cred === pico), 0);
  const max = pico > 0 ? pico : 1;
  const cols = dias.map((d, i) => {
    const h = Math.max(((d.cred / max) * (base - topo)), 1.5);
    const x = 30 + i * (larg + gap);
    return `<rect class="hp-col${i === iMax ? ' hp-sinal' : ''}" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${larg.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" style="--d:${(i * 0.025).toFixed(3)}s"><title>${esc(d.d)}: ${fmt(d.cred)} créditos, ${fmt(d.tok)} tokens</title></rect>`;
  }).join('');
  const xr = (i) => (30 + i * (larg + gap) + larg / 2).toFixed(1);
  const dd = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return `<svg class="hp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Créditos por dia, máximo de ${fmt(pico, 1)} em ${dd(dias[iMax].d)}">
<line class="hp-eixo" x1="26" y1="${base}" x2="${W - 6}" y2="${base}"/>${cols}
<text x="${xr(iMax)}" y="${(base - ((pico / max) * (base - topo)) - 6).toFixed(1)}" text-anchor="middle" class="hp-rot">${fmt(pico, pico < 10 ? 1 : 0)} cr</text>
<text x="${xr(0)}" y="${base + 18}" text-anchor="middle">${dd(dias[0].d)}</text><text x="${xr(n - 1)}" y="${base + 18}" text-anchor="middle">${dd(dias[n - 1].d)}</text></svg>`;
}

// Créditos acumulados por sessão de uma mudança, com as linhas de aviso do orçamento.
function acumulado(change, pontos, orc, alertas) {
  const W = 640, H = 230, x0 = 44, x1 = W - 16, base = 190, topo = 16;
  const total = pontos.length ? pontos[pontos.length - 1].acum : 0;
  const teto = Math.max(orc ? orc * 1.05 : 0, total * 1.1, 1);
  const y = (v) => base - (v / teto) * (base - topo);
  const x = (i) => (pontos.length < 2 ? (x0 + x1) / 2 : x0 + (i / (pontos.length - 1)) * (x1 - x0));
  const lim = orc ? alertas.map((a) => `<g class="hp-lim${total >= orc * a ? ' hp-lim--ok' : ''}"><line x1="${x0}" y1="${y(orc * a).toFixed(1)}" x2="${x1}" y2="${y(orc * a).toFixed(1)}"/><text x="${x1}" y="${(y(orc * a) - 5).toFixed(1)}" text-anchor="end">${fmt(a * 100)}% · ${fmt(orc * a)}</text></g>`).join('') : '';
  const pts = pontos.map((p, i) => `${x(i).toFixed(1)} ${y(p.acum).toFixed(1)}`);
  const linha = pts.length ? `M${pts.join(' L')}` : '';
  const area = pts.length ? `${linha} L${x(pontos.length - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z` : '';
  const cruzou = orc ? alertas.map((a) => ({ a, i: pontos.findIndex((p) => p.acum >= orc * a) })).filter((c) => c.i > -1) : [];
  const marcos = cruzou.map((c) => `<g class="hp-marco"><circle cx="${x(c.i).toFixed(1)}" cy="${y(pontos[c.i].acum).toFixed(1)}" r="5"/><text x="${(x(c.i) - 8).toFixed(1)}" y="${(y(pontos[c.i].acum) + 20).toFixed(1)}" text-anchor="end">aviso ${fmt(c.a * 100)}% · sessão ${c.i + 1}</text></g>`).join('');
  const fim = pontos.length ? `<circle class="hp-fim" cx="${x(pontos.length - 1).toFixed(1)}" cy="${y(total).toFixed(1)}" r="5"/><text class="hp-rot" x="${(x(pontos.length - 1) - 8).toFixed(1)}" y="${(y(total) + 22).toFixed(1)}" text-anchor="end">${fmt(total)} cr</text>` : '';
  return `<svg class="hp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(change)}: ${fmt(total)} créditos em ${pontos.length} sessões${orc ? ` de um orçamento de ${fmt(orc)}` : ''}">
<line class="hp-eixo" x1="${x0}" y1="${base}" x2="${x1}" y2="${base}"/><text x="${x0 - 6}" y="${base + 4}" text-anchor="end">0</text>
<text x="${x0}" y="${base + 20}" text-anchor="middle">1</text><text x="${x1}" y="${base + 20}" text-anchor="middle">${pontos.length}</text><text x="${(x0 + x1) / 2}" y="${H - 4}" text-anchor="middle">sessão</text>
${lim}<path class="hp-area" d="${area}"/><path class="hp-linha" pathLength="1" d="${linha}"/>${marcos}${fim}</svg>`;
}

const CSS_PAINEL = `/*hp:inicio*/
.hp{--hp-p:#F5F6F8;--hp-s:#fff;--hp-t:#18202C;--hp-m:#5E6878;--hp-l:#D9DEE6;--hp-l2:#E9ECF1;--hp-a:#4A5979;--hp-o:#E5600E;--hp-ok:#1F7A4D;--hp-okb:#E3F2EA;--hp-w:#8F5200;--hp-wb:#FBEFD9;--hp-c:#B42318;--hp-cb:#FDE7E5;
color:var(--hp-t);background:var(--hp-p);font:14px/1.5 "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,sans-serif;padding:24px max(16px,3vw);display:grid;grid-template-columns:minmax(0,1fr);gap:20px}.hp section{min-width:0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .hp{--hp-p:#11151C;--hp-s:#171C25;--hp-t:#E7EBF1;--hp-m:#A3ACBB;--hp-l:#2B3240;--hp-l2:#222937;--hp-a:#9DAACB;--hp-o:#FF7B2A;--hp-ok:#6FD3A0;--hp-okb:#16352A;--hp-w:#F2B562;--hp-wb:#3A2A12;--hp-c:#FF8A80;--hp-cb:#3D1A18}}
:root[data-theme="dark"] .hp{--hp-p:#11151C;--hp-s:#171C25;--hp-t:#E7EBF1;--hp-m:#A3ACBB;--hp-l:#2B3240;--hp-l2:#222937;--hp-a:#9DAACB;--hp-o:#FF7B2A;--hp-ok:#6FD3A0;--hp-okb:#16352A;--hp-w:#F2B562;--hp-wb:#3A2A12;--hp-c:#FF8A80;--hp-cb:#3D1A18}
.hp *{box-sizing:border-box}.hp h1{font-size:22px;margin:0;letter-spacing:-.01em}.hp h2{font:600 12px/1.3 "Cascadia Code",Consolas,ui-monospace,monospace;margin:0 0 10px;text-transform:uppercase;letter-spacing:.07em;color:var(--hp-m)}
.hp code{font:12px "Cascadia Code",Consolas,ui-monospace,monospace}
.hp-cab{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:space-between;align-items:flex-start}.hp-sub{color:var(--hp-m);font-size:12.5px;margin:4px 0 0;overflow-wrap:anywhere}
.hp-vivo{display:inline-flex;align-items:center;gap:7px;font:600 11px "Cascadia Code",Consolas,monospace;color:var(--hp-ok);background:var(--hp-okb);border-radius:999px;padding:5px 10px}
.hp-vivo::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.hp-aviso{border-left:3px solid var(--hp-o);padding:8px 12px;background:var(--hp-s);font-size:13px}
.hp-ks{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.hp-k{background:var(--hp-s);border:1px solid var(--hp-l);border-radius:6px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;min-width:0}
.hp-k span{font-size:12px;color:var(--hp-m)}.hp-k b{font-size:24px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}.hp-k small{color:var(--hp-m);font-size:12px}
.hp-c{background:var(--hp-s);border:1px solid var(--hp-l);border-radius:6px;padding:14px 16px;min-width:0}
.hp-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px}
.hp-g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}
.hp-b{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"r v" "t t";gap:3px 10px;align-items:center;font-size:12.5px;margin:0 0 9px}.hp-b .hp-r{grid-area:r}.hp-b .hp-t{grid-area:t}.hp-b .hp-v{grid-area:v}
.hp-r{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hp-t{height:8px;background:var(--hp-l2);border-radius:2px;overflow:hidden}
.hp-t i{display:block;height:100%;background:var(--hp-a);border-radius:2px;transform-origin:left}.hp-t i.hp-sinal{background:var(--hp-o)}
.hp-v{font-variant-numeric:tabular-nums;color:var(--hp-m);white-space:nowrap}
.hp-orc{display:grid;gap:12px}.hp-o{display:grid;grid-template-columns:minmax(0,12rem) minmax(0,1fr) 16rem;gap:6px 16px;align-items:center}@media (max-width:760px){.hp-o{grid-template-columns:minmax(0,1fr)}.hp-o__v{text-align:left}}
.hp-o__n{min-width:0}.hp-o__n b{display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hp-o__n small{color:var(--hp-m);font-size:11.5px}
.hp-o__t{position:relative;height:14px;background:var(--hp-l2);border-radius:3px}
.hp-o__t i{position:absolute;inset:0 auto 0 0;border-radius:3px;background:var(--hp-a);transform-origin:left}
.hp-o__t i.hp-warn{background:var(--hp-w)}.hp-o__t i.hp-crit{background:var(--hp-c)}
.hp-o__t u{position:absolute;top:-4px;bottom:-4px;width:0;border-left:1.5px dashed var(--hp-m);text-decoration:none}
.hp-o__v{font:600 12px "Cascadia Code",Consolas,monospace;white-space:nowrap;text-align:right}
.hp-pill{display:inline-block;font:600 10.5px/1 "Cascadia Code",Consolas,monospace;padding:4px 7px;border-radius:999px;margin-left:6px}
.hp-pill--ok{background:var(--hp-okb);color:var(--hp-ok)}.hp-pill--off{background:var(--hp-l2);color:var(--hp-m)}.hp-pill--info{background:var(--hp-l2);color:var(--hp-a)}.hp-pill--warn{background:var(--hp-wb);color:var(--hp-w)}.hp-pill--crit{background:var(--hp-cb);color:var(--hp-c)}
.hp-svg{width:100%;height:auto;display:block;overflow:visible}.hp-svg text{fill:var(--hp-m);font:11px "Cascadia Code",Consolas,monospace}.hp-svg .hp-rot{fill:var(--hp-t);font-weight:700;font-size:12px}
.hp-eixo{stroke:var(--hp-l)}.hp-col{fill:var(--hp-a);transform-box:fill-box;transform-origin:50% 100%}.hp-col.hp-sinal{fill:var(--hp-o)}
.hp-lim line{stroke:var(--hp-w);stroke-dasharray:3 4;opacity:.75}.hp-lim text{fill:var(--hp-w)}
.hp-area{fill:color-mix(in srgb,var(--hp-a) 13%,transparent)}.hp-linha{fill:none;stroke:var(--hp-a);stroke-width:2.5;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0}
.hp-marco circle{fill:var(--hp-s);stroke:var(--hp-w);stroke-width:2.5}.hp-marco text{fill:var(--hp-w)}.hp-fim{fill:var(--hp-o)}
.hp-tab{overflow-x:auto}.hp table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px}
.hp th,.hp td{text-align:left;padding:7px 10px 7px 0;border-bottom:1px solid var(--hp-l);white-space:nowrap}.hp th{color:var(--hp-m);font-weight:600;font-size:11.5px}
.hp td.n,.hp th.n{text-align:right;font-variant-numeric:tabular-nums}
.hp-vazio{color:var(--hp-m);font-size:12.5px;margin:0}
.hp-mcab{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between;margin:0 0 10px;font-size:12.5px;color:var(--hp-m)}
.hp-chips{display:flex;flex-wrap:wrap;gap:6px}.hp-chips .hp-pill{margin:0}
.hp td.hp-al{white-space:normal;min-width:220px}.hp-al>span{display:block;margin:3px 0}.hp-al .hp-pill{margin:0 6px 0 0}.hp td .hp-pill{margin-left:0}.hp-rod{color:var(--hp-m);font-size:12px;margin:0}
@media (prefers-reduced-motion:no-preference){
.hp:not(.hp--parado) .hp-ax,.hp:not(.hp--parado) .hp-o__t i{animation:hp-x .9s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--d,0s)}
.hp:not(.hp--parado) .hp-col{animation:hp-y .7s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--d,0s)}
.hp:not(.hp--parado) .hp-linha{animation:hp-traco 1.8s ease-in-out .2s both}
.hp:not(.hp--parado) .hp-area,.hp:not(.hp--parado) .hp-marco,.hp:not(.hp--parado) .hp-fim,.hp:not(.hp--parado) .hp-lim{animation:hp-in .6s ease-out 1.2s both}
.hp:not(.hp--parado) .hp-vivo::before{animation:hp-pulso 1.6s ease-in-out infinite}}
@keyframes hp-x{from{scale:0 1}}@keyframes hp-y{from{scale:1 0}}@keyframes hp-traco{from{stroke-dashoffset:1}}@keyframes hp-in{from{opacity:0}}
@keyframes hp-pulso{50%{opacity:.25;scale:.7}}
/*hp:fim*/`;

async function painel() {
  const imp = await importar().catch((e) => ({ novos: 0, motivo: e.message }));
  const { tabela, consumo, ss } = dados();
  const cfg = config();
  const porSid = new Map(ss.map((s) => [s.sid, s]));
  const dias = new Map();
  for (const c of consumo) {
    const d = c.t.slice(0, 10);
    if (!dias.has(d)) dias.set(d, { d, cred: 0, tok: 0 });
    dias.get(d).cred += c.creditos;
    dias.get(d).tok += c.in + c.out;
  }
  const agrupar = (f) => {
    const m = new Map();
    for (const c of consumo) {
      const k = f(c) || '(sem)';
      if (!m.has(k)) m.set(k, { k, cred: 0, tok: 0, n: 0 });
      const x = m.get(k);
      x.cred += c.creditos; x.tok += c.in + c.out; x.n++;
    }
    return [...m.values()].sort((a, b) => b.cred - a.cred).slice(0, 10);
  };
  const porFase = agrupar((c) => faseDa(porSid.get(c.sessao))).sort((a, b) => ORDEM_FASE.indexOf(a.k) - ORDEM_FASE.indexOf(b.k));
  const hwk = ss.filter((s) => s.hwk);
  const comBusca = hwk.filter((s) => s.mapaAntes !== null);
  const mapaPrimeiro = comBusca.length ? (comBusca.filter((s) => s.mapaAntes).length / comBusca.length) * 100 : null;
  const semTicket = ss.length ? (ss.filter((s) => !s.ticket).length / ss.length) * 100 : 0;
  const tokIn = soma(consumo, (c) => c.in);
  const agentes = new Map();
  for (const s of ss) for (const a of s.agentes) agentes.set(a, (agentes.get(a) || 0) + 1);
  const negacoes = {};
  for (const s of ss) for (const [k, v] of Object.entries(s.negacoes)) negacoes[k] = (negacoes[k] || 0) + v;
  const NEG = { 'mapa-primeiro': 'mapa antes de busca', imutavel: 'veredito ou archive imutável', pacote: 'prompt do peixinho fora do pacote', git: 'Git no agente', trava: 'arquivo de outra fatia' };

  // Orçamentos: gasto, fração e estado; o gráfico acumulado usa a mudança com atividade mais recente.
  const orcs = lerJson(join(USO_DIR, 'orcamentos.json'), {});
  const alertas = cfg.uso.alertas;
  const linhasOrc = Object.entries(orcs).map(([change, o]) => {
    const cs = consumo.filter((c) => c.change === change);
    const gasto = soma(cs, (c) => c.creditos);
    const ult = cs.reduce((a, c) => (c.t > a ? c.t : a), '');
    const ticket = cs.find((c) => c.ticket)?.ticket || ss.find((s) => s.change === change)?.ticket || null;
    return { change, ticket, orc: o.creditos, gasto, fr: gasto / o.creditos, ult };
  }).sort((a, b) => (a.ult < b.ult ? 1 : -1));
  const estado = (fr) => (fr >= 1 ? ['crit', 'estourado'] : fr >= alertas[1] ? ['warn', 'acima de 80%'] : fr >= alertas[0] ? ['warn', 'acima de 50%'] : ['ok', 'no orçamento']);
  const ESC = 1.25; // a trilha vai até 125% do orçamento, para o estouro aparecer
  const blocoOrc = linhasOrc.length ? linhasOrc.map((o, i) => {
    const [cl, txt] = estado(o.fr);
    const marcas = alertas.map((a) => `<u style="left:${((a / ESC) * 100).toFixed(1)}%" title="${fmt(a * 100)}%"></u>`).join('');
    return `<div class="hp-o"><div class="hp-o__n"><b>${esc(o.change)}</b><small>${o.ticket ? esc(o.ticket) : 'sem ticket'}</small></div>
<div class="hp-o__t"><i class="${cl === 'ok' ? '' : `hp-${cl}`}" style="width:${Math.min((o.fr / ESC) * 100, 100).toFixed(1)}%;--d:${(i * 0.08).toFixed(2)}s"></i>${marcas}</div>
<div class="hp-o__v">${fmt(o.gasto)} / ${fmt(o.orc)} cr<span class="hp-pill hp-pill--${cl}">${fmt(o.fr * 100)}% · ${txt}</span></div></div>`;
  }).join('') : '<p class="hp-vazio">Nenhum orçamento definido. <code>node .henriworks/bin/uso.mjs orcamento &lt;change-id&gt; &lt;créditos&gt;</code></p>';

  const foco = linhasOrc[0] || null;
  let blocoAcum = '<p class="hp-vazio">Defina um orçamento para ver o acumulado de uma mudança.</p>';
  if (foco) {
    const doFoco = ss.filter((s) => s.change === foco.change).sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
    let acum = 0;
    const pontos = doFoco.map((s) => { acum += soma(consumo.filter((c) => c.sessao === s.sid), (c) => c.creditos); return { acum }; });
    blocoAcum = acumulado(foco.change, pontos, foco.orc, alertas);
  }

  // Modelos: política (lista oficial) × uso real (OTel, últimos 30 dias) × preço na tabela.
  const lista = lerLiberados();
  const desde30 = Date.now() - 30 * 864e5;
  const mods = cruzar({ lista, consumo: consumo.filter((c) => Date.parse(c.t) >= desde30), tabela });
  const pillEstado = (r) => (r.libera === true ? 'ok' : r.libera === false ? 'off' : r.estado ? 'warn' : 'off');
  const sevPill = { crit: 'crit', warn: 'warn', info: 'info' };
  const idade = idadeDias(lista);
  const vencida = listaVencida(lista, cfg);
  const contar = (f) => mods.filter(f).length;
  const cabMod = lista
    ? `<p class="hp-mcab"><span>${ehReferencia(lista) ? 'Lista de referência do pacote (seletor do VS Code)' : `Política de ${esc(lista.escopo || 'escopo não informado')}`}, obtida em ${esc(new Date(lista.obtidoEm).toLocaleDateString('pt-BR'))}${vencida ? ` <span class="hp-pill hp-pill--warn">vencida: ${fmt(idade)} dias</span>` : ''} · uso dos últimos 30 dias</span>
<span class="hp-chips"><span class="hp-pill hp-pill--ok">${contar((r) => r.libera === true)} liberado(s)</span><span class="hp-pill hp-pill--info">${contar((r) => r.usado)} usado(s)</span><span class="hp-pill hp-pill--${contar((r) => r.alertas.some((a) => a.sev === 'crit')) ? 'crit' : 'off'}">${contar((r) => r.alertas.some((a) => a.sev === 'crit'))} com alerta grave</span></span></p>`
    : '<p class="hp-mcab"><span>Sem lista de política: as colunas de política ficam vazias. <code>node .henriworks/bin/modelos.mjs atualizar --de &lt;fonte&gt;</code></span></p>';
  const tabMod = mods.length ? `<div class="hp-tab"><table><thead><tr><th>Modelo</th><th>Política</th><th class="n">Sessões</th><th class="n">Créditos</th><th>Preço</th><th>Atenção</th></tr></thead><tbody>${mods.map((r) => `<tr><td><code>${esc(r.id)}</code>${r.nome && r.nome !== r.id ? `<br><small class="hp-sub">${esc(r.nome)}</small>` : ''}</td><td><span class="hp-pill hp-pill--${pillEstado(r)}">${esc(estadoTexto(r.estado))}</span></td><td class="n">${fmt(r.sessoes)}</td><td class="n">${fmt(r.creditos, 1)}</td><td>${r.preco ? esc(r.preco) : '<span class="hp-pill hp-pill--warn">sem preço</span>'}</td><td class="hp-al">${r.alertas.map((a) => `<span><span class="hp-pill hp-pill--${sevPill[a.sev]}">${a.sev === 'crit' ? 'grave' : a.sev === 'warn' ? 'atenção' : 'info'}</span> ${esc(a.txt)}</span>`).join('') || '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hp-vazio">nenhum modelo na lista nem no consumo</p>';

  const recentes = [...ss].sort((a, b) => (a.inicio < b.inicio ? 1 : -1)).slice(0, 12).map((s) => {
    const cs = consumo.filter((c) => c.sessao === s.sid);
    const quando = new Date(s.inicio);
    const q = `${String(quando.getDate()).padStart(2, '0')}/${String(quando.getMonth() + 1).padStart(2, '0')} ${String(quando.getHours()).padStart(2, '0')}:${String(quando.getMinutes()).padStart(2, '0')}`;
    return `<tr><td>${q}</td><td>${esc(s.repo || '—')}</td><td><code>${esc(s.branch || '—')}</code></td><td>${esc(s.ticket || '—')}</td><td>${esc(s.change || '—')}</td><td>${esc(faseDa(s))}</td><td class="n">${fmt(soma(cs, (c) => c.in + c.out))}</td><td class="n">${fmt(soma(cs, (c) => c.creditos), 1)}</td><td>${!s.hwk || s.mapaAntes === null ? '—' : s.mapaAntes ? 'sim' : 'não'}</td></tr>`;
  }).join('');

  const datas = [...dias.keys()].sort();
  const periodo = datas.length ? `${datas[0].split('-').reverse().join('/')} a ${datas[datas.length - 1].split('-').reverse().join('/')}` : 'sem consumo';
  const kpi = (r, v, n) => `<div class="hp-k"><span>${esc(r)}</span><b>${v}</b>${n ? `<small>${esc(n)}</small>` : ''}</div>`;
  const card = (t, corpo) => `<section><h2>${esc(t)}</h2><div class="hp-c">${corpo}</div></section>`;
  const corpo = `<div class="hp">
<header class="hp-cab"><div><h1>HenriWorks · uso e custo</h1><p class="hp-sub">Gerado em ${esc(new Date().toLocaleString('pt-BR'))} · período ${esc(periodo)} · dados locais em <code>${esc(USO_DIR)}</code> · preços de lista de ${esc(tabela.consultado_em || '?')}</p></div><span class="hp-vivo">só nesta máquina</span></header>
${imp.motivo ? `<div class="hp-aviso">${esc(imp.motivo)}. Sem o exportador OTel, token, modelo e custo ficam de fora: <code>node .henriworks/bin/uso.mjs configurar</code></div>` : ''}
<div class="hp-ks">${kpi('Sessões', fmt(ss.length), `${fmt(hwk.length)} no fluxo HenriWorks`)}${kpi('Créditos (valor de lista)', fmt(soma(consumo, (c) => c.creditos)), `US$ ${fmt(soma(consumo, (c) => c.usd), 2)}`)}${kpi('Tokens de entrada', fmt(tokIn), `${fmt(tokIn ? (soma(consumo, (c) => c.cr) / tokIn) * 100 : 0)}% lidos de cache`)}${kpi('Tokens de saída', fmt(soma(consumo, (c) => c.out)))}${kpi('Mapa antes de busca', mapaPrimeiro === null ? '—' : `${fmt(mapaPrimeiro)}%`, 'sessões do fluxo com busca')}${kpi('Sessões sem ticket', `${fmt(semTicket)}%`, 'custo sem task para ligar')}</div>
${card('Orçamentos por mudança · aviso em ' + alertas.map((a) => `${fmt(a * 100)}%`).join(', '), `<div class="hp-orc">${blocoOrc}</div>`)}
<div class="hp-g2">${card('Créditos por dia', colunas([...dias.values()].sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-30)))}${card(foco ? `Acumulado · ${foco.change}` : 'Acumulado da mudança', blocoAcum)}</div>
<div class="hp-g3">${card('Tokens por fase do fluxo', barras(porFase, (x) => x.tok, (x) => x.k, '', 0) || '<p class="hp-vazio">—</p>')}${card('Créditos por modelo', barras(agrupar((c) => c.modelo), (x) => x.cred, (x) => x.k, ' cr', 1) || '<p class="hp-vazio">—</p>')}${card('Créditos por ticket', barras(agrupar((c) => c.ticket), (x) => x.cred, (x) => x.k, ' cr') || '<p class="hp-vazio">—</p>')}${card('Créditos por mudança', barras(agrupar((c) => c.change), (x) => x.cred, (x) => x.k, ' cr') || '<p class="hp-vazio">—</p>')}${card('Agentes por sessão', barras([...agentes].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 10), (x) => x.n, (x) => x.k) || '<p class="hp-vazio">—</p>')}${card('Guardas que negaram', barras(Object.entries(negacoes).map(([k, n]) => ({ k: NEG[k] || k, n })).sort((a, b) => b.n - a.n), (x) => x.n, (x) => x.k) || '<p class="hp-vazio">nenhuma negação</p>')}</div>
${card('Modelos · política × uso × preço', cabMod + tabMod)}
${card('Sessões recentes', recentes ? `<div class="hp-tab"><table><thead><tr><th>Início</th><th>Repo</th><th>Branch</th><th>Ticket</th><th>Mudança</th><th>Fase</th><th class="n">Tokens</th><th class="n">Créditos</th><th>Mapa antes</th></tr></thead><tbody>${recentes}</tbody></table></div>` : '<p class="hp-vazio">nenhuma sessão registrada</p>')}
<p class="hp-rod">Tendência de uso, não ranking de pessoas. Nenhum prompt, resposta ou comando é gravado. Custo é valor de lista: o plano do Copilot inclui créditos, então não é desembolso.</p>
</div>`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HenriWorks · uso e custo</title><style>body{margin:0;background:#F5F6F8}@media (prefers-color-scheme:dark){body{background:#11151C}}
${CSS_PAINEL}</style></head><body>
${corpo}
</body></html>`;
  const p = join(USO_DIR, 'painel', 'index.html');
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
  console.log(`painel: ${p}${imp.novos ? ` (${imp.novos} registro(s) novo(s) do OTel)` : ''}`);
}

// ---------------------------------------------------------------------- main

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'configurar') configurar({ aplicar: args.includes('--aplicar') });
else if (cmd === 'importar') importar().then((r) => console.log(r.motivo || `${r.novos} registro(s) novo(s)`));
else if (cmd === 'painel') await painel();
else if (cmd === 'resumo') console.log(await resumoMudanca(args[0]));
else if (cmd === 'orcamento') orcamento(args[0], args[1]);
else if (cmd === 'alerta') { try { alerta(); } catch { /* aviso nunca atrapalha */ } }
else {
  console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(2);
}
