// HenriWorks - funções compartilhadas pelos scripts de .henriworks/bin/. Sem dependência, Node 20+.
// Lê Git, nunca escreve Git.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir } from 'node:os';

export const HW = '.henriworks';
export const CHANGES = join(HW, 'changes');
export const ARCHIVE = join(CHANGES, 'archive');
export const ESTADO = join(HW, 'estado');
export const INSTRUCOES = ['AGENTS.md', '.github/copilot-instructions.md'];

export const USO_DIR = resolve(process.env.HENRIWORKS_USO || join(homedir(), '.henriworks', 'uso'));

export function sair(codigo, msg) {
  if (msg) (codigo === 0 ? console.log : console.error)(msg);
  process.exit(codigo);
}

export const barra = (p) => String(p).replace(/\\/g, '/');
export const linhasDe = (t) => (t || '').split(/\r?\n/);
export const ler = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

export function lerJson(p, padrao = null) {
  if (!existsSync(p)) return padrao;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return padrao;
  }
}

export function gravarJson(p, obj) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`);
}

export function anexarJsonl(p, obj) {
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, `${JSON.stringify(obj)}\n`);
}

// ------------------------------------------------------------------------ git

export function git(args, { cwd = process.cwd(), permitirFalha = false, input } = {}) {
  const r = spawnSync('git', ['-c', 'core.quotePath=false', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 28, input });
  if (r.status !== 0) {
    if (permitirFalha) return null;
    sair(2, `git ${args.join(' ')} falhou: ${(r.stderr || '').trim()}`);
  }
  return r.stdout;
}

export const raizGit = (cwd = process.cwd()) => (git(['rev-parse', '--show-toplevel'], { cwd, permitirFalha: true }) || '').trim() || null;
export const branchAtual = (cwd) => (git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, permitirFalha: true }) || '').trim() || null;
export const headCurto = (cwd) => (git(['rev-parse', '--short=7', 'HEAD'], { cwd, permitirFalha: true }) || '').trim() || null;

export function mergeBase(base, cwd) {
  for (const ref of [base, `origin/${base}`]) {
    const r = git(['merge-base', ref, 'HEAD'], { cwd, permitirFalha: true });
    if (r) return r.trim();
  }
  sair(2, `sem merge-base entre "${base}" e HEAD. Faça fetch de ${base}.`);
}

export function hashArquivo(caminho, cwd) {
  const r = spawnSync('git', ['hash-object', '--', caminho], { cwd, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// Alteração não commitada que importa: fora de .henriworks/ (excluído do Git de todo jeito),
// fora dos arquivos de instrução e fora dos extras informados.
export function naoCommitados(cwd, extras = []) {
  return linhasDe(git(['status', '--porcelain', '--untracked-files=all'], { cwd, permitirFalha: true }) || '')
    .filter((l) => l.trim())
    .map((l) => barra(l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop()))
    .filter((p) => !p.startsWith(`${HW}/`) && !INSTRUCOES.includes(p) && !extras.some((e) => p.startsWith(e)));
}

// ------------------------------------------------------------------ config

export function config(cwd = process.cwd()) {
  const padrao = {
    versionarArtefatos: false,
    bloquearGitNoAgente: false,
    conhecimento: 'conhecimento/',
    ticket: { padrao: '[A-Z][A-Z0-9]+-\\d+' },
    revisaoIsolada: { conferirPacote: 'off', modoEstrito: false },
    sobreposicao: { travaArquivo: 'off' },
    mapa: { primeiroAntesDeBusca: 'negar-uma-vez', orcamentoSaida: 2000 },
    uso: { coletar: true, alertas: [0.5, 0.8, 1.0] },
    modelos: { fonte: null, validadeDias: 7 },
  };
  const lido = lerJson(join(cwd, HW, 'henriworks.json'), {});
  const out = { ...padrao, ...lido };
  for (const k of ['ticket', 'revisaoIsolada', 'sobreposicao', 'mapa', 'uso', 'modelos']) out[k] = { ...padrao[k], ...(lido[k] || {}) };
  return out;
}

// ------------------------------------------------------------------ globs

export function globParaRegex(g) {
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        const comBarra = g[i + 2] === '/';
        re += comBarra ? '(?:.*/)?' : '.*';
        i += comBarra ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

// Um item de Toca: pasta terminada em "/", glob, ou arquivo. Devolve um teste de caminho.
export function tocaParaTeste(item) {
  const t = barra(item.trim()).replace(/^\.\//, '');
  if (!t) return () => false;
  if (t.endsWith('/')) return (p) => barra(p).startsWith(t);
  if (/[*?]/.test(t)) {
    const re = globParaRegex(t);
    return (p) => re.test(barra(p));
  }
  return (p) => barra(p) === t || barra(p).startsWith(`${t}/`);
}

// Dois itens de Toca se sobrepõem quando um caminho poderia casar com os dois.
export function tocasSobrepoem(a, b) {
  const base = (x) => barra(x).replace(/[*?].*$/, '');
  for (const x of a) {
    for (const y of b) {
      const bx = base(x);
      const by = base(y);
      if (bx.startsWith(by) || by.startsWith(bx)) return [x, y];
    }
  }
  return null;
}

// --------------------------------------------------------------- mudanças

export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function mudancasAbertas(cwd = process.cwd()) {
  const dir = join(cwd, CHANGES);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n !== 'archive' && !n.startsWith('.') && statSync(join(dir, n)).isDirectory());
}

export function dirMudanca(id, cwd = process.cwd()) {
  if (!id || !ID_RE.test(id)) sair(2, `change-id inválido: "${id || ''}". Abertas: ${mudancasAbertas(cwd).join(', ') || 'nenhuma'}`);
  const d = join(cwd, CHANGES, id);
  if (!existsSync(d)) sair(2, `mudança ${id} não existe. Abertas: ${mudancasAbertas(cwd).join(', ') || 'nenhuma'}`);
  return d;
}

export function metadados(dir) {
  const txt = ler(join(dir, 'proposta.md')) || '';
  const pre = txt.split(/^##\s+/m)[0];
  const campo = (n) => (pre.match(new RegExp(`^\\s*${n}\\s*:\\s*(.+?)\\s*$`, 'mi')) || [])[1] || null;
  return {
    ticket: campo('Ticket'),
    branch: campo('Branch'),
    base: campo('Base'),
    inicio: campo('In[ií]cio'),
    fim: campo('Fim'),
    rigor: campo('Rigor'),
  };
}

// ----------------------------------------------------------------- fatias
// Uma fatia por arquivo em tarefas/NN-<slug>.md. O índice tarefas/index.md é gerado daqui.

export function lerFatias(dir) {
  const pasta = join(dir, 'tarefas');
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta)
    .filter((n) => /^\d{2}-[a-z0-9-]+\.md$/.test(n))
    .sort()
    .map((n) => lerFatia(join(pasta, n)));
}

export function lerFatia(arquivo) {
  const txt = readFileSync(arquivo, 'utf8');
  const ls = linhasDe(txt);
  const nome = basename(arquivo);
  const num = nome.slice(0, 2);
  const titulo = ((ls.find((l) => /^#\s+/.test(l)) || '').match(/^#\s+(?:\d+\.?\s+)?(.+?)\s*$/) || [])[1] || nome;
  const campo = (n) => {
    const l = ls.find((x) => new RegExp(`^\\s*${n}\\s*:`, 'i').test(x));
    return l ? l.replace(new RegExp(`^\\s*${n}\\s*:\\s*`, 'i'), '').trim() : null;
  };
  const itens = [];
  ls.forEach((l, i) => {
    const m = l.match(/^\s*-\s*\[([ xX])\]\s+(\d+(?:\.\d+)*)?\s*(.*)$/);
    if (m) itens.push({ linha: i + 1, feito: m[1] === 'x', marcadorX: m[1] === 'X', numero: m[2] || null, texto: m[3], manual: /\(manual\)\s*$/i.test(m[3]), evidencia: ((ls[i + 1] || '').match(/^\s+Evid[êe]ncia\s*:\s*(.*)$/i) || [])[1] || null });
  });
  const bloqueado = campo('Bloqueado por');
  const tocaTxt = campo('Toca');
  const verificacao = /verifica/i.test(titulo) || /verificacao/.test(nome);
  return {
    arquivo,
    nome,
    num,
    titulo,
    demonstra: campo('Demonstra'),
    bloqueadoTxt: bloqueado,
    bloqueadoPor: parseBloqueio(bloqueado),
    todos: /^todos$/i.test((bloqueado || '').trim()),
    toca: tocaTxt ? tocaTxt.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean) : [],
    tocaTxt,
    executor: campo('Executor') || 'hwk-implementador',
    escopo: campo('Escopo'),
    verificacao,
    itens,
    feita: itens.length > 0 && itens.every((i) => i.feito),
    iniciada: itens.some((i) => i.feito),
    texto: txt,
  };
}

function parseBloqueio(raw) {
  const t = (raw || '').trim();
  if (!t || /^(nenhum|nenhuma|-|n\/a)$/i.test(t) || /^todos$/i.test(t)) return [];
  return t.split(/[,;\s]+|\se\s/).map((x) => x.replace(/\D/g, '')).filter(Boolean).map((x) => x.padStart(2, '0'));
}

// Frontier: fatias não feitas cujos bloqueios estão todos feitos. "todos" espera as demais.
export function frontier(fatias) {
  const feitas = new Set(fatias.filter((f) => f.feita).map((f) => f.num));
  return fatias.filter((f) => {
    if (f.feita) return false;
    if (f.todos) return fatias.every((o) => o === f || o.feita);
    return f.bloqueadoPor.every((b) => feitas.has(b));
  });
}

// Grupos que podem rodar juntos: sem aresta entre si (garantido pela frontier) e Toca disjunto.
export function paralelizaveis(prontas) {
  const ok = [];
  for (const f of prontas) {
    if (f.verificacao || f.toca.length === 0) continue;
    if (ok.every((o) => !tocasSobrepoem(o.toca, f.toca))) ok.push(f);
  }
  return ok;
}

// ------------------------------------------------------------- vereditos

export const EIXOS_CODIGO = ['spec', 'padroes', 'plantao'];
export const ESTAGIOS_SPEC = ['zoom-out', 'compreensao', 'design', 'zoom-out-2', 'prontidao'];

export function vereditoVigente(pasta, eixo, head) {
  if (!existsSync(pasta)) return null;
  const re = new RegExp(`^${eixo}-${head}(?:-(\\d+))?\\.md$`);
  return readdirSync(pasta)
    .map((n) => ({ n, m: n.match(re) }))
    .filter((x) => x.m)
    .map((x) => ({ arquivo: join(pasta, x.n), nome: x.n, ordem: x.m[1] ? Number(x.m[1]) : 1 }))
    .sort((a, b) => b.ordem - a.ordem)[0] || null;
}

export function ultimoVeredito(pasta, eixo) {
  if (!existsSync(pasta)) return null;
  const re = new RegExp(`^${eixo}-([0-9a-f]{7})(?:-(\\d+))?\\.md$`);
  const lista = readdirSync(pasta)
    .map((n) => ({ n, m: n.match(re) }))
    .filter((x) => x.m)
    .map((x) => ({ arquivo: join(pasta, x.n), nome: x.n, mtime: statSync(join(pasta, x.n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return lista[0] || null;
}

export const aprovado = (arquivo) => /^# [\w-]+ - APROVADO/.test(readFileSync(arquivo, 'utf8'));

// ------------------------------------------------------------- ticket

export function ticketDaSessao(cwd = process.cwd()) {
  const cfg = config(cwd);
  const fixo = lerJson(join(cwd, ESTADO, 'ticket.json'));
  if (fixo?.ticket) return { ticket: fixo.ticket, origem: 'fixado' };
  const branch = branchAtual(cwd);
  for (const id of mudancasAbertas(cwd)) {
    const m = metadados(join(cwd, CHANGES, id));
    if (m.branch && m.branch === branch && m.ticket && !/sem ticket/i.test(m.ticket)) return { ticket: m.ticket, origem: `proposta de ${id}` };
  }
  const re = new RegExp(cfg.ticket.padrao);
  const t = branch && branch.match(re);
  if (t) return { ticket: t[0], origem: 'branch' };
  return { ticket: null, origem: 'nenhuma' };
}

export function mudancaDaBranch(cwd = process.cwd()) {
  const branch = branchAtual(cwd);
  return mudancasAbertas(cwd).find((id) => metadados(join(cwd, CHANGES, id)).branch === branch) || null;
}

// Prompt da chamada de subagente para um peixinho. É fixo e curto de propósito: o conteúdo vem
// do arquivo do pacote, gerado por script. O hook confere que o orquestrador não acrescentou nada.
export const promptDoPacote = (caminho) =>
  `Pacote de revisão: ${caminho}. Leia esse arquivo e apenas os arquivos que ele lista. Responda só no formato que ele pede.`;
