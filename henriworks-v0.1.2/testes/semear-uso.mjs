#!/usr/bin/env node
// HenriWorks - semeia uma pasta de uso com dados SIMULADOS, para ver o painel sem uso real.
// Mesmo formato que hook.mjs e "uso.mjs importar" gravam. Não toca na sua pasta de uso real.
//
//   node testes/semear-uso.mjs <pasta-de-teste>
//
// Depois, no mesmo terminal, aponte o painel para essa pasta:
//   PowerShell:  $env:HENRIWORKS_USO = "<pasta-de-teste>"; Remove-Item Env:COPILOT_OTEL_FILE_EXPORTER_PATH -ErrorAction SilentlyContinue
//   bash/zsh:    export HENRIWORKS_USO="<pasta-de-teste>"; unset COPILOT_OTEL_FILE_EXPORTER_PATH
//   node .henriworks/bin/uso.mjs painel
// Tirar o COPILOT_OTEL_FILE_EXPORTER_PATH só nesse terminal evita importar o seu OTel real para a pasta de teste.
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const DIR = process.argv[2];
if (!DIR) { console.error('uso: node testes/semear-uso.mjs <pasta-de-teste>'); process.exit(2); }
if (existsSync(DIR) && readdirSync(DIR).length) { console.error(`${DIR} já tem arquivos. Use uma pasta nova e vazia: o script não mistura teste com uso real.`); process.exit(2); }
for (const d of ['eventos', 'consumo']) mkdirSync(join(DIR, d), { recursive: true });
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const PRECO = { 'claude-sonnet-5.5': [2, 0.1, 10], 'claude-opus-5.5': [4, 0.2, 20], 'gpt-6-luna': [0.1, 0.01, 0.5] };
const ev = (o) => appendFileSync(join(DIR, 'eventos', `${o.t.slice(0, 7)}.jsonl`), JSON.stringify(o) + '\n');
const co = (o) => appendFileSync(join(DIR, 'consumo', `${o.t.slice(0, 7)}.jsonl`), JSON.stringify(o) + '\n');
let nId = 0;
function sessao({ dia, hora, repo, branch, ticket, change, agente, subs = [], alvo, modelo, mapa = true, negar = [] }) {
  const sid = `sim-${++nId}`;
  let t = new Date(`${dia}T${hora}:00-03:00`).getTime();
  const iso = () => new Date(t).toISOString();
  ev({ t: iso(), ev: 'sessionStart', sid, repo, branch, ticket, change });
  if (agente) ev({ t: iso(), ev: 'userPromptSubmitted', sid, repo, agente });
  t += 40e3;
  if (agente && mapa) ev({ t: iso(), ev: 'preToolUse', sid, repo, ferramenta: 'run_in_terminal', cat: 'mapa' });
  if (agente && !mapa) { ev({ t: iso(), ev: 'preToolUse', sid, repo, ferramenta: 'grep_search', cat: 'busca' }); ev({ t: iso(), ev: 'preToolUse', sid, repo, decisao: 'negar', motivo: 'mapa-primeiro' }); }
  for (const m of negar) ev({ t: iso(), ev: 'preToolUse', sid, repo, decisao: 'negar', motivo: m });
  for (let i = 0; i < 6; i++) { t += 50e3; ev({ t: iso(), ev: 'preToolUse', sid, repo, ferramenta: ['read_file', 'grep_search', 'replace_string_in_file', 'run_in_terminal'][i % 4], cat: ['leitura', 'busca', 'escrita', agente ? 'hwk' : 'terminal'][i % 4] }); }
  for (const s of subs) { t += 30e3; ev({ t: iso(), ev: 'subagentStart', sid, repo, subagente: s }); }
  // chamadas de modelo até chegar perto do alvo de créditos
  const [pe, pc, ps] = PRECO[modelo];
  let cred = 0;
  while (cred < alvo) {
    t += 70e3 + rnd() * 90e3;
    const inn = Math.round(30e3 + rnd() * 50e3), cr = Math.round(inn * (0.45 + rnd() * 0.3)), out = Math.round(1500 + rnd() * 3500);
    let c = ((inn - cr) * pe + cr * pc + out * ps) / 1e6 * 100;
    let o = out;
    if (cred + c > alvo + 1.5) { const falta = alvo - cred; const f = Math.max(falta / c, 0.05); o = Math.round(out * f); c *= f; }
    co({ t: iso(), conv: sid, modelo, in: Math.round(inn * (o / out)), out: o, cr: Math.round(cr * (o / out)), cw: 0, rz: 0, id: `${sid}-${t}` });
    cred += c;
  }
  ev({ t: iso(), ev: 'sessionEnd', sid, repo });
}
const dias = (ini, n) => { const r = []; const d = new Date(`${ini}T12:00:00-03:00`); while (r.length < n) { if (d.getDay() % 6) r.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } return r; };

