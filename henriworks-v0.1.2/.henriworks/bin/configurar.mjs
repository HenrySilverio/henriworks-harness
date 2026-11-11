#!/usr/bin/env node
// HenriWorks - configura verificacao.json e padroes.md a partir do que o repositório já tem.
// Sem dependência, Node 20+. Base do /hwk-configurar. Rode da raiz do repositório.
//
//   node .henriworks/bin/configurar.mjs verificacao            propõe (estado/verificacao.proposta.json) e mostra o diff
//   node .henriworks/bin/configurar.mjs verificacao --provar   roda cada comando da proposta uma vez por camada
//   node .henriworks/bin/configurar.mjs verificacao --gravar   instala a proposta, com backup do atual
//   node .henriworks/bin/configurar.mjs padroes                mapa de padrões e lista das fontes para o rascunho
//   node .henriworks/bin/configurar.mjs padroes --gravar       instala estado/padroes.proposta.md, com backup
//
// O que é fato (pastas, arquivos de configuração, dependências, se o comando roda) vem daqui. O que é
// decisão (quais regras o time audita) fica para o agente rascunhar e o dev aprovar.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = dirname(fileURLToPath(import.meta.url));
const RAIZ = process.cwd();
const HW = '.henriworks';
const ESTADO = join(HW, 'estado');
const ATUAL = join(HW, 'verificacao.json');
const PROPOSTA = join(ESTADO, 'verificacao.proposta.json');
const PADROES = join(HW, 'padroes.md');
const PADROES_PROPOSTA = join(ESTADO, 'padroes.proposta.md');
const MAPA_PADROES = join(ESTADO, 'padroes-mapeados.md');

const sair = (c, m) => { (c ? console.error : console.log)(m); process.exit(c); };
const lerJson = (p) => { try { return JSON.parse(readFileSync(join(RAIZ, p), 'utf8')); } catch { return null; } };
const existe = (p) => existsSync(join(RAIZ, p));
const primeiro = (lista) => lista.find(existe) || null;
const carimbo = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const IGNORAR = /^(node_modules|dist|build|out|coverage|\.git|\.angular|\.henriworks|\.github|\.vscode|\.idea|\.husky|graphify-out|assets|public|target)$/;

if (!existe(HW)) sair(2, `${HW}/ não existe aqui. Rode da raiz do repositório onde o HenriWorks foi instalado.`);

function arquivosDe(dir, re, max = 5000) {
  const out = [];
  const andar = (d) => {
    if (out.length >= max) return;
    for (const n of readdirSync(join(RAIZ, d))) {
      const p = d ? `${d}/${n}` : n;
      let st;
      try { st = statSync(join(RAIZ, p)); } catch { continue; }
      if (st.isDirectory()) { if (!IGNORAR.test(n)) andar(p); } else if (re.test(n)) out.push(p);
    }
  };
  if (existe(dir)) andar(dir);
  return out;
}

// ------------------------------------------------------------------ detecção

