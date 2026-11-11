#!/usr/bin/env node
// HenriWorks - modelos liberados pela política do Copilot. Sem dependência, Node 20+.
//
//   node .henriworks/bin/modelos.mjs [--json] [--dias 30]      liberados × usados × preço
//   node .henriworks/bin/modelos.mjs atualizar [--de <fonte>] [--silencioso]
//   node .henriworks/bin/modelos.mjs conferir [--dias 30]       código 1 se houver alerta grave
//   node .henriworks/bin/modelos.mjs gerar --org <org> | --enterprise <ent> [--saida <arquivo>]
//
// Fonte (--de, ou HENRIWORKS_MODELOS_FONTE, ou "modelos.fonte" em .henriworks/henriworks.json):
//   gh:<dono>/<repo>/<caminho>.json[@ref]   arquivo publicado num repositório interno, pelo gh
//   api:org/<org> | api:enterprise/<ent>     a API de política direto (precisa de permissão de admin)
//   https://...                               URL; tenta fetch e depois curl (proxy por HTTPS_PROXY)
//   <caminho>                                 arquivo local ou de rede
// Sem fonte configurada, usa a lista de referência que vem no pacote (config/modelos-referencia.json):
// os modelos do seletor do VS Code na data do pacote. Ela não vence; só avisa que não é a política viva.
// O desenho recomendado: um job agendado com credencial de admin roda "gerar" e publica o JSON
// num repositório interno; cada dev só lê esse JSON com "gh:". Ninguém do time precisa de token admin.
//
// Guarda a lista em ~/.henriworks/uso/modelos/liberados.json e cada mudança em historico.jsonl.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { config, gravarJson, anexarJsonl, sair } from './lib/comum.mjs';
import {
  LIBERADOS, HISTORICO, precos, custo, lerTodos, normalizar, lerLiberados, diferenca, cruzar, estadoTexto,
  idadeDias, modelosDosAgentes, acharNaLista, ESTADOS, REFERENCIA, FONTE_PACOTE, ehReferencia, vencida, infoPrecos,
} from './lib/modelos.mjs';

const RAIZ = process.cwd();
const API_VERSAO = '2026-03-10';

function opcoes(argv) {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) op[k] = argv[++i];
      else op[k] = true;
    } else pos.push(a);
  }
  return { pos, op };
}

// Rotas sem "/" no começo: o Git Bash (MSYS) converte "/orgs/..." em "C:/Program Files/Git/orgs/...".
function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 1 << 24, env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
  if (r.error?.code === 'ENOENT') throw new Error('GitHub CLI (gh) não encontrado no PATH');
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || '').trim();
    if (/HTTP 403|Must have admin|Resource not accessible/i.test(msg) && /model-policies/.test(args.join(' '))) {
      throw new Error('a API de política de modelos exige owner da org (ou o papel read_enterprise_ai_controls na enterprise), e o seu token não tem. Não crie token com admin:org na sua máquina: siga com a lista de referência do pacote, ou leia o JSON que o job do time de plataforma publica (--de gh:<org>/<repo>/modelos-liberados.json)');
    }
    if (/HTTP 404/.test(msg)) throw new Error(`gh: não encontrado (404). Confira org, repositório e caminho. ${msg.split('\n')[0]}`);
    throw new Error(`gh ${args.slice(0, 2).join(' ')} falhou: ${msg.split('\n')[0]}`);
  }
  return r.stdout;
}

const apiPolitica = (escopo, nome) => gh(['api', '-H', `X-GitHub-Api-Version: ${API_VERSAO}`, `${escopo === 'org' ? 'orgs' : 'enterprises'}/${nome}/copilot/model-policies`]);

async function baixar(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    // O fetch do Node pode ignorar o proxy corporativo; o curl respeita HTTPS_PROXY.
    const c = spawnSync('curl', ['-fsSL', '--max-time', '20', url], { encoding: 'utf8', maxBuffer: 1 << 24 });
    if (c.status === 0) return c.stdout;
    throw new Error(`não consegui baixar ${url} (${e.message}; curl: ${(c.stderr || 'indisponível').trim().split('\n')[0]})`);
  }
}

