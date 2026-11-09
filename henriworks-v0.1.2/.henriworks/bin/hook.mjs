#!/usr/bin/env node
// HenriWorks - hook único do harness Copilot. Sem dependência, Node 20+.
//
//   node .henriworks/bin/hook.mjs <evento> [--agente <nome>]
//
// Lê o JSON do evento no stdin. Roda em todo agente do workspace, então é curto e nunca
// derruba a sessão: qualquer erro termina com saída vazia e código 0 (sem decisão).
//
// O que faz, por evento:
//   sessionStart         registra a sessão (repo, branch, ticket, mudança) e avisa orçamento
//   userPromptSubmitted  (escopado no agente) registra qual agente hwk-* está em uso
//   preToolUse           coleta + guardas: veredito e archive imutáveis, Git no agente (opcional),
//                        pacote literal do peixinho (C), mapa antes de busca, trava de arquivo
//   postToolUse          atualiza o mapa do arquivo editado, em segundo plano
//   subagentStart        registra o nome do subagente
//   sessionEnd           importa o OTel novo, em segundo plano
// Nunca grava prompt, resposta, argumento de ferramenta nem texto de comando.

import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, basename, dirname, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USO_DIR, config, lerJson, gravarJson, anexarJsonl, linhasDe, promptDoPacote, tocaParaTeste, barra } from './lib/comum.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const evento = process.argv[2] || '';
const agenteEscopo = process.argv.includes('--agente') ? process.argv[process.argv.indexOf('--agente') + 1] : null;
let saiu = false;
const responder = (obj) => { if (!saiu) { saiu = true; process.stdout.write(JSON.stringify(obj)); } };
const negar = (motivo, tag) => { registrar({ decisao: 'negar', motivo: tag }); responder({ permissionDecision: 'deny', permissionDecisionReason: `HenriWorks: ${motivo}` }); };
let ctx = null;

function textos(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => textos(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => textos(x, out));
  return out;
}

function registrar(extra = {}) {
  if (!ctx || !ctx.cfg.uso.coletar) return;
  try {
    const t = new Date().toISOString();
    anexarJsonl(join(USO_DIR, 'eventos', `${t.slice(0, 7)}.jsonl`), { t, ev: ctx.ev, sid: ctx.sid, repo: ctx.repo, ...(ctx.agente ? { agente: ctx.agente } : {}), ...extra });
  } catch { /* coleta nunca atrapalha */ }
}

function sessao(sid) {
  const p = join(USO_DIR, 'sessoes', `${String(sid).replace(/[^\w.-]/g, '_')}.json`);
  return { p, s: lerJson(p, {}) };
}

function categoria(nome, args) {
  const n = nome.toLowerCase();
  if (/task|runsubagent|subagent|^agent$/.test(n)) return 'subagente';
  if (/edit|create|write|patch|replace|insert|delete|remove|rename|move/.test(n)) return 'escrita';
  if (/bash|powershell|shell|terminal|execute|run_in|runin|command/.test(n)) {
    // Só comando de terminal conta como uso do fluxo ou do mapa; texto de arquivo editado, não.
    const tx = textos(args).join(' ');
    if (/henrimap\.mjs/.test(tx)) return 'mapa';
    if (/hwk\.mjs/.test(tx)) return 'hwk';
    return 'terminal';
  }
  if (/search|grep|find|codebase|semantic|glob|usages|list_code/.test(n)) return 'busca';
  if (/read|view|open|fetch_file|get_file/.test(n)) return 'leitura';
  return 'outra';
}

const caminhoAlvo = (args) => {
  for (const k of ['filePath', 'file_path', 'path', 'target_file', 'uri', 'file']) if (typeof args?.[k] === 'string') return args[k];
  return null;
};

