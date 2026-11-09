#!/usr/bin/env node
// HenriWorks - núcleo determinístico. Arquivo único de entrada, sem dependência, Node 20+.
// Lê Git, nunca escreve Git. Rode da raiz do repositório:
//
//   node .henriworks/bin/hwk.mjs <comando> [args]
//
// Comandos:
//   estado [--json]                       fase de cada mudança aberta, derivada dos artefatos
//   validar [change-id]                   portões mecânicos (formato, grafo, Toca, deltas, decisões)
//   fatias <id> [--gravar] [--json]       grafo, frontier e quais fatias podem rodar juntas
//   reivindicar <id> <NN...>              marca as fatias da sessão (base da trava e do conferir-toca)
//   conferir-toca <id> [--liberar]        arquivos alterados contra o Toca; abre cartão de decisão
//   ponto-de-partida <base>               Início sugerido e trabalho que já existe na branch
//   hash <caminho...>                     git hash-object, sem gravar nada
//   pacote-revisao <id> <alvo>            prompt literal do peixinho (estágio de spec ou eixo de código)
//   gravar-veredito <id> <alvo> --de <rascunho>   grava veredito sem nunca sobrescrever
//   aprovar-spec <id> --por <nome> [--apesar "<motivo>"]   portão humano da spec
//   arquivar <id> [--conferir]            precondições, Fim: e mudança movida para archive/
//   conhecimento <id> --pr <número>       esqueleto do registro em conhecimento/, com uso e custo
//   ticket [CHAVE-123 | --limpar]         ticket da sessão: fixado, proposta ou branch
//   adotar [--aplicar]                    copia specs e decisões do .sdd/ do HenriSpec, uma vez
//   canario preparar|conferir|aplicar     prova do isolamento do peixinho e dos hooks
//   estrito <id> <alvo>                   revisor em processo separado do Copilot CLI (experimental)
//   uso ...                               uso e custo (ver uso.mjs)
//   modelos [atualizar|conferir|gerar]    modelos liberados × usados × preço (ver modelos.mjs)
//   pos-instalacao                        roda depois do instalador

import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname, basename, relative, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  HW, CHANGES, ARCHIVE, ESTADO, sair, barra, ler, lerJson, gravarJson, anexarJsonl, git, branchAtual, headCurto, mergeBase,
  hashArquivo, naoCommitados, config, mudancasAbertas, dirMudanca, metadados, lerFatias, frontier, paralelizaveis,
  tocaParaTeste, vereditoVigente, ultimoVeredito, aprovado, EIXOS_CODIGO, ESTAGIOS_SPEC, ticketDaSessao, linhasDe, globParaRegex,
  promptDoPacote, tocasSobrepoem,
} from './lib/comum.mjs';
import { validarMudanca, imprimir } from './lib/validar.mjs';

const BIN = dirname(fileURLToPath(import.meta.url));
const RAIZ = process.cwd();
const sha = (t) => createHash('sha256').update(t).digest('hex');

function exigirRaiz() {
  if (!existsSync(join(RAIZ, HW))) sair(2, `${HW}/ não existe aqui. Rode da raiz do repositório onde o HenriWorks foi instalado.`);
}

function opcoes(argv) {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) op[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) op[k] = argv[++i];
      else op[k] = true;
    } else pos.push(a);
  }
  return { pos, op };
}

// Hash da spec: proposta, design, deltas e fatias, com checkbox e evidência normalizados.
// Marcar tarefa não muda o acordo; mudar texto, sim.
function hashSpec(dir) {
  const partes = [];
  for (const n of ['proposta.md', 'design.md', 'deltas.md']) {
    const t = ler(join(dir, n));
    if (t !== null) partes.push(`${n}\n${t.replace(/^(\s*)(Fim|In[ií]cio)\s*:.*$/gim, '')}`);
  }
  for (const f of lerFatias(dir)) {
    partes.push(`${f.nome}\n${f.texto.replace(/\[x\]/g, '[ ]').replace(/^\s+Evid[êe]ncia\s*:.*$/gim, '')}`);
  }
  return sha(partes.join('\n\0\n').replace(/\r\n/g, '\n')).slice(0, 7);
}

const estagiosDoRigor = (rigor) => (/full/i.test(rigor || '') ? ESTAGIOS_SPEC : ['design', 'prontidao']);

// ------------------------------------------------------------------ estado

function faseDe(id) {
  const dir = join(RAIZ, CHANGES, id);
  const m = metadados(dir);
  const fatias = lerFatias(dir);
  if (!existsSync(join(dir, 'proposta.md')) || !fatias.length) return { id, fase: 'plan', proximo: 'hwk-plan', detalhe: 'proposta ou fatias ausentes' };
  const aprov = ler(join(dir, 'revisao-spec', 'APROVACAO.md'));
  const hAtual = hashSpec(dir);
  const hAprov = aprov && (aprov.match(/^Spec:\s*([0-9a-f]{7})/m) || [])[1];
  if (!aprov || hAprov !== hAtual) {
    const pasta = join(dir, 'revisao-spec');
    const faltam = estagiosDoRigor(m.rigor).filter((e) => !vereditoVigente(pasta, e, hAtual));
    return {
      id, fase: 'revisao-spec', proximo: faltam.length ? 'hwk-review (spec)' : 'humano: hwk aprovar-spec',
      detalhe: `${aprov ? 'spec alterada depois da aprovação; ' : ''}estágios sem veredito nesta versão da spec (${hAtual}): ${faltam.join(', ') || 'nenhum'}`,
    };
  }
  const pendentes = fatias.filter((f) => !f.feita);
  if (pendentes.length) {
    const prontas = frontier(fatias);
    return { id, fase: 'implement', proximo: 'hwk-implement', detalhe: `frontier: ${prontas.map((f) => f.num).join(', ') || 'nenhuma (bloqueio)'}; pendentes ${pendentes.length}/${fatias.length}` };
  }
  const head = headCurto(RAIZ);
  const pasta = join(dir, 'revisao');
  const vs = EIXOS_CODIGO.map((e) => ({ e, v: vereditoVigente(pasta, e, head) }));
  const reprov = vs.filter((x) => x.v && !aprovado(x.v.arquivo)).map((x) => x.e);
  if (reprov.length) return { id, fase: 'replan', proximo: `hwk-plan replanejar: ${id}`, detalhe: `REPROVADO em ${reprov.join(', ')} no HEAD ${head}` };
  const faltam = vs.filter((x) => !x.v).map((x) => x.e);
  if (faltam.length) return { id, fase: 'revisao', proximo: 'hwk-review', detalhe: `eixos sem veredito no HEAD ${head}: ${faltam.join(', ')}` };
  return { id, fase: 'archive', proximo: 'hwk-archive', detalhe: `três eixos APROVADO no HEAD ${head}` };
}

