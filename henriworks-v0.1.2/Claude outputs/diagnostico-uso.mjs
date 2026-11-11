#!/usr/bin/env node
// HenriWorks · diagnóstico do uso. Arquivo único, sem dependência, Node 20+.
//
//   node diagnostico-uso.mjs [--otel <arquivo.jsonl> | --otel settings] [--uso <pasta>] [--repo <raiz do repositório>]
//
// --otel settings lê o arquivo do "github.copilot.chat.otel.outfile" do settings.json do VS Code.
//
// Gera diagnostico-uso.md na pasta atual. Serve para descobrir por que o painel não mostra o modelo do
// chat: que spans o OpenTelemetry do Copilot grava, em que campos vêm modelo e tokens, e o que o
// importador do HenriWorks aproveita ou descarta.
//
// O que sai no arquivo: nomes de span e de evento, nomes de atributo (só a chave), nomes de modelo,
// contagens e somas de token, datas. O que NUNCA sai: valor de atributo de texto (prompt, resposta,
// caminho de arquivo, mensagem de erro), id de conversa (vira só "bate / não bate"), nome de usuário.
// Abra o arquivo e confira antes de mandar.

import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const op = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const USO = op('uso') || process.env.HENRIWORKS_USO || join(homedir(), '.henriworks', 'uso');
function outfileDoSettings() {
  for (const p of [process.env.APPDATA && join(process.env.APPDATA, 'Code', 'User', 'settings.json'), join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json'), join(homedir(), '.config', 'Code', 'User', 'settings.json')].filter(Boolean)) {
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/"github\.copilot\.chat\.otel\.outfile"\s*:\s*"([^"]+)"/);
    if (m) return m[1].replace(/\\\\/g, '\\').replace(/\$\{userHome\}|^~(?=[\\/])/, homedir());
  }
  console.error('o settings.json do VS Code não tem "github.copilot.chat.otel.outfile"');
  process.exit(2);
}
const OTEL = op('otel') === 'settings' ? outfileDoSettings() : op('otel') || process.env.COPILOT_OTEL_FILE_EXPORTER_PATH || join(USO, 'otel', 'copilot-otel.jsonl');
const ORIGEM_OTEL = op('otel') === 'settings' ? 'outfile do settings.json' : op('otel') ? '--otel' : process.env.COPILOT_OTEL_FILE_EXPORTER_PATH ? 'variável COPILOT_OTEL_FILE_EXPORTER_PATH' : 'padrão do HenriWorks';
const REPO = op('repo') || process.cwd();

// Valores de texto que podem aparecer: só estes atributos, e só se parecerem nome técnico curto.
const TEXTO_PERMITIDO = new Set(['gen_ai.request.model', 'gen_ai.response.model', 'gen_ai.operation.name', 'gen_ai.system', 'gen_ai.provider.name', 'gen_ai.agent.name', 'event.name', 'copilot_chat.mode', 'gen_ai.output.type', 'error.type', 'server.address']);
const seguro = (v) => typeof v === 'string' && v.length <= 80 && /^[\w.:\-/@ ]+$/.test(v) && !/[\\]|^[A-Za-z]:|\/(Users|home)\//.test(v);

function kv(a) {
  if (!a) return {};
  if (Array.isArray(a)) {
    const o = {};
    for (const x of a) {
      if (Array.isArray(x)) o[x[0]] = x[1];
      else if (x && x.key != null) { const v = x.value; o[x.key] = v && typeof v === 'object' ? (v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue ?? v.arrayValue ?? v) : v; }
    }
    return o;
  }
  return typeof a === 'object' ? a : {};
}
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const USO_KEYS = /tokens?$|token_count|usage/i;

const grupos = new Map();   // nome|op -> estatística
const formas = new Map();   // forma da linha (chaves do topo) -> contagem
let linhas = 0, invalidas = 0, primeira = null, ultima = null;
const convOtel = new Set();
const porAgente = new Map(); // gen_ai.agent.name -> { n, in, out, cr, aiu, modelos }

function tempo(no) {
  const v = no.startTimeUnixNano ?? no.startTime ?? no.timeUnixNano ?? no.hrTime ?? no.timestamp ?? no.time;
  if (v == null) return null;
  if (Array.isArray(v)) return new Date(num(v[0]) * 1000);
  const n = Number(v);
  if (!Number.isFinite(n)) { const d = Date.parse(v); return Number.isNaN(d) ? null : new Date(d); }
  return new Date(n > 1e17 ? n / 1e6 : n > 1e14 ? n / 1e3 : n > 1e11 ? n : n * 1000);
}