function detectar() {
  const pkg = lerJson('package.json');
  if (!pkg) sair(2, 'sem package.json na raiz: o /hwk-configurar só sabe propor para projeto Node/TypeScript (MFE, BFF em Node). Para Java, edite o verificacao.json à mão.');
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const notas = [];

  // tsconfig do app: o que o angular.json usa no build; senão os nomes de costume.
  const tsCandidatos = [];
  const ang = lerJson('angular.json');
  for (const proj of Object.values(ang?.projects || {})) {
    for (const [alvo, t] of Object.entries(proj.architect || {})) {
      if (/test|lint/i.test(alvo)) continue;
      const tc = t?.options?.tsConfig;
      if (tc && !tsCandidatos.includes(tc)) tsCandidatos.push(tc);
    }
  }
  const tsconfig = primeiro([...tsCandidatos, 'tsconfig.app.json', 'tsconfig.build.json', 'tsconfig.json']);

  const eslintCfg = primeiro(['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yml', '.eslintrc']);
  const temEslint = Boolean(deps.eslint || eslintCfg);
  if (eslintCfg && /^\.eslintrc/.test(eslintCfg) && /^[\^~]?9/.test(deps.eslint || '')) notas.push(`ESLint 9 com ${eslintCfg} (formato antigo): o comando pode precisar de ESLINT_USE_FLAT_CONFIG=false.`);
  const templateLint = Boolean(deps['angular-eslint'] || deps['@angular-eslint/eslint-plugin-template']);

  const jestCfg = primeiro(['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.cjs', 'jest.config.json']) || (pkg.jest ? 'package.json ("jest")' : null);
  const runner = deps.jest || jestCfg ? 'jest' : deps.vitest ? 'vitest' : deps.karma ? 'karma' : null;

  // Raiz do código: src/app (Angular), senão o sourceRoot do angular.json, senão src.
  const sourceRoot = Object.values(ang?.projects || {}).map((p) => p.sourceRoot).find(Boolean);
  const app = primeiro(['src/app', sourceRoot && `${sourceRoot}/app`, sourceRoot, 'src'].filter(Boolean));
  if (!app) sair(2, 'não achei src/ nem o sourceRoot do angular.json: diga ao agente onde está o código.');

  const codigo = /\.(ts|tsx|js|mjs)$/;
  const camadas = [];
  for (const n of readdirSync(join(RAIZ, app)).sort()) {
    const p = `${app}/${n}`;
    if (!statSync(join(RAIZ, p)).isDirectory() || IGNORAR.test(n) || /^environments?$/.test(n)) continue;
    const arqs = arquivosDe(p, codigo);
    if (!arqs.length) continue;
    camadas.push({ nome: n, glob: `${p}/**`, arquivos: arqs.length, specs: arqs.filter((a) => /\.(spec|test)\./.test(a)).length });
  }
  const soltos = readdirSync(join(RAIZ, app)).filter((n) => codigo.test(n) && statSync(join(RAIZ, app, n)).isFile());
  if (soltos.length) camadas.push({ nome: 'app', glob: `${app}/*`, arquivos: soltos.length, specs: soltos.filter((a) => /\.(spec|test)\./.test(a)).length });
  if (app !== 'src' && existe('src')) {
    const raizSrc = readdirSync(join(RAIZ, 'src')).filter((n) => /\.ts$/.test(n) && statSync(join(RAIZ, 'src', n)).isFile());
    if (raizSrc.length) camadas.push({ nome: 'bootstrap', glob: 'src/*.ts', arquivos: raizSrc.length, specs: raizSrc.filter((a) => /\.spec\./.test(a)).length });
  }

  // Código fora das camadas: decisão do dev (mock, script, config).
  const fora = [];
  for (const n of readdirSync(RAIZ).sort()) {
    if (IGNORAR.test(n) || n === 'src' || n.startsWith('.')) continue;
    let st;
    try { st = statSync(join(RAIZ, n)); } catch { continue; }
    if (!st.isDirectory()) continue;
    const arqs = arquivosDe(n, codigo, 400);
    if (arqs.length) fora.push({ pasta: n, arquivos: arqs.length, specs: arqs.filter((a) => /\.(spec|test)\./.test(a)).length });
  }
  return { deps, tsconfig, eslintCfg, temEslint, templateLint, jestCfg, runner, app, camadas, fora, notas, temTs: Boolean(deps.typescript) };
}