async function lerFonte(fonte) {
  if (/^gh:/.test(fonte)) {
    const m = fonte.slice(3).match(/^([^/]+)\/([^/]+)\/(.+?)(?:@(.+))?$/);
    if (!m) throw new Error('formato: gh:<dono>/<repo>/<caminho>.json[@ref]');
    const [, dono, repo, caminho, ref] = m;
    return JSON.parse(gh(['api', '-H', 'Accept: application/vnd.github.raw', `repos/${dono}/${repo}/contents/${caminho}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`]));
  }
  if (/^api:/.test(fonte)) {
    const m = fonte.slice(4).match(/^(org|enterprise)\/(.+)$/);
    if (!m) throw new Error('formato: api:org/<org> ou api:enterprise/<enterprise>');
    return { escopo: `${m[1]}:${m[2]}`, obtidoEm: new Date().toISOString(), politica: JSON.parse(apiPolitica(m[1], m[2])) };
  }
  if (/^https?:\/\//.test(fonte)) return JSON.parse(await baixar(fonte));
  const p = resolve(RAIZ, fonte.replace(/^~(?=$|[\\/])/, homedir()));
  if (!existsSync(p)) throw new Error(`arquivo não encontrado: ${p}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

function consumoComCusto(dias) {
  const tabela = precos();
  const desde = dias ? Date.now() - dias * 864e5 : 0;
  const consumo = lerTodos('consumo').filter((c) => !desde || Date.parse(c.t) >= desde);
  for (const c of consumo) { const k = custo(c, tabela); c.creditos = k.usd / (tabela.credito_usd || 0.01); c.sessao = c.conv || null; }
  return { tabela, consumo };
}

const fmt = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });

function cabecalhoLista(lista, cfg) {
  if (!lista) return 'lista de política: nenhuma. Rode: node .henriworks/bin/modelos.mjs atualizar';
  const idade = idadeDias(lista);
  if (ehReferencia(lista)) return `lista: referência do pacote, ${lista.modelos.length} modelo(s) do seletor em ${new Date(lista.obtidoEm).toLocaleDateString('pt-BR')}. Para a política viva do time, configure "modelos.fonte" (README, Modelos e preços)`;
  return `lista de política: ${lista.modelos.length} modelo(s), ${lista.escopo || 'escopo não informado'}, obtida em ${new Date(lista.obtidoEm).toLocaleString('pt-BR')} (${fmt(idade, 1)} dia(s))${vencida(lista, cfg) ? ` · VENCIDA: mais de ${cfg.modelos.validadeDias} dia(s), atualize` : ''}`;
}

// ---------------------------------------------------------------- comandos

async function cmdAtualizar(op) {
  const cfg = config(RAIZ);
  const fonte = op.de || process.env.HENRIWORKS_MODELOS_FONTE || cfg.modelos.fonte || FONTE_PACOTE;
  let nova;
  try {
    nova = normalizar(fonte === FONTE_PACOTE ? JSON.parse(readFileSync(REFERENCIA, 'utf8')) : await lerFonte(fonte), fonte);
  } catch (e) {
    if (op.silencioso) { console.log(`modelos: não atualizei (${e.message}); sigo com a lista guardada`); return; }
    sair(1, `modelos: ${e.message}. A lista guardada não mudou.`);
  }
  const antes = lerLiberados();
  const mud = diferenca(antes, nova);
  gravarJson(LIBERADOS, nova);
  if (mud.length) anexarJsonl(HISTORICO, { t: new Date().toISOString(), fonte, mudancas: mud });
  const lib = nova.modelos.filter((m) => ESTADOS[m.estado]?.libera === true).length;
  console.log(`modelos: ${nova.modelos.length} ${fonte === FONTE_PACOTE ? 'na referência do pacote' : 'na política'}, ${lib} liberado(s)${antes ? `; ${mud.length ? `${mud.length} mudança(s) desde a última lista` : 'sem mudança'}` : ' (primeira lista)'}`);
  if (antes && !op.silencioso) for (const m of mud) console.log(`  ${m.id}: ${estadoTexto(m.de)} -> ${estadoTexto(m.para)}`);
}

function cmdListar(op) {
  const cfg = config(RAIZ);
  const dias = Number(op.dias) || 30;
  const lista = lerLiberados();
  const { tabela, consumo } = consumoComCusto(dias);
  const linhas = cruzar({ lista, consumo, tabela });
  if (op.json) { console.log(JSON.stringify({ lista: lista ? { escopo: lista.escopo, obtidoEm: lista.obtidoEm, fonte: lista.fonte } : null, dias, modelos: linhas }, null, 2)); return linhas; }
  console.log(cabecalhoLista(lista, cfg));
  const ip = infoPrecos();
  console.log(`uso: últimos ${dias} dia(s) · preço: tabela ${ip.origem === 'usuario' ? 'sua (~/.henriworks/uso/precos.json)' : 'do pacote'}, de ${tabela.consultado_em || '?'}`);
  for (const a of ip.avisos) console.log(`aviso ${a}`);
  console.log('');
  if (!linhas.length) { console.log('nenhum modelo na lista nem no consumo.'); return linhas; }
  const w = Math.min(Math.max(...linhas.map((l) => l.id.length), 6), 34);
  console.log(`${'modelo'.padEnd(w)}  ${'política'.padEnd(22)}  ${'sessões'.padStart(7)}  ${'créditos'.padStart(9)}  preço`);
  for (const l of linhas) {
    console.log(`${l.id.slice(0, w).padEnd(w)}  ${estadoTexto(l.estado).padEnd(22)}  ${String(l.sessoes).padStart(7)}  ${fmt(l.creditos, 1).padStart(9)}  ${l.preco ? 'sim' : 'NÃO'}`);
    for (const a of l.alertas) console.log(`${''.padEnd(w)}  ${a.sev === 'crit' ? '!!' : a.sev === 'warn' ? '! ' : '· '} ${a.txt}`);
  }
  return linhas;
}

function cmdConferir(op) {
  const cfg = config(RAIZ);
  const lista = lerLiberados();
  const { tabela, consumo } = consumoComCusto(Number(op.dias) || 30);
  const graves = [];
  for (const l of cruzar({ lista, consumo, tabela })) for (const a of l.alertas) if (a.sev === 'crit') graves.push(`${l.id}: ${a.txt}`);
  for (const a of infoPrecos().avisos) console.log(`aviso ${a}`);
  if (vencida(lista, cfg)) graves.push(`a lista tem ${fmt(idadeDias(lista), 0)} dia(s): atualize com "modelos atualizar"`);
  // model: de agentes do repositório e do usuário precisa apontar para modelo liberado.
  const dirs = [join(RAIZ, '.github', 'agents'), join(process.env.COPILOT_HOME || join(homedir(), '.copilot'), 'agents')];
  for (const a of modelosDosAgentes(dirs)) {
    if (!lista) { graves.push(`${a.agente} fixa model: ${a.modelos.join(', ')}, e não há lista de política para conferir`); continue; }
    const ok = a.modelos.filter((n) => ESTADOS[acharNaLista(n, lista)?.estado]?.libera === true);
    if (!ok.length) graves.push(`${a.agente}: nenhum dos modelos em model: está liberado (${a.modelos.join(', ')})`);
    else if (ok.length < a.modelos.length) console.log(`aviso ${a.agente}: ${a.modelos.filter((n) => !ok.includes(n)).join(', ')} fora da política; usa ${ok[0]}`);
  }
  if (!graves.length) { console.log(`modelos: nada grave. ${cabecalhoLista(lista, cfg)}`); return; }
  for (const g of graves) console.log(`GRAVE ${g}`);
  process.exit(1);
}

function cmdGerar(op) {
  const escopo = op.org ? 'org' : op.enterprise ? 'enterprise' : null;
  if (!escopo || op[escopo] === true) sair(2, 'uso: modelos gerar --org <org> | --enterprise <enterprise> [--saida <arquivo>]');
  let bruto;
  try { bruto = JSON.parse(apiPolitica(escopo, op[escopo])); } catch (e) { sair(1, `modelos gerar: ${e.message}. A API de política exige permissão de admin (veja README, seção Uso e custo).`); }
  const saida = { obtidoEm: new Date().toISOString(), escopo: `${escopo}:${op[escopo]}`, politica: bruto };
  normalizar(saida, 'gerar');   // falha aqui se a resposta mudou de formato, antes de publicar lixo
  const texto = `${JSON.stringify(saida, null, 2)}\n`;
  if (op.saida && op.saida !== true) { mkdirSync(dirname(resolve(op.saida)), { recursive: true }); writeFileSync(resolve(op.saida), texto); console.log(`modelos: ${bruto.models?.length ?? 0} modelo(s) em ${op.saida}`); } else process.stdout.write(texto);
}

const [cmd, ...resto] = process.argv.slice(2);
const { op } = opcoes(cmd && !cmd.startsWith('--') ? resto : process.argv.slice(2));
if (!cmd || cmd.startsWith('--') || cmd === 'listar') cmdListar(op);
else if (cmd === 'atualizar') await cmdAtualizar(op);
else if (cmd === 'conferir') cmdConferir(op);
else if (cmd === 'gerar') cmdGerar(op);
else sair(2, readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