async function principal() {
  let bruto = '';
  try { bruto = readFileSync(0, 'utf8'); } catch { /* sem stdin */ }
  const e = JSON.parse(bruto || '{}');
  const cwd = e.cwd || process.cwd();
  if (!existsSync(join(cwd, '.henriworks'))) return;
  process.chdir(cwd);
  const sid = e.session_id || e.sessionId || 'sem-sessao';
  const nome = String(e.tool_name || e.toolName || '');
  let args = e.tool_input ?? e.toolArgs ?? {};
  if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { texto: args }; } }
  const agenteSub = e.agent_type || e.agentType || null;
  ctx = { ev: evento, sid, repo: basename(cwd), cfg: config(cwd), agente: agenteEscopo || agenteSub, agenteId: e.agent_id || e.agentId || null };

  // Canário: enquanto preparado e não conferido, registra o formato real dos eventos.
  const can = lerJson(join(cwd, '.henriworks', 'estado', 'canario.json'));
  const canAtivo = can && !can.conferidoEm;

  if (evento === 'sessionStart') {
    const { p, s } = sessao(sid);
    const git = (a) => (spawnSync('git', a, { cwd, encoding: 'utf8' }).stdout || '').trim();
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const t = spawnSync(process.execPath, [join(AQUI, 'hwk.mjs'), 'estado', '--json'], { cwd, encoding: 'utf8', timeout: 4000 });
    let est = {};
    try { est = JSON.parse(t.stdout || '{}'); } catch { /* sem estado */ }
    const change = (est.mudancas || []).find((m) => m.branch === branch)?.id || null;
    gravarJson(p, { ...s, inicio: s.inicio || new Date().toISOString(), repo: ctx.repo, branch, ticket: est.ticket?.ticket || null, change });
    registrar({ branch, ticket: est.ticket?.ticket || null, change });
    if (canAtivo) anexarJsonl(join(cwd, '.henriworks', 'estado', 'canario-hooks.jsonl'), { t: new Date().toISOString(), ev: evento, campos: Object.keys(e) });
    if (existsSync(join(USO_DIR, 'orcamentos.json'))) {
      const a = spawnSync(process.execPath, [join(AQUI, 'uso.mjs'), 'alerta'], { cwd, encoding: 'utf8', timeout: 4000 });
      if ((a.stdout || '').trim()) responder({ additionalContext: a.stdout.trim() });
    }
    return;
  }

  if (evento === 'userPromptSubmitted') {
    if (agenteEscopo) {
      const { p, s } = sessao(sid);
      gravarJson(p, { ...s, hwk: s.hwk || /^hwk/.test(agenteEscopo), agentes: [...new Set([...(s.agentes || []), agenteEscopo])] });
    }
    registrar();
    return;
  }

  if (evento === 'subagentStart') {
    registrar({ subagente: e.agentName || e.agent_name || agenteSub || null });
    if (canAtivo) anexarJsonl(join(cwd, '.henriworks', 'estado', 'canario-hooks.jsonl'), { t: new Date().toISOString(), ev: evento, campos: Object.keys(e) });
    return;
  }

  if (evento === 'sessionEnd') {
    registrar();
    const filho = spawn(process.execPath, [join(AQUI, 'uso.mjs'), 'importar'], { cwd, detached: true, stdio: 'ignore', windowsHide: true });
    filho.unref();
    return;
  }

  if (evento === 'postToolUse') {
    const cat = categoria(nome, args);
    const alvo = caminhoAlvo(args);
    if (cat === 'escrita' && alvo && existsSync(join(cwd, '.henriworks', 'mapa', 'graph.json'))) {
      const rel = barra(isAbsolute(alvo) ? relative(cwd, alvo) : alvo);
      if (!rel.startsWith('..') && !rel.startsWith('.henriworks/')) {
        const filho = spawn(process.execPath, [join(AQUI, 'henrimap.mjs'), 'atualizar', rel], { cwd, detached: true, stdio: 'ignore', windowsHide: true });
        filho.unref();
      }
    }
    return;
  }

  if (evento !== 'preToolUse') return;

  const cat = categoria(nome, args);
  const texto = textos(args).join('\n').replace(/\\/g, '/');
  const { p: pSes, s: ses } = sessao(sid);
  registrar({ ferramenta: nome, cat });

  // Canário: formato real da chamada de subagente, para a conferência do pacote.
  if (canAtivo && cat === 'subagente') {
    const strs = Object.entries(args || {}).filter(([, v]) => typeof v === 'string');
    const campoPrompt = strs.sort((a, b) => b[1].length - a[1].length)[0]?.[0] || null;
    anexarJsonl(join(cwd, '.henriworks', 'estado', 'canario-hooks.jsonl'), { t: new Date().toISOString(), ev: evento, subagente: true, ferramenta: nome, campos: Object.keys(args || {}), campoPrompt });
  } else if (canAtivo) {
    anexarJsonl(join(cwd, '.henriworks', 'estado', 'canario-hooks.jsonl'), { t: new Date().toISOString(), ev: evento });
  }

  // 1. Registros imutáveis: veredito, revisão de spec e mudança arquivada.
  const imutavel = /\.henriworks\/changes\/(?:[^\s"'`]*\/(?:revisao|revisao-spec)\/|archive\/)/;
  const escreveNoTerminal = /(>|\brm\b|\bmv\b|\bcp\b|sed\s+-i|\btee\b|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|\bdel\b)/i;
  if (cat === 'escrita' && imutavel.test(texto)) return negar('veredito, revisão de spec e mudança arquivada não se editam. Veredito novo: node .henriworks/bin/hwk.mjs gravar-veredito.', 'imutavel');
  if (['terminal', 'hwk', 'mapa'].includes(cat) && imutavel.test(texto) && escreveNoTerminal.test(texto)) return negar('o terminal não escreve em vereditos nem em mudanças arquivadas.', 'imutavel');

  // 2. Git no agente, quando o time pede trava técnica.
  if (['terminal', 'hwk', 'mapa'].includes(cat) && ctx.cfg.bloquearGitNoAgente === true && /\bgit\s+(-\S+\s+)*(commit|push|merge|rebase|reset|cherry-pick|revert|tag|checkout\s+-b|switch\s+(-c|--create)|branch\s+(-[dDmM]|--delete|--move))\b/.test(texto)) {
    return negar('o fluxo não escreve no Git. Revise o diff e commite você mesmo.', 'git');
  }

  // 3. Pacote literal do peixinho (isolamento C). Só liga depois do canário.
  if (cat === 'subagente' && ctx.cfg.revisaoIsolada.conferirPacote === 'negar') {
    const alvoGf = texto.match(/\bhwk-gf-[\w-]+/);
    if (alvoGf) {
      const campo = ctx.cfg.revisaoIsolada.campoPrompt;
      const prompt = (campo && typeof args[campo] === 'string' ? args[campo] : Object.values(args || {}).filter((v) => typeof v === 'string').sort((a, b) => b.length - a.length)[0] || '').trim();
      const m = prompt.match(/^Pacote de revisão: (\S+?)\. Leia esse arquivo/);
      const reg = linhasDe(existsSync(join(cwd, '.henriworks', 'estado', 'pacotes.jsonl')) ? readFileSync(join(cwd, '.henriworks', 'estado', 'pacotes.jsonl'), 'utf8') : '').filter(Boolean).map((l) => JSON.parse(l));
      const r = m && reg.filter((x) => x.arquivo === m[1]).pop();
      const hAtual = r && existsSync(join(cwd, r.arquivo)) ? createHash('sha256').update(readFileSync(join(cwd, r.arquivo), 'utf8')).digest('hex') : null;
      if (!m || prompt !== promptDoPacote(m[1]) || !r || hAtual !== r.hash) {
        return negar('o peixinho só recebe o prompt literal gerado por "node .henriworks/bin/hwk.mjs pacote-revisao", sem nada acrescentado, e o pacote não pode ter sido editado.', 'pacote');
      }
    }
  }

  // 4. Trava de arquivo entre fatias (opcional): só subagente com fatia reivindicada.
  if (ctx.agenteId) {
    const pAg = join(cwd, '.henriworks', 'estado', 'agentes.json');
    const mapa = lerJson(pAg, {});
    const rv = texto.match(/hwk\.mjs\s+reivindicar\s+([a-z0-9-]+)\s+(\d{2})/);
    if (cat === 'hwk' && rv) {
      mapa[ctx.agenteId] = { change: rv[1], fatia: rv[2] };
      gravarJson(pAg, mapa);
    }
    const alvo = caminhoAlvo(args);
    const minha = mapa[ctx.agenteId];
    if (cat === 'escrita' && alvo && minha) {
      const rel = barra(isAbsolute(alvo) ? relative(cwd, alvo) : alvo);
      anexarJsonl(join(cwd, '.henriworks', 'estado', 'edicoes.jsonl'), { t: new Date().toISOString(), change: minha.change, fatia: minha.fatia, arquivo: rel });
      if (ctx.cfg.sobreposicao.travaArquivo === 'negar') {
        const ativas = lerJson(join(cwd, '.henriworks', 'estado', 'reivindicacoes.json'), { ativas: [] }).ativas;
        const outra = ativas.find((a) => a.change === minha.change && a.fatia !== minha.fatia && a.toca.some((t) => tocaParaTeste(t)(rel)));
        if (outra) return negar(`${rel} pertence à fatia ${outra.fatia}, em andamento. Siga com as outras tarefas e registre a dependência; o coordenador abre o cartão de decisão.`, 'trava');
      }
    }
  }

  // 5. Mapa antes de busca, numa sessão do fluxo.
  if (cat === 'mapa' || cat === 'hwk') {
    if (!ses.hwk) gravarJson(pSes, { ...ses, hwk: true });
    return;
  }
  if (cat === 'busca' && ses.hwk && ctx.cfg.mapa.primeiroAntesDeBusca === 'negar-uma-vez' && !ses.mapaNegado) {
    const marca = join(cwd, '.henriworks', 'estado', 'mapa-consultado');
    const consultou = existsSync(marca) && ses.inicio && statSync(marca).mtimeMs >= Date.parse(ses.inicio);
    if (!consultou) {
      gravarJson(pSes, { ...ses, mapaNegado: true });
      return negar('consulte o mapa antes de varrer arquivos: node .henriworks/bin/henrimap.mjs query "<termo>" (ou explain, affected). Esta negação acontece uma vez por sessão.', 'mapa-primeiro');
    }
  }
}

try {
  await principal();
} catch {
  /* sem decisão */
}
if (!saiu) process.stdout.write('{}');
process.exit(0);