function montar(d) {
  const verificacoes = {};
  if (d.temEslint) {
    verificacoes.lint = {
      comando: 'npx eslint -f json {arquivos}',
      comandoBase: 'npx eslint -f json --stdin --stdin-filename {arquivo}',
      extensoes: d.templateLint ? ['.ts', '.html'] : ['.ts'],
      formato: 'eslint-json',
      classificacao: 'base-stdin',
    };
  }
  if (d.temTs && d.tsconfig) {
    verificacoes.tipos = {
      comando: `npx tsc --noEmit --pretty false -p ${d.tsconfig}`,
      formato: 'linhas',
      padrao: '^(?<arquivo>[^\\s(][^(]*)\\((?<linha>\\d+),\\d+\\): error (?<mensagem>.+)$',
      regra: 'tsc',
      classificacao: 'baseline',
    };
  }
  if (d.runner === 'jest') {
    verificacoes.testes = {
      comando: 'npx jest --ci --passWithNoTests --json --outputFile={saida} --findRelatedTests {arquivos}',
      comandoBaseline: 'npx jest --ci --passWithNoTests --json --outputFile={saida} {raizes}',
      extensoes: ['.ts'],
      formato: 'jest-json',
      classificacao: 'baseline',
    };
  } else if (d.runner === 'vitest') {
    verificacoes.testes = {
      comando: 'npx vitest related --run --passWithNoTests --reporter=json --outputFile={saida} {arquivos}',
      comandoBaseline: 'npx vitest run --passWithNoTests --reporter=json --outputFile={saida} {raizes}',
      extensoes: ['.ts'],
      formato: 'jest-json',
      classificacao: 'baseline',
    };
  }
  const camadas = {};
  for (const c of d.camadas) {
    // testes em toda camada: --findRelatedTests acha o spec de outra pasta que importa o arquivo.
    const v = ['lint', 'tipos', 'testes'].filter((x) => verificacoes[x]);
    camadas[c.nome] = { arquivos: [c.glob], verificacoes: v };
  }
  return { verificacoes, camadas };
}

// Mesmo estilo do molde: lista de valores numa linha, uma camada por linha. Diff curto.
function formatar(p) {
  return JSON.stringify(p, null, 2)
    .replace(/\[\n\s*([^\[\]{}]*?)\n\s*\]/g, (_, i) => `[${i.split(/,\n\s*/).join(', ')}]`)
    .replace(/\{\n\s*("arquivos": \[[^\]]*\]),\n\s*("verificacoes": \[[^\]]*\])\n\s*\}/g, '{ $1, $2 }');
}

// ------------------------------------------------------------------ comandos

