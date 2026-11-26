#!/usr/bin/env node
// Copia o uso do b.IA Credit Hive para uma pasta nova, trocando o que identifica pessoa, repositório e trabalho
// por apelidos estáveis (repo-1, branch-1, TICKET-1, dev-1, sessao-1). Não altera nada em ~/.bchive/uso/.
//
//   node anonimizar-uso.mjs [--mes 2026-11] [--saida ~/Downloads/uso-anonimo]
//
// Leva: eventos do mês, até 5 sessões, consumo do mês (se houver) e o export mais recente.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, userInfo } from 'node:os';

const args = process.argv.slice(2);
const op = (k, p) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : p; };
const USO = join(homedir(), '.bchive', 'uso');
const MES = op('mes', new Date().toISOString().slice(0, 7));
const SAIDA = op('saida', join(homedir(), 'Downloads', 'uso-anonimo')).replace(/^~(?=\/|$)/, homedir());
if (!existsSync(USO)) { console.error(`não achei ${USO}`); process.exit(2); }

const ler = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const arquivos = [];
const add = (rel) => { const t = ler(join(USO, rel)); if (t) arquivos.push([rel, t]); };
add(join('eventos', `${MES}.jsonl`));
add(join('consumo', `${MES}.jsonl`));
const pS = join(USO, 'sessoes');
if (existsSync(pS)) readdirSync(pS).filter((n) => n.endsWith('.json')).map((n) => [n, statSync(join(pS, n)).mtimeMs]).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([n]) => add(join('sessoes', n)));
const pE = join(USO, 'exportar');
if (existsSync(pE)) { const n = readdirSync(pE).filter((x) => x.endsWith('.json')).sort().pop(); if (n) add(join('exportar', n)); }
if (!arquivos.length) { console.error(`nada para o mês ${MES} em ${USO}`); process.exit(2); }

// Valores a esconder: tirados dos próprios eventos e sessões, mais o usuário da máquina.
const mapas = { repo: new Map(), branch: new Map(), ticket: new Map(), sid: new Map(), trace: new Map(), conv: new Map() };
const nomes = { repo: 'repo', branch: 'branch', ticket: 'TICKET', sid: 'sessao', trace: 'trace', conv: 'conversa' };
const marcar = (k, v) => { if (typeof v === 'string' && v.length > 2 && !['main', 'master'].includes(v) && !mapas[k].has(v)) mapas[k].set(v, `${nomes[k]}-${mapas[k].size + 1}`); };
for (const [, t] of arquivos) for (const l of t.split('\n')) {
  let o; try { o = JSON.parse(l); } catch { continue; }
  for (const k of Object.keys(mapas)) marcar(k, o[k]);
}
for (const [rel] of arquivos) if (rel.startsWith('sessoes')) marcar('sid', rel.replace(/^sessoes[\\/]/, '').replace(/\.json$/, ''));
const trocas = [[userInfo().username, 'dev-1'], ...Object.values(mapas).flatMap((m) => [...m])].sort((a, b) => b[0].length - a[0].length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ticketRe = /\b[A-Z][A-Z0-9]+-\d+\b/g;
const tickets = new Map();
const limpar = (t) => {
  let s = t;
  for (const [de, para] of trocas) s = s.replace(new RegExp(esc(de), 'g'), para);
  return s.replace(ticketRe, (m) => (tickets.has(m) ? tickets.get(m) : (tickets.set(m, `TICKET-${tickets.size + 1}`), tickets.get(m))));
};

for (const [rel, t] of arquivos) {
  const destino = join(SAIDA, limpar(rel));
  mkdirSync(join(destino, '..'), { recursive: true });
  writeFileSync(destino, limpar(t));
  console.log(`ok ${destino}`);
}
console.log(`\n${arquivos.length} arquivo(s) em ${SAIDA}. Confira antes de mandar: nenhum nome de repositório, branch, ticket ou usuário deve sobrar.`);