function visitar(no, prof = 0) {
  if (!no || typeof no !== 'object' || prof > 10) return;
  if (Array.isArray(no)) { for (const x of no) visitar(x, prof + 1); return; }
  const at = kv(no.attributes);
  const chaves = Object.keys(at);
  if (chaves.length && (no.name || no.body || at['event.name'] || at['gen_ai.operation.name'] || chaves.some((k) => k.startsWith('gen_ai.')))) {
    const nome = String(seguro(no.name) ? no.name : at['event.name'] && seguro(at['event.name']) ? at['event.name'] : no.name ? '(nome não seguro)' : '(sem nome)');
    const opn = seguro(at['gen_ai.operation.name']) ? at['gen_ai.operation.name'] : '-';
    const k = `${nome} | ${opn}`;
    if (!grupos.has(k)) grupos.set(k, { n: 0, comUso: 0, in: 0, out: 0, cr: 0, chaves: new Map(), modelos: new Map(), valores: new Map(), conv: 0 });
    const g = grupos.get(k);
    g.n++;
    for (const c of chaves) g.chaves.set(c, (g.chaves.get(c) || 0) + 1);
    const usoKeys = chaves.filter((c) => USO_KEYS.test(c));
    if (usoKeys.length) {
      g.comUso++;
      g.in += num(at['gen_ai.usage.input_tokens'] ?? at['gen_ai.usage.prompt_tokens']);
      g.out += num(at['gen_ai.usage.output_tokens'] ?? at['gen_ai.usage.completion_tokens']);
      g.cr += num(at['gen_ai.usage.cache_read.input_tokens'] ?? at['gen_ai.usage.cache_read_input_tokens']);
    }
    const par = `${seguro(at['gen_ai.request.model']) ? at['gen_ai.request.model'] : '-'} → ${seguro(at['gen_ai.response.model']) ? at['gen_ai.response.model'] : '-'}`;
    if (par !== '- → -') g.modelos.set(par, (g.modelos.get(par) || 0) + 1);
    for (const c of chaves) {
      if (!TEXTO_PERMITIDO.has(c) || c.endsWith('.model')) continue;
      if (seguro(at[c])) { const kk = `${c}=${at[c]}`; g.valores.set(kk, (g.valores.get(kk) || 0) + 1); }
    }
    if (usoKeys.length) {
      const ag = seguro(at['gen_ai.agent.name']) ? at['gen_ai.agent.name'] : '(sem agent.name)';
      if (!porAgente.has(ag)) porAgente.set(ag, { n: 0, in: 0, out: 0, cr: 0, aiu: 0, comAiu: 0, modelos: new Set() });
      const a = porAgente.get(ag);
      a.n++; a.in += num(at['gen_ai.usage.input_tokens']); a.out += num(at['gen_ai.usage.output_tokens']); a.cr += num(at['gen_ai.usage.cache_read.input_tokens']);
      if (at['copilot_chat.copilot_usage_nano_aiu'] != null) { a.aiu += num(at['copilot_chat.copilot_usage_nano_aiu']); a.comAiu++; }
      const m = seguro(at['gen_ai.response.model']) ? at['gen_ai.response.model'] : seguro(at['gen_ai.request.model']) ? at['gen_ai.request.model'] : '?';
      a.modelos.add(m);
    }
    if (at['gen_ai.conversation.id']) { g.conv++; convOtel.add(String(at['gen_ai.conversation.id'])); }
    const t = tempo(no);
    if (t && !Number.isNaN(t.getTime())) { if (!primeira || t < primeira) primeira = t; if (!ultima || t > ultima) ultima = t; }
  }
  for (const v of Object.values(no)) if (v && typeof v === 'object') visitar(v, prof + 1);
}

const lerJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const lerJsonl = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.jsonl')).flatMap((n) => readFileSync(join(dir, n), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)) : []);

const out = ['# Diagnóstico de uso · HenriWorks (v3)', '', `Gerado em ${new Date().toISOString()} · ${platform()} · Node ${process.versions.node}`, ''];

