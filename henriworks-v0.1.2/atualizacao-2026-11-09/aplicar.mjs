#!/usr/bin/env node
// HenriWorks 0.1.2 · atualização de 09/11/2026: tabela de preços e lista de modelos liberados.
// Sem dependência, Node 20+. Funciona em Windows (PowerShell, Git Bash) e macOS/Linux.
//
//   node <pasta-desta-atualizacao>/aplicar.mjs [caminho-do-repositorio] [--dry-run]
//
// Sem caminho, usa a pasta atual. O que faz, nesta ordem:
//   1. confere os dois JSON desta pasta e se o repositório tem o HenriWorks 0.1.2 instalado;
//   2. copia precos.json para a sua pasta de uso (~/.henriworks/uso/, ou HENRIWORKS_USO);
//   3. copia modelos-liberados.json para <repositório>/.henriworks/;
//   4. grava "modelos": { "fonte", "validadeDias" } em <repositório>/.henriworks/henriworks.json,
//      sem tocar nas outras chaves;
//   5. roda "modelos atualizar" e mostra a lista cruzada.
// Todo arquivo que já existia e muda ganha uma cópia .bak-<data> ao lado, antes de ser trocado.
// Não usa rede, não escreve no Git.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const seco = args.includes('--dry-run');
const REPO = resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const USO = resolve(process.env.HENRIWORKS_USO || join(homedir(), '.henriworks', 'uso'));
const carimbo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const FONTE_REL = '.henriworks/modelos-liberados.json';

const sair = (msg) => { console.error(`ERRO ${msg}`); process.exit(1); };
const lerJson = (p, rotulo) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return sair(`${rotulo} não é JSON válido: ${e.message}`); } };

// 1. conferências antes de escrever qualquer coisa
const precos = lerJson(join(AQUI, 'precos.json'), 'precos.json desta pasta');
const lista = lerJson(join(AQUI, 'modelos-liberados.json'), 'modelos-liberados.json desta pasta');
if (!Array.isArray(precos.modelos) || !precos.modelos.length) sair('precos.json sem "modelos"');
for (const m of precos.modelos) {
  for (const k of ['entrada', 'saida']) if (!(typeof m[k] === 'number' && m[k] > 0)) sair(`precos.json: ${m.id} com ${k} ausente ou zero`);
  try { new RegExp(m.padrao, 'i'); } catch { sair(`precos.json: padrão inválido em ${m.id}`); }
}
if (!Array.isArray(lista.modelos) || !lista.modelos.length) sair('modelos-liberados.json sem "modelos"');
if (!existsSync(join(REPO, '.henriworks', 'bin', 'modelos.mjs'))) {
  sair(`${REPO} não tem o HenriWorks 0.1.2 instalado (falta .henriworks/bin/modelos.mjs). Passe o caminho do repositório, ou rode de dentro dele.`);
}

const passos = [];
function copiar(de, para, rotulo) {
  const novo = readFileSync(de, 'utf8');
  if (existsSync(para) && readFileSync(para, 'utf8') === novo) { passos.push(`igual      ${rotulo}: ${para}`); return; }
  passos.push(`${existsSync(para) ? 'atualizar ' : 'criar     '} ${rotulo}: ${para}${existsSync(para) ? `  (cópia em .bak-${carimbo})` : ''}`);
  if (seco) return;
  mkdirSync(dirname(para), { recursive: true });
  if (existsSync(para)) copyFileSync(para, `${para}.bak-${carimbo}`);
  writeFileSync(para, novo);
}

// 2 e 3. os dois arquivos
copiar(join(AQUI, 'precos.json'), join(USO, 'precos.json'), 'tabela de preços');
copiar(join(AQUI, 'modelos-liberados.json'), join(REPO, '.henriworks', 'modelos-liberados.json'), 'lista de modelos');

// 4. henriworks.json: só a chave "modelos"
const pCfg = join(REPO, '.henriworks', 'henriworks.json');
const cfg = existsSync(pCfg) ? lerJson(pCfg, '.henriworks/henriworks.json do repositório') : {};
const desejado = { ...(cfg.modelos || {}), fonte: FONTE_REL, validadeDias: 30 };
if (JSON.stringify(cfg.modelos) === JSON.stringify(desejado)) passos.push(`igual      configuração: ${pCfg}`);
else {
  passos.push(`atualizar  configuração: ${pCfg}  ("modelos": fonte e validadeDias 30; cópia em .bak-${carimbo})`);
  if (!seco) {
    if (existsSync(pCfg)) copyFileSync(pCfg, `${pCfg}.bak-${carimbo}`);
    writeFileSync(pCfg, `${JSON.stringify({ ...cfg, modelos: desejado }, null, 2)}\n`);
  }
}

console.log(`HenriWorks · atualização de modelos e preços${seco ? '  [dry-run: nada foi escrito]' : ''}`);
console.log(`repositório: ${REPO}\npasta de uso: ${USO}\n`);
for (const p of passos) console.log(`  ${p}`);
if (seco) process.exit(0);

// 5. carrega a lista e mostra o cruzamento
console.log('');
const run = (a) => spawnSync(process.execPath, [join('.henriworks', 'bin', 'modelos.mjs'), ...a], { cwd: REPO, stdio: 'inherit', env: process.env });
const r = run(['atualizar']);
if (r.status !== 0) sair('"modelos atualizar" falhou; veja a mensagem acima.');
console.log('');
run([]);