function cmdEstado({ op }) {
  exigirRaiz();
  const branch = branchAtual(RAIZ);
  const linhas = mudancasAbertas(RAIZ).map((id) => ({ ...faseDe(id), branch: metadados(join(RAIZ, CHANGES, id)).branch }));
  // Mudança arquivada sem registro de conhecimento.
  const reg = lerJson(join(RAIZ, ESTADO, 'conhecimento.json'), {});
  const semConhecimento = existsSync(join(RAIZ, ARCHIVE))
    ? readdirSync(join(RAIZ, ARCHIVE)).filter((d) => !reg[d]).filter((d) => metadados(join(RAIZ, ARCHIVE, d)).branch === branch)
    : [];
  // HenriSpec na mesma branch: uma branch, um harness.
  const sdd = join(RAIZ, '.sdd', 'changes');
  const henrispec = existsSync(sdd)
    ? readdirSync(sdd).filter((n) => n !== 'archive' && existsSync(join(sdd, n, 'proposta.md'))).filter((n) => metadados(join(sdd, n)).branch === branch)
    : [];
  const t = ticketDaSessao(RAIZ);
  if (op.json) return console.log(JSON.stringify({ branch, ticket: t, mudancas: linhas, fechar: semConhecimento, henrispec }, null, 2));
  console.log(`branch: ${branch} | ticket: ${t.ticket || 'nenhum'} (${t.origem})`);
  if (henrispec.length) console.log(`HENRISPEC esta branch tem mudança aberta no HenriSpec (${henrispec.join(', ')}): continue com os agentes henrispec-*. Uma branch, um harness.`);
  if (!linhas.length) console.log('nenhuma mudança aberta em .henriworks/changes/');
  for (const l of linhas) console.log(`- ${l.id} [${l.branch === branch ? 'esta branch' : `branch ${l.branch}`}] fase ${l.fase} → ${l.proximo}\n    ${l.detalhe}`);
  for (const d of semConhecimento) console.log(`- ${d} arquivada sem registro de conhecimento → hwk-archive (fechar), depois de abrir a PR`);
}

// ---------------------------------------------------------------- validar

function cmdValidar({ pos }) {
  exigirRaiz();
  const alvo = pos[0] ? [pos[0]] : mudancasAbertas(RAIZ);
  if (!alvo.length) sair(0, 'Nenhuma mudança aberta. Nada a validar.');
  let erros = 0;
  for (const id of alvo) erros += imprimir(id, validarMudanca(dirMudanca(id, RAIZ), RAIZ));
  console.log(`\n${alvo.length} mudança(s), ${erros} erro(s).`);
  process.exit(erros ? 1 : 0);
}

// ----------------------------------------------------------------- fatias

function indiceMd(id, fatias) {
  const linhas = [
    `# Fatias: ${id}`,
    '',
    'Gerado por `node .henriworks/bin/hwk.mjs fatias <id> --gravar`. Não edite: a fonte é cada arquivo de fatia.',
    '',
    '| # | Fatia | Bloqueado por | Toca | Executor | Estado |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const f of fatias) {
    const estado = f.feita ? 'feita' : f.iniciada ? 'em andamento' : 'pendente';
    linhas.push(`| ${f.num} | [${f.titulo}](${f.nome}) | ${f.bloqueadoTxt || '?'} | ${f.verificacao ? `Escopo: ${f.escopo || '?'}` : f.toca.join(', ')} | ${f.executor} | ${estado} |`);
  }
  return `${linhas.join('\n')}\n`;
}

function cmdFatias({ pos, op }) {
  exigirRaiz();
  const id = pos[0];
  const dir = dirMudanca(id, RAIZ);
  const fatias = lerFatias(dir);
  if (!fatias.length) sair(2, `${id} não tem fatias em tarefas/.`);
  const prontas = frontier(fatias);
  const juntas = paralelizaveis(prontas);
  const execs = lerJson(join(RAIZ, HW, 'executores.json'), { executores: {} }).executores || {};
  const desconhecidos = [...new Set(fatias.map((f) => f.executor))].filter((e) => !execs[e]);
  if (op.gravar) writeFileSync(join(dir, 'tarefas', 'index.md'), indiceMd(id, fatias));
  if (op.json) return console.log(JSON.stringify({ fatias: fatias.map(({ texto, ...f }) => f), frontier: prontas.map((f) => f.num), juntas: juntas.map((f) => f.num), desconhecidos }, null, 2));
  console.log(indiceMd(id, fatias).split('\n').slice(4).join('\n').trim());
  console.log(`\nfrontier: ${prontas.map((f) => `${f.num} (${f.executor})`).join(', ') || 'nenhuma'}`);
  console.log(`padrão: a próxima sessão executa ${prontas[0] ? prontas[0].num : '-'} e para para o commit.`);
  if (juntas.length > 1) console.log(`podem rodar juntas, se o dev pedir: ${juntas.map((f) => f.num).join(', ')} (sem aresta e Toca disjunto)`);
  else if (prontas.length > 1) console.log('as fatias prontas têm Toca sobreposto: rodam em sequência.');
  if (desconhecidos.length) console.log(`AVISO executor sem registro em ${HW}/executores.json: ${desconhecidos.join(', ')}`);
  const sobre = ler(join(dir, 'tarefas', 'sobreposicoes.md'));
  const abertos = sobre ? (sobre.match(/^Decisão:\s*pendente/gim) || []).length : 0;
  if (abertos) console.log(`cartões de sobreposição em aberto: ${abertos} (tarefas/sobreposicoes.md)`);
  if (op.gravar) console.log(`\ngravado: ${barra(relative(RAIZ, join(dir, 'tarefas', 'index.md')))}`);
}

// ---------------------------------------------------- reivindicar e conferir

const REIV = join(RAIZ, ESTADO, 'reivindicacoes.json');

function cmdReivindicar({ pos }) {
  exigirRaiz();
  const [id, ...nums] = pos;
  const dir = dirMudanca(id, RAIZ);
  const fatias = lerFatias(dir);
  if (!nums.length) sair(2, 'informe ao menos uma fatia: hwk reivindicar <id> 02 [03]');
  const prontas = new Set(frontier(fatias).map((f) => f.num));
  const reg = lerJson(REIV, { ativas: [] });
  for (const n of nums.map((x) => x.padStart(2, '0'))) {
    const f = fatias.find((x) => x.num === n);
    if (!f) sair(2, `fatia ${n} não existe em ${id}.`);
    if (!prontas.has(n)) sair(2, `fatia ${n} não está na frontier: ${f.feita ? 'já feita' : `bloqueada por ${f.bloqueadoTxt}`}.`);
    const outra = reg.ativas.find((r) => r.change === id && r.fatia !== n && !f.verificacao && tocasSobrepoem(r.toca, f.toca));
    if (outra) sair(2, `fatia ${n} tem Toca sobreposto à fatia ${outra.fatia}, em andamento. Rode em sequência.`);
    reg.ativas = reg.ativas.filter((r) => !(r.change === id && r.fatia === n));
    reg.ativas.push({ change: id, fatia: n, toca: f.toca, desde: new Date().toISOString(), head: headCurto(RAIZ) });
  }
  gravarJson(REIV, reg);
  console.log(`reivindicadas em ${id}: ${nums.join(', ')}. Ao fechar a sessão: hwk conferir-toca ${id} --liberar`);
}