// 1) migrar-cliente-http: estourou o orçamento (250)
const M = { repo: 'extrato-mfe', branch: 'feature/EXT-1987-cliente-http', ticket: 'EXT-1987', change: 'migrar-cliente-http' };
[['hwk-discovery', 18, 'claude-sonnet-5.5'], ['hwk-plan', 34, 'claude-opus-5.5'], ['hwk-review', 22, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf']], ['hwk-implement', 41, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-implement', 46, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-implement', 39, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-plan', 21, 'claude-opus-5.5'], ['hwk-implement', 30, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-review', 19, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf', 'hwk-gf']]]
  .forEach(([agente, alvo, modelo, subs], i) => sessao({ ...M, dia: dias('2026-10-13', 9)[i], hora: '10:1' + i, agente, alvo, modelo, subs, mapa: i !== 1, negar: i === 6 ? ['imutavel'] : [] }));

// 2) corrigir-filtro-periodo: 85% (150)
const F = { repo: 'extrato-mfe', branch: 'fix/EXT-2033-filtro-periodo', ticket: 'EXT-2033', change: 'corrigir-filtro-periodo' };
[['hwk-discovery', 14, 'claude-sonnet-5.5'], ['hwk-plan', 19, 'claude-sonnet-5.5'], ['hwk-review', 16, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf']], ['hwk-implement', 38, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-review', 24, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf', 'hwk-gf']], ['hwk-archive', 17, 'claude-sonnet-5.5']]
  .forEach(([agente, alvo, modelo, subs], i) => sessao({ ...F, dia: dias('2026-10-20', 6)[i], hora: '15:2' + i, agente, alvo, modelo, subs, negar: i === 4 ? ['pacote'] : [] }));

// 3) mostrar-saldo-projetado: 78% (400), rigor Full, 14 sessões
const S = { repo: 'extrato-mfe', branch: 'feature/EXT-2041-saldo-projetado', ticket: 'EXT-2041', change: 'mostrar-saldo-projetado' };
const plano = [['hwk', 8, 'claude-sonnet-5.5'], ['hwk-discovery', 14, 'claude-sonnet-5.5'], ['hwk-plan', 19, 'claude-opus-5.5'], ['hwk-plan', 22, 'claude-opus-5.5'], ['hwk-review', 17, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf', 'hwk-gf', 'hwk-gf', 'hwk-gf']], ['hwk-plan', 24, 'claude-opus-5.5'],
  ['hwk-implement', 27, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-implement', 27, 'claude-sonnet-5.5', ['hwk-implementador']], ['hwk-implement', 47, 'claude-sonnet-5.5', ['hwk-implementador', 'hwk-implementador']], ['hwk-implement', 26, 'claude-sonnet-5.5', ['design-to-code']], ['hwk-implement', 21, 'claude-sonnet-5.5', ['hwk-implementador']],
  ['hwk-review', 22, 'claude-opus-5.5', ['hwk-gf', 'hwk-gf', 'hwk-gf']], ['hwk-archive', 22, 'claude-sonnet-5.5'], ['hwk-archive', 16, 'claude-sonnet-5.5']];
const dS = dias('2026-10-23', 11);
plano.forEach(([agente, alvo, modelo, subs], i) => sessao({ ...S, repo: i >= 6 && i <= 7 ? 'extrato-bff' : 'extrato-mfe', dia: dS[Math.min(Math.floor(i * 0.8), 10)], hora: i % 2 ? '14:0' + (i % 10) : '09:3' + (i % 10), agente, alvo, modelo, subs, mapa: i !== 6, negar: i === 9 ? ['mapa-primeiro'] : [] }));

// 4) sessões fora do fluxo, algumas sem ticket
[['2026-10-14', 6, null], ['2026-10-17', 9, 'EXT-1990'], ['2026-10-22', 4, null], ['2026-10-28', 7, 'EXT-2041'], ['2026-10-30', 5, null], ['2026-11-04', 8, 'EXT-2050'], ['2026-11-05', 3, 'EXT-2050']]
  .forEach(([dia, alvo, ticket], i) => sessao({ dia, hora: '17:05', repo: 'extrato-mfe', branch: ticket ? `fix/${ticket}` : 'main', ticket, change: null, agente: null, alvo, modelo: i % 2 ? 'gpt-6-luna' : 'claude-sonnet-5.5' }));

writeFileSync(join(DIR, 'orcamentos.json'), JSON.stringify({
  'migrar-cliente-http': { creditos: 250, alertado: 1, em: '2026-10-13T13:00:00Z' },
  'corrigir-filtro-periodo': { creditos: 150, alertado: 0.8, em: '2026-10-20T18:00:00Z' },
  'mostrar-saldo-projetado': { creditos: 400, alertado: 0.5, em: '2026-10-23T12:00:00Z' },
}, null, 2));
// lista de política de exemplo, para o bloco de modelos do painel
mkdirSync(join(DIR, 'modelos'), { recursive: true });
// Política de exemplo: os modelos da referência do pacote, com três estados trocados para o painel
// mostrar alerta (gpt-6-luna usado e bloqueado).
writeFileSync(join(DIR, 'modelos', 'liberados.json'), JSON.stringify({
  obtidoEm: new Date().toISOString(), escopo: 'org:exemplo', padrao: 'disabled', fonte: 'semear-uso.mjs',
  modelos: [
    {id: 'copilot-fusion', nome: 'Copilot Fusion', estado: 'enabled'},
    {id: 'hydrafusion', nome: 'HydraFusion', estado: 'enabled'},
    {id: 'claude-fable-5.1', nome: 'Claude Fable 5.1', estado: 'enabled'},
    {id: 'claude-haiku-4.5', nome: 'Claude Haiku 4.5', estado: 'enabled'},
    {id: 'claude-haiku-5.5', nome: 'Claude Haiku 5.5', estado: 'enabled'},
    {id: 'claude-opus-5.5', nome: 'Claude Opus 5.5', estado: 'enabled'},
    {id: 'claude-sonnet-5.5', nome: 'Claude Sonnet 5.5', estado: 'enabled'},
    {id: 'gemini-3.8-flash', nome: 'Gemini 3.8 Flash', estado: 'enabled'},
    {id: 'gemini-4-argon', nome: 'Gemini 4 Argon', estado: 'enabled'},
    {id: 'gpt-5.3-codex', nome: 'GPT-5.3-Codex', estado: 'enabled'},
    {id: 'gpt-6-astra', nome: 'GPT-6 Astra', estado: 'enabled'},
    {id: 'gpt-6-luna', nome: 'GPT-6 Luna', estado: 'disabled'},
    {id: 'gpt-6.1-sol', nome: 'GPT-6.1 Sol', estado: 'enabled'},
    {id: 'gpt-6.1-terra', nome: 'GPT-6.1 Terra', estado: 'enabled'},
    {id: 'grok-4.7', nome: 'Grok 4.7', estado: 'disabled'},
    {id: 'kimi-k3', nome: 'Kimi K3', estado: 'optional'},
    {id: 'mai-code-1.1-flash', nome: 'MAI-Code-1.1-Flash', estado: 'enabled'}
  ],
}, null, 2));
// arquivo OTel vazio: o painel não avisa "sem OTel" e não importa nada de fora
mkdirSync(join(DIR, 'otel'), { recursive: true });
writeFileSync(join(DIR, 'otel', 'copilot-otel.jsonl'), '');
console.log(`semeado: ${nId} sessões simuladas em ${DIR}`);
