#!/usr/bin/env node
// HenriWorks - teste de fumaça do pacote. Sem dependência, Node 20+, sem rede.
//
//   node testes/smoke.mjs [--manter]
//
// Cria um repositório Git temporário, instala o pacote nele, percorre o fluxo inteiro por script
// (plano, revisão da spec, implementação, revisão de código, archive, conhecimento) e confere as
// guardas do hook com eventos sintéticos. Nada fora da pasta temporária é tocado: o uso vai para
// HENRIWORKS_USO dentro dela. Use no Windows para validar a máquina antes do canário.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const PACOTE = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSAO = JSON.parse(readFileSync(join(PACOTE, 'manifesto.json'), 'utf8')).versao;
const TMP = mkdtempSync(join(tmpdir(), 'hwk-smoke-'));
const REPO = join(TMP, 'repo');
const ENV = { ...process.env, HENRIWORKS_USO: join(TMP, 'uso'), COPILOT_OTEL_ENABLED: '', COPILOT_OTEL_FILE_EXPORTER_PATH: '' };
const ID = 'evitar-acordo-duplicado';
let falhas = 0;
let passos = 0;

function rodar(cmd, args, { stdin, ok = true } = {}) {
  const r = spawnSync(cmd, args, { cwd: REPO, env: ENV, encoding: 'utf8', input: stdin });
  const saida = `${r.stdout || ''}${r.stderr || ''}`;
  if (ok && r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} saiu com ${r.status}\n${saida}`);
  return { status: r.status, saida, stdout: r.stdout || '' };
}
const node = (script, args, o) => rodar(process.execPath, [script, ...args], o);
const hwk = (...a) => node('.henriworks/bin/hwk.mjs', a);
const git = (...a) => rodar('git', ['-c', 'user.email=smoke@hwk', '-c', 'user.name=smoke', ...a]);
const escrever = (p, t) => { mkdirSync(dirname(join(REPO, p)), { recursive: true }); writeFileSync(join(REPO, p), t); };

function passo(nome, f) {
  passos++;
  try {
    f();
    console.log(`ok    ${nome}`);
  } catch (e) {
    falhas++;
    console.log(`FALHA ${nome}\n      ${String(e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}
const esperar = (cond, msg) => { if (!cond) throw new Error(msg); };

// ------------------------------------------------------------------ repositório
mkdirSync(REPO);
git('init', '-q', '-b', 'main');
escrever('src/app/core/api/acordo-api.ts', "export class AcordoApi {\n  confirmar(id: string) {\n    return fetch(`/api/acordos/${id}`, { method: 'POST' });\n  }\n}\n");
escrever('src/app/feature/confirmacao/confirmacao.component.ts', "import { AcordoApi } from '../../core/api/acordo-api';\nexport class ConfirmacaoComponent {\n  constructor(private api: AcordoApi) {}\n}\n");
escrever('bff/src/main/java/br/exemplo/AcordoController.java', 'package br.exemplo;\n@RestController\n@RequestMapping("/api/acordos")\npublic class AcordoController {\n  @PostMapping("/{id}")\n  public String confirmar() { return "ok"; }\n}\n');
escrever('AGENTS.md', '# Time\n\nRegras do time.\n');
git('add', '-A');
git('commit', '-qm', 'app');

passo('instalador: repo', () => {
  const r = node(join(PACOTE, 'instalar.mjs'), ['repo', '.']);
  esperar(r.saida.includes(`Instalado ${VERSAO}`), r.saida);
});
passo('git status limpo depois de instalar', () => {
  const s = git('status', '--porcelain', '--untracked-files=all').stdout.trim();
  esperar(!s, `apareceu no git status:\n${s}`);
});
passo('instalador: segunda vez é idempotente', () => {
  const r = node(join(PACOTE, 'instalar.mjs'), ['repo', '.']);
  esperar(!/criar|atualizar|CONFLITO/.test(r.saida.split('Pós-instalação')[0]), r.saida);
});

passo('init: instalação, hooks, modelos e preços do pacote, sem grave', () => {
  const r = node('.henriworks/bin/hwk.mjs', ['init', '--corrigir', '--json'], { ok: false });
  const j = JSON.parse(r.stdout);
  const item = (id) => j.itens.find((i) => i.id === id);
  esperar(r.status === 0 && j.resumo.grave === 0, r.saida);
  esperar(item('instalacao')?.nivel === 'ok' && /9 agentes/.test(item('instalacao').txt), JSON.stringify(item('instalacao')));
  esperar(item('hooks')?.nivel === 'ok', JSON.stringify(item('hooks')));
  esperar(/referência do pacote: 17 modelos/.test(item('modelos')?.txt || ''), JSON.stringify(item('modelos')));
  esperar(item('precos')?.nivel === 'ok', JSON.stringify(item('precos')));
  esperar(item('canário')?.nivel === 'pendente' && item('otel')?.nivel === 'pendente', 'canário e OTel deveriam estar pendentes');
});

passo('canário no mesmo chat: preparar, pacote para hwk-gf, conferir, aplicar', () => {
  hwk('canario', 'preparar');
  const p = hwk('pacote-revisao', 'canario').saida;
  esperar(/subagente: hwk-gf\n/.test(p), p);
  const prompt = p.match(/Pacote de revisão: \S+\. Leia esse arquivo e apenas os arquivos que ele lista\. Responda só no formato que ele pede\./)[0];
  // o que o VS Code mandaria ao hook na delegação; a prova do init não pode contar como evento
  node('.henriworks/bin/hook.mjs', ['preToolUse'], { stdin: JSON.stringify({ session_id: 'c1', cwd: REPO, tool_name: 'runSubagent', tool_input: { agentName: 'hwk-gf', prompt } }) });
  escrever('.henriworks/estado/canario-resposta.md', '1. nenhuma\n2. nenhuma\n3. nenhuma\n');
  const c = hwk('canario', 'conferir').saida;
  esperar(/isolamento confirmado/.test(c) && /runSubagent/.test(c), c);
  hwk('canario', 'aplicar');
  const j = JSON.parse(node('.henriworks/bin/hwk.mjs', ['init', '--json']).stdout);
  esperar(j.itens.find((i) => i.id === 'canário')?.nivel === 'ok', JSON.stringify(j.itens.find((i) => i.id === 'canário')));
});

// verificação trivial, que roda em qualquer máquina
escrever('.henriworks/verificacao.json', JSON.stringify({
  verificacoes: { nada: { comando: `"${process.execPath}" -e "0"`, formato: 'linhas', padrao: '^(?<arquivo>NUNCA):(?<linha>\\d+): (?<mensagem>.+)$', regra: 'nada', classificacao: 'linhas-alteradas' } },
  camadas: { core: { arquivos: ['src/app/core/**'], verificacoes: ['nada'] }, feature: { arquivos: ['src/app/feature/**'], verificacoes: ['nada'] } },
}, null, 2));

passo('mapa: query, explain e affected', () => {
  const q = node('.henriworks/bin/henrimap.mjs', ['query', 'acordo']).saida;
  esperar(/AcordoApi|acordo-api/.test(q), q);
  const a = node('.henriworks/bin/henrimap.mjs', ['affected', 'src/app/core/api/acordo-api.ts']).saida;
  esperar(/confirmacao\.component/.test(a), a);
});

// ------------------------------------------------------------------ plano
git('checkout', '-qb', 'feature/INC-4472-duplicado');
const C = `.henriworks/changes/${ID}`;
escrever(`${C}/proposta.md`, `# Evitar acordo duplicado

Ticket: INC-4472
Branch: feature/INC-4472-duplicado
Base:   main
Rigor:  Lite

## Intenção
Segunda confirmação do mesmo contrato não pode gerar outro acordo.

## Escopo
Dentro: confirmação idempotente. Fora: limpeza de duplicatas antigas.

## Restrições
- O contrato da API de efetivação não muda.

## Critérios de aceite
1. MUST mostrar o acordo existente. Dado um acordo criado, quando confirmar de novo, então vê o mesmo acordo.
`);
escrever(`${C}/tarefas/01-cliente-acordo-existente.md`, `# 01. Cliente devolve acordo existente
Demonstra: a segunda chamada devolve o acordo já criado.
Bloqueado por: nenhum
Toca: src/app/core/api/
Executor: hwk-implementador

## Ponteiros
- proposta.md, critério 1

- [ ] 1.1 Tratar resposta 200 com acordo existente em \`src/app/core/api/acordo-api.ts\`
`);
escrever(`${C}/tarefas/02-verificacao.md`, `# 02. Verificação
Bloqueado por: todos
Escopo: core

- [ ] 2.1 \`node .henriworks/bin/verificar.mjs ${ID}\` sem achado BLOQUEANTE
`);

passo('validar sem erro', () => { hwk('validar', ID); });
passo('fatias --gravar gera o índice', () => {
  hwk('fatias', ID, '--gravar');
  esperar(existsSync(join(REPO, C, 'tarefas', 'index.md')), 'index.md não foi gerado');
});
passo('estado: revisão da spec', () => {
  const e = JSON.parse(hwk('estado', '--json').stdout);
  const m = e.mudancas.find((x) => x.id === ID);
  esperar(m && /revis/.test(m.fase), JSON.stringify(m));
});

// ------------------------------------------------------------------ revisão da spec
function revisar(alvo, rotulo, campo) {
  const p = hwk('pacote-revisao', ID, alvo).saida;
  const prompt = (p.match(/Pacote de revisão: \S+\. Leia esse arquivo e apenas os arquivos que ele lista\. Responda só no formato que ele pede\./) || [])[0];
  esperar(prompt, `pacote-revisao ${alvo} não imprimiu o prompt literal:\n${p}`);
  const valor = (p.match(new RegExp(`${campo}:\\s*(\\S+)`)) || [])[1]
    || (readFileSync(join(REPO, prompt.match(/Pacote de revisão: (\S+)\./)[1]), 'utf8').match(new RegExp(`${campo}:\\s*(\\S+)`)) || [])[1];
  esperar(valor, `o pacote ${alvo} não declara "${campo}:"`);
  escrever(`${C}/rascunhos/${alvo}.md`, `# ${rotulo} - APROVADO\n${campo}: ${valor}\nAchados: 0\n`);
  hwk('gravar-veredito', ID, alvo, '--de', `${C}/rascunhos/${alvo}.md`);
  return prompt;
}
let promptDesign;
passo('revisão da spec (Lite): design e prontidão', () => {
  promptDesign = revisar('design', 'spec-design', 'Spec revisada');
  revisar('prontidao', 'spec-prontidao', 'Spec revisada');
});
passo('pacote leva a lente; hook só deixa o hwk-gf receber o prompt literal', () => {
  const pac = readFileSync(join(REPO, promptDesign.match(/Pacote de revisão: (\S+)\./)[1]), 'utf8');
  esperar(/## Sua lente nesta revisão/.test(pac) && /Peixinho de design/.test(pac) && /Revisor: hwk-gf/.test(pac), pac.slice(0, 600));
  const chamar = (prompt) => node('.henriworks/bin/hook.mjs', ['preToolUse'], { stdin: JSON.stringify({ session_id: 's2', cwd: REPO, tool_name: 'runSubagent', tool_input: { agentName: 'hwk-gf', prompt } }) }).stdout;
  esperar(!/deny/.test(chamar(promptDesign)), 'prompt literal foi negado');
  esperar(/"permissionDecision":"deny"/.test(chamar(`${promptDesign} Atenção ao cache.`)), 'prompt com texto acrescentado passou');
});
passo('veredito não é sobrescrito por edição (hook nega)', () => {
  const ev = { session_id: 's1', cwd: REPO, tool_name: 'replace_string_in_file', tool_input: { filePath: join(REPO, C, 'revisao-spec', 'x.md') } };
  const r = node('.henriworks/bin/hook.mjs', ['preToolUse'], { stdin: JSON.stringify(ev) }).stdout;
  esperar(/"permissionDecision":"deny"/.test(r), r);
});
passo('aprovar-spec', () => { hwk('aprovar-spec', ID, '--por', 'Smoke'); });

// ------------------------------------------------------------------ implementação
passo('implementar fatia 01 e conferir Toca', () => {
  hwk('reivindicar', ID, '01');
  escrever('src/app/core/api/acordo-api.ts', "export class AcordoApi {\n  confirmar(id: string) {\n    return fetch(`/api/acordos/${id}`, { method: 'POST' }).then((r) => (r.status === 200 ? r.json() : null));\n  }\n}\n");
  const t = readFileSync(join(REPO, C, 'tarefas', '01-cliente-acordo-existente.md'), 'utf8').replace('- [ ] 1.1', '- [x] 1.1');
  escrever(`${C}/tarefas/01-cliente-acordo-existente.md`, t);
  const r = hwk('conferir-toca', ID).saida;
  esperar(!/fora do Toca/.test(r), r);
  hwk('conferir-toca', ID, '--liberar');
  git('add', 'src');
  git('commit', '-qm', 'fix(acordo): devolve acordo existente');
});
passo('verificar --salvar', () => {
  const r = node('.henriworks/bin/verificar.mjs', [ID, '--salvar']).saida;
  esperar(!/BLOQUEANTE:\s*[1-9]/.test(r), r);
  const t = readFileSync(join(REPO, C, 'tarefas', '02-verificacao.md'), 'utf8').replace('- [ ] 2.1', '- [x] 2.1');
  escrever(`${C}/tarefas/02-verificacao.md`, t);
});

// ------------------------------------------------------------------ revisão de código
passo('revisão de código: três eixos', () => {
  for (const eixo of ['spec', 'padroes', 'plantao']) revisar(eixo, eixo, 'Commit revisado');
});
passo('estado: archive', () => {
  const e = JSON.parse(hwk('estado', '--json').stdout);
  const m = e.mudancas.find((x) => x.id === ID);
  esperar(m && /archive|arquiv/.test(m.fase), JSON.stringify(m));
});

// ------------------------------------------------------------------ archive e conhecimento
let pasta;
passo('arquivar', () => {
  escrever(`${C}/resumo.md`, '## fix(acordo): devolve acordo existente\n\nA segunda confirmação devolve o acordo já criado.\n\n### Risco do merge\nBaixo.\n');
  hwk('arquivar', ID);
  pasta = readdirSync(join(REPO, '.henriworks', 'changes', 'archive')).find((d) => d.endsWith(ID));
  esperar(pasta, 'a mudança não foi para archive/');
});
passo('archive é imutável pelo terminal (hook nega)', () => {
  const ev = { session_id: 's1', cwd: REPO, tool_name: 'run_in_terminal', tool_input: { command: `rm .henriworks/changes/archive/${pasta}/proposta.md` } };
  const r = node('.henriworks/bin/hook.mjs', ['preToolUse'], { stdin: JSON.stringify(ev) }).stdout;
  esperar(/"permissionDecision":"deny"/.test(r), r);
});
passo('conhecimento: único arquivo novo no git status', () => {
  hwk('conhecimento', pasta, '--pr', '1');
  const s = git('status', '--porcelain', '--untracked-files=all').stdout.trim().split('\n').filter(Boolean);
  esperar(s.length === 1 && /conhecimento\/.+\.md$/.test(s[0]), `git status:\n${s.join('\n')}`);
});

// ------------------------------------------------------------------ hooks
passo('hook: mapa antes de busca nega uma vez numa sessão hwk', () => {
  const ini = (ev) => node('.henriworks/bin/hook.mjs', [ev.ev, ...(ev.agente ? ['--agente', ev.agente] : [])], { stdin: JSON.stringify({ session_id: 's2', cwd: REPO, ...ev.corpo }) }).stdout;
  ini({ ev: 'sessionStart', corpo: {} });
  ini({ ev: 'userPromptSubmitted', agente: 'hwk-plan', corpo: { prompt: 'x' } });
  const busca = { ev: 'preToolUse', corpo: { tool_name: 'grep_search', tool_input: { query: 'acordo' } } };
  const r1 = ini(busca);
  const r2 = ini(busca);
  esperar(/deny/.test(r1) && !/deny/.test(r2), `1ª: ${r1}\n2ª: ${r2}`);
});
passo('hook: evento inválido não derruba a sessão', () => {
  const r = node('.henriworks/bin/hook.mjs', ['preToolUse'], { stdin: '{isto não é json' });
  esperar(r.status === 0 && r.stdout.trim() === '{}', `${r.status} ${r.stdout}`);
});
// ------------------------------------------------------------------ modelos liberados
passo('modelos: lista da política, cruzamento com uso e preço, painel', () => {
  const politica = { obtidoEm: new Date().toISOString(), escopo: 'org:exemplo', politica: { default_availability: { policy_state: 'disabled' }, models: [
    { model_name: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', policy_state: 'enabled' },
    { model_name: 'gpt-5-mini', display_name: 'GPT-5 mini', policy_state: 'disabled' },
    { model_name: 'modelo-sem-preco', display_name: 'Modelo Sem Preço', policy_state: 'enabled' },
  ] } };
  writeFileSync(join(TMP, 'politica.json'), JSON.stringify(politica));
  const at = hwk('modelos', 'atualizar', '--de', join(TMP, 'politica.json')).saida;
  esperar(/3 na política, 2 liberado/.test(at), at);
  const t = new Date().toISOString();
  mkdirSync(join(TMP, 'uso', 'consumo'), { recursive: true });
  writeFileSync(join(TMP, 'uso', 'consumo', `${t.slice(0, 7)}.jsonl`), [
    { t, conv: 's9', modelo: 'claude-sonnet-5-20261001', in: 1000, out: 100, cr: 0, cw: 0 },
    { t, conv: 's9', modelo: 'gpt-5-mini', in: 1000, out: 100, cr: 0, cw: 0 },
  ].map((x) => JSON.stringify(x)).join('\n') + '\n');
  const lista = node('.henriworks/bin/modelos.mjs', ['--json']).stdout;
  const linhas = JSON.parse(lista).modelos;
  const por = (id) => linhas.find((l) => l.id === id);
  esperar(por('claude-sonnet-5')?.usado && !por('claude-sonnet-5').alertas.length, `sonnet: ${JSON.stringify(por('claude-sonnet-5'))}`);
  esperar(por('gpt-5-mini')?.alertas.some((a) => a.sev === 'crit'), `gpt-5-mini deveria ter alerta grave: ${lista}`);
  esperar(por('modelo-sem-preco')?.alertas.some((a) => /sem preço/.test(a.txt)), `modelo-sem-preco: ${lista}`);
  const c = node('.henriworks/bin/modelos.mjs', ['conferir'], { ok: false });
  esperar(c.status === 1 && /GRAVE gpt-5-mini/.test(c.saida), c.saida);
  node('.henriworks/bin/uso.mjs', ['painel']);
  const html = readFileSync(join(TMP, 'uso', 'painel', 'index.html'), 'utf8');
  esperar(html.includes('Modelos · política × uso × preço') && html.includes('modelo-sem-preco'), 'painel sem o bloco de modelos');
});

passo('hook: nada de prompt gravado no uso', () => {
  const dir = join(TMP, 'uso', 'eventos');
  const tudo = existsSync(dir) ? readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8')).join('') : '';
  esperar(tudo && !/acordo'|"query"|"prompt"/.test(tudo), 'o registro de uso contém texto de prompt ou argumento');
});

console.log(`\n${passos - falhas}/${passos} passos ok${falhas ? `, ${falhas} falha(s)` : ''}. Pasta: ${TMP}`);
if (!process.argv.includes('--manter') && !falhas) rmSync(TMP, { recursive: true, force: true });
process.exit(falhas ? 1 : 0);