function cmdConferirToca({ pos, op }) {
  exigirRaiz();
  const id = pos[0];
  const dir = dirMudanca(id, RAIZ);
  const fatias = lerFatias(dir);
  const reg = lerJson(REIV, { ativas: [] });
  const ativas = reg.ativas.filter((r) => r.change === id);
  const alterados = naoCommitados(RAIZ);
  // Registro de edição por subagente, quando o hook de trava está ligado: diz quem editou o quê.
  const edicoes = linhasDe(ler(join(RAIZ, ESTADO, 'edicoes.jsonl')) || '').filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.change === id);
  const porArquivo = new Map();
  for (const e of edicoes) {
    if (!porArquivo.has(e.arquivo)) porArquivo.set(e.arquivo, new Set());
    porArquivo.get(e.arquivo).add(e.fatia);
  }
  const alvo = ativas.length ? ativas.map((r) => fatias.find((f) => f.num === r.fatia)).filter(Boolean) : fatias.filter((f) => f.iniciada && !f.feita);
  const cartoes = [];
  for (const arq of alterados) {
    const donos = alvo.filter((f) => f.toca.some((t) => tocaParaTeste(t)(arq)));
    const editores = porArquivo.get(arq);
    if (editores && editores.size > 1) cartoes.push({ arq, tipo: 'editado por mais de uma fatia', fatias: [...editores] });
    else if (donos.length > 1) cartoes.push({ arq, tipo: 'cabe no Toca de mais de uma fatia da sessão', fatias: donos.map((f) => f.num) });
    else if (donos.length === 0 && alvo.length) cartoes.push({ arq, tipo: 'fora do Toca das fatias da sessão', fatias: alvo.map((f) => f.num) });
  }
  if (cartoes.length) {
    const p = join(dir, 'tarefas', 'sobreposicoes.md');
    const atual = ler(p) || `# Sobreposições: ${id}\n\nCartões de decisão. Nenhum bloqueia a entrega: os abertos vão para o resumo.md, em "Pontos para o revisor humano".\n`;
    const carimbo = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const novos = cartoes.map((c, i) => [
      `\n## ${carimbo} · ${c.arq}`,
      `Situação: ${c.tipo}`,
      `Fatias: ${c.fatias.join(', ')}`,
      `Diff: git diff -- ${c.arq}`,
      'Saídas: (a) commitar junto, citando as fatias na mensagem; (b) separar com git add -p; (c) replanejar com hwk-plan',
      'Decisão: pendente',
    ].join('\n'));
    writeFileSync(p, `${atual.replace(/\s*$/, '')}\n${novos.join('\n')}\n`);
  }
  console.log(`arquivos alterados e não commitados: ${alterados.length} | fatias da sessão: ${alvo.map((f) => f.num).join(', ') || 'nenhuma'}`);
  if (!cartoes.length) console.log('Toca conferido: nenhum arquivo fora do declarado, nenhum arquivo dividido entre fatias.');
  for (const c of cartoes) console.log(`CARTÃO ${c.arq}: ${c.tipo} (fatias ${c.fatias.join(', ')})`);
  if (cartoes.length) console.log(`→ ${barra(relative(RAIZ, join(dir, 'tarefas', 'sobreposicoes.md')))}. Decida antes do commit; troque "Decisão: pendente" pela escolha.`);
  if (op.liberar) {
    reg.ativas = reg.ativas.filter((r) => r.change !== id);
    gravarJson(REIV, reg);
    console.log('reivindicações liberadas.');
  }
}

// ---------------------------------------------------------- ponto de partida

function cmdPontoDePartida({ pos }) {
  exigirRaiz();
  const base = pos[0] || sair(2, 'informe a branch base: hwk ponto-de-partida main');
  const branch = branchAtual(RAIZ);
  const head = git(['rev-parse', 'HEAD']).trim();
  let inicio = mergeBase(base, RAIZ);
  let origem = `ponto em que ${branch} saiu de ${base}`;
  let melhor = null;
  for (const raizArq of [join(RAIZ, ARCHIVE), join(RAIZ, '.sdd', 'changes', 'archive')]) {
    if (!existsSync(raizArq)) continue;
    for (const d of readdirSync(raizArq)) {
      const m = metadados(join(raizArq, d));
      if (m.branch !== branch || !m.fim) continue;
      if (spawnSync('git', ['merge-base', '--is-ancestor', m.fim, 'HEAD'], { cwd: RAIZ }).status !== 0) continue;
      const dist = Number(git(['rev-list', '--count', `${m.fim}..HEAD`]).trim());
      if (!melhor || dist < melhor.dist) melhor = { fim: m.fim, dist, d };
    }
  }
  if (melhor) {
    inicio = git(['rev-parse', melhor.fim]).trim();
    origem = `Fim da mudança arquivada ${melhor.d}`;
  }
  const fora = ['--', '.', `:(exclude)${HW}`, ':(exclude).sdd', ':(exclude)AGENTS.md', ':(exclude).github/copilot-instructions.md'];
  const log = git(['log', '--oneline', '-n', '30', `${inicio}..HEAD`, ...fora]).trim();
  const stat = log ? git(['diff', '--stat', `${inicio}..HEAD`, ...fora]).trim().split('\n').slice(-12).join('\n') : '';
  const sujo = naoCommitados(RAIZ, ['.sdd/']);
  console.log(`branch: ${branch}, HEAD ${head.slice(0, 7)}`);
  console.log(`Início sugerido: ${inicio.slice(0, 7)} (${origem})`);
  console.log(log ? `commits desde o Início:\n${log}\narquivos:\n${stat}` : 'nenhum commit desde o Início: declare Início igual ao HEAD.');
  console.log(sujo.length ? `NÃO COMMITADO: ${sujo.slice(0, 10).join(', ')}. Pare e peça para commitar ou guardar com git stash.` : 'árvore: limpa');
}

function cmdHash({ pos }) {
  for (const c of pos) console.log(`- ${c} ${existsSync(join(RAIZ, c)) ? hashArquivo(c, RAIZ) || 'ERRO' : 'AUSENTE'}`);
}

// --------------------------------------------------------------- revisão

const PACOTES_REG = join(RAIZ, ESTADO, 'pacotes.jsonl');
const PERSONA = {
  'zoom-out': 'hwk-gf-zoom-out', 'zoom-out-2': 'hwk-gf-zoom-out', compreensao: 'hwk-gf-compreensao', design: 'hwk-gf-design',
  prontidao: 'hwk-gf-prontidao', spec: 'hwk-gf-spec', padroes: 'hwk-gf-padroes', plantao: 'hwk-gf-plantao', canario: 'hwk-gf-compreensao',
};