// 1. Configuração do exportador
out.push('## 1. Exportador OpenTelemetry', '');
out.push(`- variável COPILOT_OTEL_ENABLED: ${process.env.COPILOT_OTEL_ENABLED ? `"${process.env.COPILOT_OTEL_ENABLED}"` : 'ausente'}`);
out.push(`- variável COPILOT_OTEL_FILE_EXPORTER_PATH: ${process.env.COPILOT_OTEL_FILE_EXPORTER_PATH ? 'definida' : 'ausente'}${process.env.COPILOT_OTEL_FILE_EXPORTER_PATH && process.env.COPILOT_OTEL_FILE_EXPORTER_PATH !== OTEL ? ' (diferente do arquivo lido)' : ''}`);
const settings = [
  process.env.APPDATA && join(process.env.APPDATA, 'Code', 'User', 'settings.json'),
  join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json'),
  join(homedir(), '.config', 'Code', 'User', 'settings.json'),
].filter(Boolean).find(existsSync);
if (settings) {
  const txt = readFileSync(settings, 'utf8');
  const ks = [...txt.matchAll(/"(github\.copilot\.chat\.otel\.[\w.]+|github\.copilot\.chat\.[\w.]*telemetry[\w.]*)"\s*:\s*("[^"]*"|true|false|\d+)/g)];
  const outfile = (txt.match(/"github\.copilot\.chat\.otel\.outfile"\s*:\s*"([^"]*)"/) || [])[1];
  if (outfile && process.env.COPILOT_OTEL_FILE_EXPORTER_PATH) out.push(`- outfile do settings.json e a variável apontam para o mesmo arquivo: ${outfile.replace(/\\\\/g, '\\').toLowerCase() === process.env.COPILOT_OTEL_FILE_EXPORTER_PATH.toLowerCase() ? 'sim' : 'NÃO (pode haver dois arquivos OTel)'}`);
  out.push(`- settings.json do VS Code: ${ks.length ? ks.map((m) => `\`${m[1]}\` = ${/outfile|path|endpoint/i.test(m[1]) ? '(definido)' : m[2]}`).join('; ') : 'nenhuma chave github.copilot.chat.otel.*'}`);
} else out.push('- settings.json do VS Code: não encontrado no caminho padrão');
out.push('');

// 2. Arquivo OTel
out.push('## 2. Arquivo OTel', '', `- arquivo lido: ${ORIGEM_OTEL}`);
if (!existsSync(OTEL)) {
  out.push(`Não existe no caminho esperado (${OTEL.includes(homedir()) ? OTEL.replace(homedir(), '~') : 'caminho definido por variável'}).`, '');
} else {
  const st = statSync(OTEL);
  const rl = createInterface({ input: createReadStream(OTEL, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const l of rl) {
    if (!l.trim()) continue;
    linhas++;
    let o;
    try { o = JSON.parse(l); } catch { invalidas++; continue; }
    const forma = Object.keys(o).sort().join(',');
    formas.set(forma, (formas.get(forma) || 0) + 1);
    visitar(o);
  }
  out.push(`- tamanho: ${(st.size / 1024).toFixed(0)} KB · ${linhas} linha(s) · ${invalidas} inválida(s)`);
  out.push(`- de ${primeira ? primeira.toISOString() : '?'} até ${ultima ? ultima.toISOString() : '?'}`);
  out.push(`- formas de linha (chaves do topo): ${[...formas].slice(0, 6).map(([f, n]) => `\`{${f}}\` ×${n}`).join('; ')}`, '');

  out.push('### Registros por nome e operação', '');
  out.push('| span ou evento | operação | qtde | com token | tokens entrada | tokens saída | cache | modelos (pedido → resposta) | conversa |');
  out.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |');
  for (const [k, g] of [...grupos].sort((a, b) => b[1].n - a[1].n).slice(0, 40)) {
    const [nome, opn] = k.split(' | ');
    out.push(`| \`${nome}\` | ${opn} | ${g.n} | ${g.comUso} | ${g.in} | ${g.out} | ${g.cr} | ${[...g.modelos].slice(0, 5).map(([m, n]) => `${m} ×${n}`).join('<br>') || '-'} | ${g.conv} |`);
  }
  out.push('', '### Chamadas com token, por origem (gen_ai.agent.name)', '');
  out.push('| origem | chamadas | modelos | entrada | saída | cache | com nano_aiu | soma nano_aiu |');
  out.push('| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |');
  for (const [ag, a] of [...porAgente].sort((x, y) => y[1].in - x[1].in)) out.push(`| \`${ag}\` | ${a.n} | ${[...a.modelos].join(', ')} | ${a.in} | ${a.out} | ${a.cr} | ${a.comAiu} | ${a.aiu} |`);
  out.push('', '### Chaves de atributo por registro (só o nome da chave)', '');
  for (const [k, g] of [...grupos].sort((a, b) => b[1].n - a[1].n).slice(0, 15)) {
    out.push(`- \`${k}\`: ${[...g.chaves.keys()].sort().map((c) => `\`${c}\``).join(', ')}`);
    if (g.valores.size) out.push(`  - valores técnicos: ${[...g.valores].slice(0, 8).map(([v, n]) => `\`${v}\` ×${n}`).join(', ')}`);
  }
  out.push('');

  // O que o importador atual faz com isso
  const usados = [...grupos].filter(([k, g]) => g.comUso && g.chaves.has('gen_ai.usage.input_tokens'));
  const descartados = usados.filter(([k]) => /invoke_agent/.test(k));
  const semChavePadrao = [...grupos].filter(([, g]) => g.comUso && !g.chaves.has('gen_ai.usage.input_tokens'));
  out.push('### O que o importador do HenriWorks faz com isso', '');
  out.push(`- importa: ${usados.filter(([k]) => !/invoke_agent/.test(k)).map(([k, g]) => `\`${k}\` (${g.comUso})`).join(', ') || 'nada'}`);
  out.push(`- descarta por ser invoke_agent (total da sessão): ${descartados.map(([k, g]) => `\`${k}\` (${g.comUso}, ${g.in} tokens de entrada)`).join(', ') || 'nada'}`);
  out.push(`- tem token em outro nome de atributo, e hoje não é lido: ${semChavePadrao.map(([k]) => `\`${k}\``).join(', ') || 'nada'}`, '');
}

// 3. Dados do HenriWorks
out.push('## 3. Pasta de uso do HenriWorks', '');
const eventos = lerJsonl(join(USO, 'eventos'));
const consumo = lerJsonl(join(USO, 'consumo'));
const porEv = {};
for (const e of eventos) porEv[e.ev] = (porEv[e.ev] || 0) + 1;
const sids = new Set(eventos.map((e) => e.sid).filter(Boolean));
const comInicio = new Set(eventos.filter((e) => e.ev === 'sessionStart').map((e) => e.sid));
out.push(`- eventos dos hooks: ${Object.entries(porEv).map(([k, v]) => `${k} ${v}`).join(', ') || 'nenhum'}`);
out.push(`- sessões: ${sids.size}; sem sessionStart registrado: ${[...sids].filter((s) => !comInicio.has(s)).length}`);
out.push(`- agentes vistos (userPromptSubmitted): ${[...new Set(eventos.map((e) => e.agente).filter(Boolean))].join(', ') || 'nenhum'}`);
out.push(`- subagentes vistos (subagentStart): ${[...new Set(eventos.map((e) => e.subagente).filter(Boolean))].join(', ') || 'nenhum'}`);
out.push(`- id de conversa do OTel que bate com sessão dos hooks: ${[...convOtel].filter((c) => sids.has(c)).length} de ${convOtel.size}`);
const porModelo = {};
for (const c of consumo) porModelo[c.modelo] = (porModelo[c.modelo] || 0) + (c.in || 0) + (c.out || 0);
out.push(`- consumo importado, tokens por modelo: ${Object.entries(porModelo).map(([m, t]) => `${m} ${t}`).join(', ') || 'nenhum'}`);
const off = lerJson(join(USO, 'cache', 'otel-offset.json'));
out.push(`- offset do importador: ${off ? Object.values(off).join(', ') : 'nenhum'} byte(s)${existsSync(OTEL) ? ` · arquivo hoje: ${statSync(OTEL).size}` : ''}`);
out.push('');

// 4. Repositório
out.push('## 4. Repositório', '');
const can = lerJson(join(REPO, '.henriworks', 'estado', 'canario.json'));
const cfg = lerJson(join(REPO, '.henriworks', 'henriworks.json'));
out.push(`- canário: ${can ? `conferido ${can.conferidoEm ? 'sim' : 'não'}, isolado ${can.isolado}, hooks [${(can.hooks || []).join(', ')}], subagente "${can.subagente?.ferramenta || '-'}" com campos [${(can.subagente?.campos || []).join(', ')}]` : 'sem canario.json'}`);
out.push(`- revisaoIsolada: ${cfg ? JSON.stringify(cfg.revisaoIsolada || {}) : 'sem henriworks.json'}`);
out.push(`- ticket: ${cfg ? JSON.stringify(cfg.ticket || {}) : '-'}`);
const init = lerJson(join(REPO, '.henriworks', 'estado', 'init.json'));
if (init) out.push(`- último init: ${init.em} · ${Object.entries(init.resumo || {}).map(([k, v]) => `${k} ${v}`).join(', ')}`);
out.push('');

writeFileSync('diagnostico-uso.md', `${out.join('\n')}\n`);
console.log('gerado: diagnostico-uso.md (confira antes de mandar: não deve ter prompt, caminho nem nome de usuário)');