function cmdVerificacao(op) {
  if (op.gravar) {
    if (!existe(PROPOSTA)) sair(2, `sem proposta: rode antes node .henriworks/bin/configurar.mjs verificacao`);
    mkdirSync(join(RAIZ, ESTADO), { recursive: true });
    const bak = join(ESTADO, `verificacao.json.bak-${carimbo()}`);
    if (existe(ATUAL)) copyFileSync(join(RAIZ, ATUAL), join(RAIZ, bak));
    copyFileSync(join(RAIZ, PROPOSTA), join(RAIZ, ATUAL));
    sair(0, `gravado: ${ATUAL}${existe(bak) ? ` (anterior em ${bak})` : ''}. A primeira mudança usa esta configuração.`);
  }
  if (op.provar) {
    const alvo = existe(PROPOSTA) && !op.atual ? PROPOSTA : ATUAL;
    console.log(`provando ${alvo} (pode levar alguns minutos: tsc e testes rodam de verdade)\n`);
    const r = spawnSync(process.execPath, [join(BIN, 'verificar.mjs'), 'provar', '--config', alvo], { cwd: RAIZ, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  const d = detectar();
  const prop = montar(d);
  mkdirSync(join(RAIZ, ESTADO), { recursive: true });
  writeFileSync(join(RAIZ, PROPOSTA), `${formatar(prop)}\n`);

  console.log('O que o repositório tem:');
  console.log(`  código        ${d.app}/`);
  console.log(`  tsconfig      ${d.tsconfig || 'NÃO ACHEI (sem verificação de tipos)'}`);
  console.log(`  eslint        ${d.eslintCfg || (d.temEslint ? 'no package.json, sem arquivo de config' : 'NÃO ACHEI (sem lint)')}${d.templateLint ? ', com regras de template (.html)' : ''}`);
  console.log(`  testes        ${d.runner ? `${d.runner}${d.jestCfg ? ` (${d.jestCfg})` : ''}` : 'NÃO ACHEI'}${d.runner === 'karma' ? ': Karma não roda por arquivo, fica fora da verificação' : ''}${d.runner === 'vitest' ? ' (experimental)' : ''}`);
  console.log('\nCamadas propostas (uma por pasta de código):');
  for (const c of d.camadas) console.log(`  ${c.nome.padEnd(14)} ${c.glob.padEnd(28)} ${String(c.arquivos).padStart(4)} arquivo(s), ${c.specs} spec(s)`);
  if (d.fora.length) {
    console.log('\nCódigo fora das camadas (não entra na verificação; diga se alguma pasta deve entrar):');
    for (const f of d.fora) console.log(`  ${f.pasta.padEnd(14)} ${String(f.arquivos).padStart(4)} arquivo(s), ${f.specs} spec(s)`);
  }
  for (const n of d.notas) console.log(`\nATENÇÃO ${n}`);
  console.log(`\nProposta: ${PROPOSTA}`);
  const diff = spawnSync('git', ['diff', '--no-index', '--no-color', '--', ATUAL, PROPOSTA], { cwd: RAIZ, encoding: 'utf8' });
  const texto = (diff.stdout || '').split('\n').filter((l) => !/^(diff --git|index |--- |\+\+\+ )/.test(l)).join('\n').trim();
  console.log(texto ? `\nDiferença para o verificacao.json atual:\n${texto}` : '\nIgual ao verificacao.json atual.');
  console.log('\nPróximo: node .henriworks/bin/configurar.mjs verificacao --provar');
}

const FONTES_PADROES = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', '.eslintrc.json', '.eslintrc.js', 'CONTRIBUTING.md', '.github/copilot-instructions.md', 'docs/padroes.md', 'docs/arquitetura.md'];

function cmdPadroes(op) {
  if (op.gravar) {
    if (!existe(PADROES_PROPOSTA)) sair(2, `sem rascunho em ${PADROES_PROPOSTA}`);
    const bak = join(ESTADO, `padroes.md.bak-${carimbo()}`);
    if (existe(PADROES)) copyFileSync(join(RAIZ, PADROES), join(RAIZ, bak));
    copyFileSync(join(RAIZ, PADROES_PROPOSTA), join(RAIZ, PADROES));
    sair(0, `gravado: ${PADROES}${existe(bak) ? ` (anterior em ${bak})` : ''}. A lente de padrões da revisão passa a usar estas regras, só nas linhas alteradas.`);
  }
  mkdirSync(join(RAIZ, ESTADO), { recursive: true });
  const fontes = [];
  if (existe('src/app')) {
    const r = spawnSync(process.execPath, [join(BIN, 'mapear-padroes.mjs'), RAIZ, '--saida', join(RAIZ, MAPA_PADROES)], { cwd: RAIZ, encoding: 'utf8' });
    if (r.status === 0) fontes.push(`${MAPA_PADROES}: quantos arquivos usam cada jeito, por camada (base para decidir o padrão alvo)`);
    else console.log(`ATENÇÃO mapa de padrões falhou: ${(r.stderr || r.stdout).trim().split('\n')[0]}`);
  }
  for (const f of FONTES_PADROES) if (existe(f)) fontes.push(`${f}: regra que o time já escreveu`);
  for (const f of arquivosDe('.github/instructions', /\.instructions\.md$/)) fontes.push(`${f}: instrução por área`);
  for (const f of arquivosDe('src', /\.md$/).slice(0, 30)) fontes.push(`${f}: guia de pasta escrito pelo time`);
  const atual = existe(PADROES) ? readFileSync(join(RAIZ, PADROES), 'utf8') : '';
  console.log(`padroes.md hoje: ${!atual ? 'não existe' : atual.includes('Apague os exemplos abaixo') ? 'molde do pacote (exemplos genéricos)' : 'já editado pelo time'}`);
  console.log(`\nFontes para o rascunho (leia só estas):\n${fontes.map((f) => `  - ${f}`).join('\n') || '  (nenhuma: o rascunho sai só do mapa e das perguntas ao dev)'}`);
  console.log(`\nRascunho vai em: ${PADROES_PROPOSTA}`);
  console.log('Critérios do rascunho: os do /hwk-configurar (regra verificável num diff, que o lint ainda não pega, sem [grave] sem o dev decidir).');
  console.log(`Depois de aprovado: node .henriworks/bin/configurar.mjs padroes --gravar`);
}

const [cmd, ...resto] = process.argv.slice(2);
const op = { gravar: resto.includes('--gravar'), provar: resto.includes('--provar'), atual: resto.includes('--atual') };
if (cmd === 'verificacao') cmdVerificacao(op);
else if (cmd === 'padroes') cmdPadroes(op);
else sair(2, readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