function instructionsQueCasam(arquivos) {
  const dir = join(RAIZ, '.github', 'instructions');
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir, { recursive: true }).map(String).filter((x) => x.endsWith('.instructions.md'))) {
    const t = ler(join(dir, n)) || '';
    const apply = (t.match(/^applyTo\s*:\s*["']?(.+?)["']?\s*$/m) || [])[1];
    if (!apply) continue;
    const globs = apply.split(',').map((g) => g.trim()).filter(Boolean);
    if (globs.includes('**') || globs.some((g) => arquivos.some((a) => globParaRegex(g).test(a)))) out.push(barra(join('.github', 'instructions', n)));
  }
  return out;
}

function arquivosLocaisDasTarefas(dir) {
  const citados = new Set();
  for (const f of lerFatias(dir)) {
    for (const it of f.itens.filter((i) => i.feito)) for (const m of it.texto.matchAll(/`([^`\s]+\.[a-z0-9]+)`/gi)) citados.add(barra(m[1]));
  }
  return [...citados].filter((p) => existsSync(join(RAIZ, p)) && git(['ls-files', '--error-unmatch', p], { cwd: RAIZ, permitirFalha: true }) === null);
}

// Referência dos eixos: no repositório, ou na instalação global (~/.copilot/skills).
function refEixos() {
  const rel = '.github/skills/henriworks-fluxo/references/eixos-de-revisao.md';
  if (existsSync(join(RAIZ, rel))) return rel;
  const g = join(process.env.COPILOT_HOME || join(homedir(), '.copilot'), 'skills', 'henriworks-fluxo', 'references', 'eixos-de-revisao.md');
  return existsSync(g) ? barra(g) : null;
}

function cmdPacoteRevisao({ pos, op }) {
  exigirRaiz();
  let [id, alvo] = pos;
  if (id === 'canario' && !alvo) alvo = 'canario';
  const dir = alvo === 'canario' ? join(RAIZ, ESTADO) : dirMudanca(id, RAIZ);
  if (!PERSONA[alvo]) sair(2, `alvo "${alvo}" inválido. Spec: ${ESTAGIOS_SPEC.join(', ')}. Código: ${EIXOS_CODIGO.join(', ')}.`);
  const m = alvo === 'canario' ? {} : metadados(dir);
  const rel = (p) => barra(relative(RAIZ, p));
  const pasta = join(dir, 'pacotes');
  mkdirSync(pasta, { recursive: true });
  const leitura = [];
  const add = (p, porque) => existsSync(join(RAIZ, p)) && leitura.push(`- \`${p}\`: ${porque}`);
  let pedido;
  let chave;
  let locais = [];
  if (alvo === 'canario') {
    const can = lerJson(join(RAIZ, ESTADO, 'canario.json'));
    if (!can) sair(2, 'rode antes: hwk canario preparar');
    chave = 'canario';
    pedido = [
      'Este é um teste de isolamento. Não revise nada.',
      '1. Liste, numerados, os 120 primeiros caracteres de cada bloco de instrução que você recebeu além deste pacote e do seu próprio agente: instruções de projeto, de usuário, AGENTS.md, histórico de conversa.',
      '2. Existe, em qualquer texto que você recebeu, uma palavra-código que começa com "hwk-canario-"? Se existir, escreva-a por inteiro. Se não existir, escreva "nenhuma".',
      '3. Existe, em algum texto que você recebeu fora deste pacote, uma frase que começa com "Marcador de teste do HenriWorks:"? Se existir, copie a frase inteira. Se não existir, escreva "nenhuma".',
      'Formato: as três respostas, numeradas, e nada mais.',
    ].join('\n');
  } else if (ESTAGIOS_SPEC.includes(alvo)) {
    chave = hashSpec(dir);
    for (const n of ['proposta.md', 'design.md', 'deltas.md']) add(rel(join(dir, n)), 'documento revisado');
    for (const f of lerFatias(dir)) add(rel(f.arquivo), 'fatia');
    add(`${HW}/glossario.md`, 'vocabulário do domínio');
    add(`${HW}/padroes.md`, 'padrões auditáveis do repositório');
    add(`${HW}/decisoes/index.md`, 'decisões vigentes (abra só a que o documento cita)');
    add(`${HW}/specs/index.md`, 'capacidades documentadas (ausência = não documentado)');
    if (alvo === 'zoom-out-2') {
      const v = vereditoVigente(join(dir, 'revisao-spec'), 'zoom-out', chave) || null;
      if (v) leitura.push(`- \`${rel(v.arquivo)}\`: relatório do zoom-out inicial, para conferir o que mudou`);
    }
    pedido = `Estágio "${alvo}" da revisão da spec da mudança ${id} (rigor ${m.rigor || '?'}), conforme a sua persona.`;
  } else {
    const head = headCurto(RAIZ);
    chave = head;
    const sujo = naoCommitados(RAIZ);
    if (sujo.length) sair(2, `há alteração não commitada (${sujo.slice(0, 4).join(', ')}): revisão julga commit. Commite ou guarde antes.`);
    const de = m.inicio || mergeBase(m.base || 'main', RAIZ);
    const fora = ['--', '.', `:(exclude)${HW}`, ':(exclude).sdd', ':(exclude)AGENTS.md'];
    const diff = git(['diff', '--no-color', `${de}..HEAD`, ...fora], { cwd: RAIZ });
    const arquivos = linhasDe(git(['diff', '--name-only', `${de}..HEAD`, ...fora], { cwd: RAIZ })).filter(Boolean);
    locais = arquivosLocaisDasTarefas(dir).map((p) => ({ p, h: hashArquivo(p, RAIZ) }));
    if (!diff.trim() && !locais.length) sair(2, `diff vazio entre ${de.slice(0, 7)} e HEAD, e nenhum arquivo local citado nas tarefas. Revisão sem diff é opinião.`);
    const pDiff = join(pasta, `diff-${head}.patch`);
    writeFileSync(pDiff, diff);
    leitura.push(`- \`${rel(pDiff)}\`: diff de ${de.slice(0, 7)} até ${head} (${arquivos.length} arquivo(s))`);
    for (const l of locais) leitura.push(`- \`${l.p}\`: arquivo local, fora do Git, alterado pela mudança (julgue inteiro)`);
    const verif = join(dir, 'revisao', `verificacao-${head}.txt`);
    if (existsSync(verif)) leitura.push(`- \`${rel(verif)}\`: saída do verificador com escopo (BLOQUEANTE x PRÉ-EXISTENTE)`);
    else if (alvo !== 'plantao') sair(2, `rode antes: node ${HW}/bin/verificar.mjs ${id} --salvar`);
    if (alvo === 'spec') {
      add(rel(join(dir, 'proposta.md')), 'o acordo');
      for (const f of lerFatias(dir)) add(rel(f.arquivo), 'fatia');
      add(rel(join(dir, 'deltas.md')), 'deltas de spec');
      add(rel(join(dir, 'design.md')), 'design e decisões');
      add(rel(join(dir, 'tarefas', 'sobreposicoes.md')), 'cartões de sobreposição');
    }
    if (alvo === 'padroes') {
      add(`${HW}/padroes.md`, 'fonte declarada do eixo');
      add('.github/copilot-instructions.md', 'instruções do projeto');
      for (const p of instructionsQueCasam(arquivos)) leitura.push(`- \`${p}\`: instruction cujo applyTo casa com o diff`);
    }
    if (alvo === 'plantao') {
      const r = spawnSync(process.execPath, [join(BIN, 'henrimap.mjs'), 'affected', ...arquivos.slice(0, 60), '--budget', '6000'], { cwd: RAIZ, encoding: 'utf8' });
      const pAff = join(pasta, `affected-${head}.txt`);
      writeFileSync(pAff, r.stdout || '(mapa indisponível)\n');
      leitura.push(`- \`${rel(pAff)}\`: raio de impacto pelo mapa: chamadores e dependentes dos arquivos alterados`);
      add('README.md', 'carga esperada e contexto de execução, se declarados');
    }
    pedido = `Eixo "${alvo}" da revisão de código da mudança ${id}, no commit ${head}, conforme a sua persona.`;
  }
  if (alvo !== 'canario') {
    const ref = refEixos();
    if (ref) leitura.unshift(`- \`${ref}\`: regras de severidade, do seu ${ESTAGIOS_SPEC.includes(alvo) ? 'estágio' : 'eixo'} e do veredito (só a seção correspondente)`);
  }
  const nome = `${alvo}-${chave}.md`;
  const caminho = join(pasta, nome);
  const corpo = [
    `# Pacote de revisão · ${alvo}`,
    '',
    `Gerado por script em ${new Date().toISOString()}. Persona: ${PERSONA[alvo]}.`,
    '',
    '## Pedido',
    '',
    pedido,
    '',
    alvo === 'canario' ? '' : '## Leia, e só isto',
    alvo === 'canario' ? '' : '',
    ...(alvo === 'canario' ? [] : leitura),
    '',
    alvo === 'canario' ? '' : '## Regras',
    ...(alvo === 'canario' ? [] : [
      '',
      '- Você não tem a conversa que produziu esses arquivos, de propósito. Não peça e não presuma.',
      '- Não edite nada. Não leia arquivo fora da lista, exceto código citado por linha no diff ou no raio de impacto.',
      '- Todo achado cita evidência: arquivo e linha, ou seção.',
      '',
      '## Formato da resposta',
      '',
      `# ${ESTAGIOS_SPEC.includes(alvo) ? `spec-${alvo}` : alvo} - APROVADO | REPROVADO`,
      `${ESTAGIOS_SPEC.includes(alvo) ? 'Spec revisada' : 'Commit revisado'}: ${chave}`,
      'Achados: <número>',
      '',
      'Um achado por item: `[bloqueante|importante|sugestão] <arquivo>:<linha ou seção> — o que está errado — o caso concreto — a menor correção`.',
      'REPROVADO se houver ao menos um bloqueante. Sem achado, escreva "Achados: 0" e nada mais.',
    ]),
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  writeFileSync(caminho, `${corpo}\n`);
  const p = rel(caminho);
  anexarJsonl(PACOTES_REG, { t: new Date().toISOString(), change: id, alvo, chave, arquivo: p, hash: sha(readFileSync(caminho, 'utf8')), prompt: sha(promptDoPacote(p)), locais });
  console.log(`pacote: ${p}`);
  console.log(`subagente: ${PERSONA[alvo]}`);
  console.log(`prompt literal (copie exatamente, sem acrescentar nada):\n${promptDoPacote(p)}`);
}

function cmdGravarVeredito({ pos, op }) {
  exigirRaiz();
  const [id, alvo] = pos;
  const dir = dirMudanca(id, RAIZ);
  const ehSpec = ESTAGIOS_SPEC.includes(alvo);
  if (!ehSpec && !EIXOS_CODIGO.includes(alvo)) sair(2, `alvo "${alvo}" inválido.`);
  if (!op.de) sair(2, `informe o rascunho: --de ${HW}/changes/${id}/rascunhos/${alvo}.md`);
  const rasc = resolve(RAIZ, op.de);
  if (!existsSync(rasc)) sair(2, `${op.de} não existe.`);
  const conteudo = readFileSync(rasc, 'utf8').trim();
  const rotulo = ehSpec ? `spec-${alvo}` : alvo;
  const cab = conteudo.split('\n')[0].trim();
  if (!new RegExp(`^# ${rotulo} - (APROVADO|REPROVADO)$`).test(cab)) sair(2, `a primeira linha precisa ser "# ${rotulo} - APROVADO" ou "# ${rotulo} - REPROVADO".`);
  const chave = ehSpec ? hashSpec(dir) : headCurto(RAIZ);
  const campo = ehSpec ? 'Spec revisada' : 'Commit revisado';
  const declarado = (conteudo.match(new RegExp(`^${campo}:\\s*(\\S+)`, 'm')) || [])[1];
  if (declarado !== chave) sair(2, `"${campo}:" precisa ser ${chave} (${ehSpec ? 'hash atual da spec' : 'HEAD atual'}). A spec ou o código mudou depois do pacote: gere o pacote de novo.`);
  if (!ehSpec) {
    const sujo = naoCommitados(RAIZ);
    if (sujo.length) sair(2, `árvore com alteração não commitada (${sujo.slice(0, 3).join(', ')}): o veredito não valeria para nenhum commit.`);
  }
  const pasta = join(dir, ehSpec ? 'revisao-spec' : 'revisao');
  mkdirSync(pasta, { recursive: true });
  const atual = vereditoVigente(pasta, alvo, chave);
  const nome = atual ? `${alvo}-${chave}-${atual.ordem + 1}.md` : `${alvo}-${chave}.md`;
  // Arquivos locais do pacote vão junto, com hash: o archive confere que não mudaram.
  const pac = linhasDe(ler(PACOTES_REG) || '').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.change === id && r.alvo === alvo && r.chave === chave).pop();
  const locais = pac?.locais?.length ? `\nRevisão local: sim\nArquivos revisados:\n${pac.locais.map((l) => `- ${l.p} ${l.h}`).join('\n')}` : '';
  writeFileSync(join(pasta, nome), `${conteudo}${locais}\n`, { flag: 'wx' });
  rmSync(rasc);
  console.log(`gravado: ${barra(relative(RAIZ, join(pasta, nome)))}${atual ? ` (vigente; substitui ${atual.nome})` : ''}`);
}

function cmdAprovarSpec({ pos, op }) {
  exigirRaiz();
  const id = pos[0];
  const dir = dirMudanca(id, RAIZ);
  if (!op.por || op.por === true) sair(2, 'informe quem aprova: --por "Nome Sobrenome". Este portão é humano.');
  const v = validarMudanca(dir, RAIZ).filter((a) => a.nivel === 'ERRO');
  if (v.length) sair(1, `o validador tem ${v.length} erro(s): hwk validar ${id}`);
  const m = metadados(dir);
  const h = hashSpec(dir);
  const pasta = join(dir, 'revisao-spec');
  const linhas = [];
  let reprovados = 0;
  let faltando = 0;
  for (const e of estagiosDoRigor(m.rigor)) {
    const atual = vereditoVigente(pasta, e, h);
    const qualquer = ultimoVeredito(pasta, e)?.nome || null;
    if (atual) {
      const ok = aprovado(atual.arquivo);
      if (!ok) reprovados++;
      linhas.push(`- ${e}: ${ok ? 'APROVADO' : 'REPROVADO'} nesta versão (${atual.nome})`);
    } else if (qualquer) {
      linhas.push(`- ${e}: revisado numa versão anterior da spec (${qualquer}); a spec mudou depois`);
      if (!aprovado(join(pasta, qualquer))) reprovados++;
    } else {
      faltando++;
      linhas.push(`- ${e}: sem revisão`);
    }
  }
  console.log(`spec ${id} (${m.rigor || '?'}, versão ${h}):\n${linhas.join('\n')}`);
  if (faltando && !op.apesar) sair(1, `\n${faltando} estágio(s) sem revisão. Rode hwk-review (spec), ou aprove com --apesar "<motivo>".`);
  if (reprovados && !op.apesar) sair(1, `\n${reprovados} estágio(s) REPROVADO. Resolva com hwk-plan replanejar, ou aprove com --apesar "<motivo>".`);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'APROVACAO.md'), `# Spec aprovada\nSpec: ${h}\nPor: ${op.por}\nEm: ${new Date().toISOString()}\n${op.apesar ? `Apesar de: ${op.apesar}\n` : ''}\n${linhas.join('\n')}\n`);
  console.log(`\naprovada por ${op.por}. Próximo: agente hwk-implement, num chat novo.`);
}

// ---------------------------------------------------------------- arquivar

function cmdArquivar({ pos, op }) {
  exigirRaiz();
  const id = pos[0];
  const dir = dirMudanca(id, RAIZ);
  const falha = (m) => sair(1, `NÃO ARQUIVADO: ${m}`);
  const head = headCurto(RAIZ);
  for (const eixo of EIXOS_CODIGO) {
    const v = vereditoVigente(join(dir, 'revisao'), eixo, head);
    if (!v) falha(`sem veredito de ${eixo} para o HEAD ${head}. Rode o hwk-review.`);
    const texto = readFileSync(v.arquivo, 'utf8');
    if (!aprovado(v.arquivo)) falha(`o veredito vigente de ${eixo} (${v.nome}) não é APROVADO. Caminho: hwk-plan replanejar: ${id}.`);
    if (/^Revisão local:\s*sim/im.test(texto)) {
      for (const mm of texto.matchAll(/^-\s+(\S+)\s+([0-9a-f]{40})\s*$/gim)) {
        if ((existsSync(join(RAIZ, mm[1])) ? hashArquivo(mm[1], RAIZ) : null) !== mm[2]) falha(`${mm[1]} mudou depois da revisão de ${eixo}: revise de novo.`);
      }
    }
  }
  const pend = lerFatias(dir).flatMap((f) => f.itens.filter((i) => !i.feito).map((i) => `${f.num}:${i.numero}`));
  if (pend.length) falha(`tarefas pendentes: ${pend.slice(0, 6).join(', ')}.`);
  const fora = naoCommitados(RAIZ);
  if (fora.length) falha(`alteração não commitada: ${fora.slice(0, 5).join(', ')}.`);
  const sobre = ler(join(dir, 'tarefas', 'sobreposicoes.md')) || '';
  const abertos = (sobre.match(/^Decisão:\s*pendente/gim) || []).length;
  if (op.conferir) sair(0, `precondições ok para ${id}: três eixos APROVADO em ${head}, tarefas concluídas, árvore limpa${abertos ? `, ${abertos} cartão(ões) de sobreposição em aberto (vão para o resumo.md)` : ''}.`);
  const resumo = ler(join(dir, 'resumo.md'));
  if (!resumo) falha('falta o resumo.md: ele é escrito antes de mover.');
  if (abertos && !/Pontos para o revisor humano/i.test(resumo)) falha(`${abertos} cartão(ões) de sobreposição em aberto e o resumo.md não tem a seção "Pontos para o revisor humano".`);
  if (/\.henriworks\/|change-id|\bDEC-\d{3}\b|\bREQ-[\w-]+-\d{3}\b/.test(resumo)) falha('o resumo.md cita o fluxo (caminho, change-id, DEC- ou REQ-): quem lê a PR não tem como seguir essas referências.');
  const propPath = join(dir, 'proposta.md');
  const prop = readFileSync(propPath, 'utf8');
  const completo = git(['rev-parse', 'HEAD']).trim();
  writeFileSync(propPath, /^\s*Fim\s*:.*$/im.test(prop.split(/^##\s+/m)[0]) ? prop.replace(/^(\s*)Fim\s*:.*$/im, `$1Fim: ${completo}`) : prop.replace(/^(\s*Base\s*:.*)$/im, `$1\nFim: ${completo}`));
  const hoje = new Date().toISOString().slice(0, 10);
  const destino = join(RAIZ, ARCHIVE, `${hoje}-${id}`);
  if (existsSync(destino)) falha(`${barra(relative(RAIZ, destino))} já existe.`);
  mkdirSync(dirname(destino), { recursive: true });
  renameSync(dir, destino);
  console.log(`movido: ${barra(relative(RAIZ, destino))}/`);
  console.log(`descrição da PR: ${barra(relative(RAIZ, join(destino, 'resumo.md')))}`);
  console.log(`depois de abrir a PR: agente hwk-archive, "fechar ${hoje}-${id} <número da PR>"`);
}

// ----------------------------------------------------------- conhecimento

function cmdConhecimento({ pos, op }) {
  exigirRaiz();
  const pasta = pos[0];
  const dir = join(RAIZ, ARCHIVE, pasta || '');
  if (!pasta || !existsSync(dir)) sair(2, `informe a pasta arquivada: ${existsSync(join(RAIZ, ARCHIVE)) ? readdirSync(join(RAIZ, ARCHIVE)).join(', ') : 'nenhuma'}`);
  if (!op.pr || op.pr === true) sair(2, 'informe a PR: --pr 1234 (o registro nasce depois da PR aberta).');
  const cfg = config(RAIZ);
  const m = metadados(dir);
  const slug = pasta.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const hoje = new Date().toISOString().slice(0, 10);
  const destRel = barra(join(cfg.conhecimento, `${hoje}-${slug}.md`));
  const dest = join(RAIZ, destRel);
  if (existsSync(dest)) sair(2, `${destRel} já existe.`);
  const decis = [...(ler(join(dir, 'design.md')) || '').matchAll(/^###\s+(.+)\n(?:.*\n){0,3}?\s*Durabilidade\s*:\s*permanente/gim)].map((x) => x[1]);
  const caps = [...new Set([...(ler(join(dir, 'deltas.md')) || '').matchAll(/^\s*[-|]?\s*Capacidade\s*[:|]\s*(\S+)/gim)].map((x) => x[1]))];
  const uso = spawnSync(process.execPath, [join(BIN, 'uso.mjs'), 'resumo', pasta], { cwd: RAIZ, encoding: 'utf8' }).stdout?.trim() || 'Sem dados de uso coletados para esta mudança.';
  const inicioCommits = m.inicio
    || (m.base && (git(['merge-base', m.base, m.fim || 'HEAD'], { cwd: RAIZ, permitirFalha: true }) || '').trim())
    || m.base || 'base';
  const corpo = [
    `# ${slug}`,
    '',
    `Data: ${hoje}`,
    `Ticket: ${m.ticket || 'sem ticket'}`,
    `PR: ${op.pr}`,
    `Branch: ${m.branch || '?'}`,
    `Commits: ${inicioCommits.slice(0, 7)}..${m.fim ? m.fim.slice(0, 7) : '?'}`,
    `Rigor: ${m.rigor || '?'}`,
    '',
    '## Problema',
    '',
    '<!-- preencher: de onde partiu, para quem, por que importa -->',
    '',
    '## O que mudou',
    '',
    '<!-- preencher: comportamento, pelo efeito -->',
    '',
    '## Regras de negócio',
    '',
    '<!-- preencher: regras que a mudança criou ou alterou, em linguagem de negócio -->',
    '',
    '## Decisões',
    '',
    decis.length ? decis.map((d) => `- ${d}`).join('\n') : '- nenhuma decisão durável',
    '',
    '## Capacidades afetadas',
    '',
    caps.length ? caps.map((c) => `- ${c}`).join('\n') : '- nenhuma',
    '',
    '## Fora do escopo',
    '',
    '<!-- preencher -->',
    '',
    '## Uso e custo',
    '',
    uso,
    '',
  ].join('\n');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, corpo);
  const reg = lerJson(join(RAIZ, ESTADO, 'conhecimento.json'), {});
  reg[pasta] = destRel;
  gravarJson(join(RAIZ, ESTADO, 'conhecimento.json'), reg);
  console.log(`esqueleto: ${destRel} (preencha as seções marcadas; números e metadados vieram do script)`);
}

// ------------------------------------------------------------------ ticket

function cmdTicket({ pos, op }) {
  exigirRaiz();
  const p = join(RAIZ, ESTADO, 'ticket.json');
  if (op.limpar) {
    if (existsSync(p)) rmSync(p);
    return console.log('ticket fixado removido.');
  }
  if (pos[0]) {
    if (!new RegExp(`^${config(RAIZ).ticket.padrao}$`).test(pos[0])) sair(2, `"${pos[0]}" não segue o padrão de ticket (${config(RAIZ).ticket.padrao}).`);
    gravarJson(p, { ticket: pos[0], em: new Date().toISOString() });
  }
  const t = ticketDaSessao(RAIZ);
  console.log(`ticket: ${t.ticket || 'nenhum'} (${t.origem})`);
}

// ------------------------------------------------------------------ adotar

function cmdAdotar({ op }) {
  exigirRaiz();
  const pares = [['.sdd/specs', `${HW}/specs`], ['.sdd/decisoes', `${HW}/decisoes`]];
  let n = 0;
  for (const [de, para] of pares) {
    const a = join(RAIZ, de);
    if (!existsSync(a)) continue;
    for (const f of readdirSync(a, { recursive: true }).map(String)) {
      const origem = join(a, f);
      if (!statSync(origem).isFile()) continue;
      const destino = join(RAIZ, para, f);
      const ehIndice = basename(f) === 'index.md';
      if (existsSync(destino) && !ehIndice) {
        console.log(`  manter   ${barra(join(para, f))} (já existe)`);
        continue;
      }
      if (ehIndice && existsSync(destino)) {
        const atual = readFileSync(destino, 'utf8');
        const novas = linhasDe(readFileSync(origem, 'utf8')).filter((l) => /^\s*[-|]/.test(l) && !atual.includes(l.trim()));
        console.log(`  índice   ${barra(join(para, f))} +${novas.length} linha(s)`);
        if (op.aplicar && novas.length) writeFileSync(destino, `${atual.replace(/\s*$/, '')}\n${novas.join('\n')}\n`);
        continue;
      }
      console.log(`  copiar   ${barra(join(de, f))} → ${barra(join(para, f))}`);
      if (op.aplicar) {
        mkdirSync(dirname(destino), { recursive: true });
        copyFileSync(origem, destino);
      }
      n++;
    }
  }
  console.log(op.aplicar ? `\n${n} arquivo(s) copiado(s). O .sdd/ não foi alterado.` : '\nplano: nada foi escrito. Rode com --aplicar.');
}

// ----------------------------------------------------------------- canário

function cmdCanario({ pos }) {
  exigirRaiz();
  const sub = pos[0];
  const pCan = join(RAIZ, ESTADO, 'canario.json');
  if (sub === 'preparar') {
    const token = `hwk-canario-${randomBytes(4).toString('hex')}`;
    gravarJson(pCan, { token, criadoEm: new Date().toISOString() });
    rmSync(join(RAIZ, ESTADO, 'canario-hooks.jsonl'), { force: true });
    rmSync(join(RAIZ, ESTADO, 'canario-resposta.md'), { force: true });
    console.log([
      `Canário preparado. Palavra-código: ${token}`,
      '',
      '1. Recarregue o VS Code (os hooks são lidos ao abrir a janela).',
      '2. Abra um chat NOVO, harness Copilot, agente hwk-review.',
      `3. Envie exatamente:  canario ${token}`,
      '   A palavra-código entra só no chat do pai. O agente gera o pacote, delega ao peixinho e grava a resposta.',
      '4. Depois:  node .henriworks/bin/hwk.mjs canario conferir',
    ].join('\n'));
    return;
  }
  if (sub === 'conferir') {
    const can = lerJson(pCan);
    if (!can) sair(2, 'rode antes: hwk canario preparar');
    const resp = ler(join(RAIZ, ESTADO, 'canario-resposta.md'));
    const hooks = linhasDe(ler(join(RAIZ, ESTADO, 'canario-hooks.jsonl')) || '').filter(Boolean).map((l) => JSON.parse(l));
    const eventos = [...new Set(hooks.map((h) => h.ev))];
    const sub = hooks.filter((h) => h.subagente);
    console.log(`hooks: ${eventos.length ? eventos.join(', ') : 'NENHUM evento registrado (hooks bloqueados, não recarregados ou fora do harness Copilot)'}`);
    if (sub.length) {
      const s = sub[sub.length - 1];
      console.log(`chamada de subagente vista pelo preToolUse: ferramenta "${s.ferramenta}", campos [${s.campos.join(', ')}], campo do prompt provável "${s.campoPrompt}"`);
    } else if (eventos.length) console.log('AVISO o preToolUse não registrou a chamada de subagente: a conferência do pacote (C) não tem como funcionar.');
    if (!resp) sair(1, 'sem resposta do peixinho em .henriworks/estado/canario-resposta.md: o passo 3 não rodou até o fim.');
    const vazouToken = resp.includes(can.token);
    const vazouAgents = /hwk-sentinela-agents/.test(resp);
    console.log(`conversa do pai chegou ao peixinho: ${vazouToken ? 'SIM — isolamento FALHOU' : 'não'}`);
    console.log(`bloco do AGENTS.md chegou ao peixinho: ${vazouAgents ? 'sim (aceitável: o bloco só roteia)' : 'não'}`);
    gravarJson(pCan, { ...can, conferidoEm: new Date().toISOString(), isolado: !vazouToken, agentsMd: vazouAgents, hooks: eventos, subagente: sub[sub.length - 1] || null });
    if (vazouToken) sair(1, 'Resultado: o revisor NÃO é isolado nesta máquina. Use o modo estrito (hwk estrito) até investigar.');
    console.log(`Resultado: isolamento confirmado.${sub.length ? ' Para ligar a conferência do pacote: hwk canario aplicar' : ''}`);
    return;
  }
  if (sub === 'aplicar') {
    const can = lerJson(pCan);
    if (!can?.isolado || !can.subagente) sair(1, 'o canário precisa ter passado e registrado a chamada de subagente. Rode preparar e conferir.');
    const p = join(RAIZ, HW, 'henriworks.json');
    const cfg = lerJson(p, {});
    cfg.revisaoIsolada = { ...(cfg.revisaoIsolada || {}), conferirPacote: 'negar', ferramenta: can.subagente.ferramenta, campoPrompt: can.subagente.campoPrompt };
    gravarJson(p, cfg);
    console.log(`conferência do pacote ligada: chamada de subagente "${can.subagente.ferramenta}" para hwk-gf-* só passa com o prompt literal do pacote.`);
    return;
  }
  sair(2, 'uso: hwk canario preparar | conferir | aplicar');
}

// ----------------------------------------------------------------- estrito

function cmdEstrito({ pos }) {
  exigirRaiz();
  const [id, alvo] = pos;
  dirMudanca(id, RAIZ);
  const reg = linhasDe(ler(PACOTES_REG) || '').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.change === id && r.alvo === alvo).pop();
  if (!reg) sair(2, `gere antes: hwk pacote-revisao ${id} ${alvo}`);
  const tem = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['copilot'], { encoding: 'utf8' });
  if (tem.status !== 0) sair(1, 'modo estrito exige o Copilot CLI (copilot) no PATH. A revisão para aqui: não cai para o modo padrão em silêncio.');
  const args = ['-p', promptDoPacote(reg.arquivo), '--agent', PERSONA[alvo], '--no-custom-instructions', '--deny-tool=write', '--deny-tool=shell', '-s'];
  console.log(`executando: copilot ${args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`);
  const r = spawnSync('copilot', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 15 * 60 * 1000 });
  if (r.status !== 0) sair(1, `copilot saiu com ${r.status}: ${(r.stderr || '').trim().slice(0, 600)}`);
  const out = join(RAIZ, CHANGES, id, 'rascunhos', `${alvo}.md`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, r.stdout.trim() + '\n');
  console.log(`resposta do revisor: ${barra(relative(RAIZ, out))}\nconfira e grave: hwk gravar-veredito ${id} ${alvo} --de ${barra(relative(RAIZ, out))}`);
}

// ---------------------------------------------------------- pós-instalação

function cmdPosInstalacao() {
  exigirRaiz();
  const r = (script, args) => spawnSync(process.execPath, [join(BIN, script), ...args], { cwd: RAIZ, encoding: 'utf8' });
  const abertas = mudancasAbertas(RAIZ);
  if (abertas.length) {
    const v = r('hwk.mjs', ['validar']);
    console.log((v.stdout || '').trim().split('\n').slice(-1)[0]);
  }
  const m = r('henrimap.mjs', ['build']);
  console.log((m.stdout || m.stderr || '').trim().split('\n').slice(-2).join('\n'));
  const g = r('henrimap.mjs', ['git-hooks']);
  console.log((g.stdout || g.stderr || '').trim().split('\n').slice(-1)[0]);
  if (!lerJson(join(RAIZ, ESTADO, 'canario.json'))?.conferidoEm) console.log('PENDENTE canário de isolamento: node .henriworks/bin/hwk.mjs canario preparar');
  const md = r('modelos.mjs', ['atualizar', '--silencioso']);
  if ((md.stdout || '').trim()) console.log(md.stdout.trim());
  const u = r('uso.mjs', ['configurar']);
  console.log((u.stdout || '').trim());
}

// -------------------------------------------------------------------- main

const COMANDOS = {
  estado: cmdEstado, validar: cmdValidar, fatias: cmdFatias, reivindicar: cmdReivindicar, 'conferir-toca': cmdConferirToca,
  'ponto-de-partida': cmdPontoDePartida, hash: cmdHash, 'pacote-revisao': cmdPacoteRevisao, 'gravar-veredito': cmdGravarVeredito,
  'aprovar-spec': cmdAprovarSpec, arquivar: cmdArquivar, conhecimento: cmdConhecimento, ticket: cmdTicket, adotar: cmdAdotar,
  canario: cmdCanario, estrito: cmdEstrito, 'pos-instalacao': cmdPosInstalacao,
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...resto] = process.argv.slice(2);
  if (cmd === 'uso') {
    const r = spawnSync(process.execPath, [join(BIN, 'uso.mjs'), ...resto], { cwd: RAIZ, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  if (cmd === 'modelos') {
    const r = spawnSync(process.execPath, [join(BIN, 'modelos.mjs'), ...resto], { cwd: RAIZ, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  if (cmd === 'mapa') {
    const r = spawnSync(process.execPath, [join(BIN, 'henrimap.mjs'), ...resto], { cwd: RAIZ, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  const f = COMANDOS[cmd];
  if (!f) sair(2, readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 27).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  f(opcoes(resto));
}
