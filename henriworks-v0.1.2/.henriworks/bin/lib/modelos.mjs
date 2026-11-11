// HenriWorks - modelos: tabela de preço, consumo e a lista de modelos liberados pela política do
// Copilot. Compartilhado por uso.mjs (painel) e modelos.mjs (CLI). Sem dependência, Node 20+.
//
// A lista oficial vem da API de política de modelos do GitHub (GA em 19/10/2026):
//   GET /orgs/{org}/copilot/model-policies
//   GET /enterprises/{enterprise}/copilot/model-policies
// Ela diz a POLÍTICA de cada modelo, não o que cada pessoa consegue usar (acesso por time soma).
// Por isso o cruzamento usa também o que o OTel registrou como usado de fato.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USO_DIR, lerJson, linhasDe } from './comum.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const LIBERADOS = join(USO_DIR, 'modelos', 'liberados.json');
export const HISTORICO = join(USO_DIR, 'modelos', 'historico.jsonl');

// ---------------------------------------------------------------- preço e consumo

export const PRECOS_PACOTE = join(AQUI, '..', '..', 'config', 'precos.json');
export const PRECOS_USUARIO = join(USO_DIR, 'precos.json');
export const REFERENCIA = join(AQUI, '..', '..', 'config', 'modelos-referencia.json');
export const FONTE_PACOTE = 'pacote:config/modelos-referencia.json';

function lerTabela(p) {
  if (!existsSync(p)) return { tabela: null, erro: null };
  try { return { tabela: JSON.parse(readFileSync(p, 'utf8')), erro: null }; } catch (e) { return { tabela: null, erro: e.message }; }
}

// Qual tabela vale e o que há de errado nela. A do usuário vence a do pacote; JSON inválido no usuário
// não derruba o painel: cai para a do pacote, com aviso.
export function infoPrecos() {
  const avisos = [];
  const u = lerTabela(PRECOS_USUARIO);
  const k = lerTabela(PRECOS_PACOTE);
  if (u.erro) avisos.push(`${PRECOS_USUARIO} não é JSON válido (${u.erro}): usando a tabela do pacote`);
  const usuarioValida = u.tabela && Array.isArray(u.tabela.modelos) && u.tabela.modelos.length;
  if (u.tabela && !usuarioValida) avisos.push(`${PRECOS_USUARIO} sem "modelos": usando a tabela do pacote`);
  const tabela = usuarioValida ? { semPreco: k.tabela?.semPreco || [], ...u.tabela } : k.tabela || { modelos: [], credito_usd: 0.01 };
  const origem = usuarioValida ? 'usuario' : k.tabela ? 'pacote' : 'nenhuma';
  for (const m of tabela.modelos || []) {
    for (const c of ['entrada', 'saida']) if (!(typeof m[c] === 'number' && m[c] > 0)) avisos.push(`preço de ${m.id || '?'}: "${c}" ausente ou zero (o custo dele sai zerado)`);
    try { new RegExp(m.padrao, 'i'); } catch { avisos.push(`preço de ${m.id || '?'}: padrão inválido`); }
  }
  return { tabela, origem, avisos, pacote: k.tabela, usuario: usuarioValida ? u.tabela : null };
}

export function precos() {
  const { tabela } = infoPrecos();
  // padrão inválido não pode derrubar o painel: fica de fora do casamento
  tabela.modelos = (tabela.modelos || []).filter((m) => { try { new RegExp(m.padrao, 'i'); return true; } catch { return false; } });
  return tabela;
}

export const precoDe = (nome, tabela) => tabela.modelos.find((x) => new RegExp(x.padrao, 'i').test(String(nome || ''))) || null;

// Chamada de fundo do VS Code: sugestões no editor (NES), título do chat, mensagem de commit, busca nas
// configurações, embeddings. Não é o chat do dev; sai dos gráficos e dos alertas de preço.
const ORIGEM_FUNDO = /^(XtabProvider|gitCommitMessageGenerator|copilotLanguageModelWrapper\/|settingsEditorSearchSuggestions)/;
export const ehFundo = (c) => ORIGEM_FUNDO.test(String(c.origem || '')) || /copilot-nes|metis|embedding/i.test(String(c.modelo || ''));

// O Copilot grava o consumo cobrado em copilot_chat.copilot_usage_nano_aiu: nano_aiu / 1e9 = créditos
// (calibrado: gpt-5.3-codex, 1.633 entrada + 104 saída = 431.375.000 nano = 0,431 crédito pela tabela).
// Quando existe, ele vence a tabela: já inclui desconto (Fusion) e preço de acordo.
export function custo(r, tabela) {
  if (r.aiu != null && Number.isFinite(Number(r.aiu))) return { usd: (Number(r.aiu) / 1e9) * (tabela.credito_usd || 0.01), semPreco: false, fonte: 'copilot' };
  const m = precoDe(r.modelo, tabela);
  if (!m) return { usd: 0, semPreco: !ehFundo(r) };
  const entrada = Math.max(r.in - r.cr - r.cw, 0);
  const usd = (entrada * m.entrada + r.cr * (m.cache_leitura ?? m.entrada) + r.cw * (m.cache_escrita ?? m.entrada) + r.out * m.saida) / 1e6;
  return { usd, semPreco: false, fonte: 'tabela' };
}

export function lerTodos(sub) {
  const d = join(USO_DIR, sub);
  if (!existsSync(d)) return [];
  return readdirSync(d).filter((n) => n.endsWith('.jsonl')).sort().flatMap((n) => linhasDe(readFileSync(join(d, n), 'utf8')).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
}

// ---------------------------------------------------------------- lista liberada

// Estados da API. "optional" e os de delegação não garantem acesso: dependem de outro nível.
export const ESTADOS = {
  enabled: { txt: 'liberado', libera: true },
  disabled: { txt: 'bloqueado', libera: false },
  optional: { txt: 'opcional', libera: null },
  delegate_to_organizations: { txt: 'delegado às orgs', libera: null },
  delegate_to_teams_and_apps: { txt: 'delegado a times e apps', libera: null },
};
export const estadoTexto = (e) => ESTADOS[e]?.txt || (e ? String(e) : 'fora da lista');

// Aceita a resposta crua da API ({ models: [...] }), a resposta embrulhada pelo job
// ({ obtidoEm, escopo, politica: { models } }) ou o formato já normalizado ({ modelos: [...] }).
export function normalizar(bruto, fonte) {
  if (!bruto || typeof bruto !== 'object') throw new Error('a fonte não devolveu JSON de política de modelos');
  const corpo = bruto.politica || bruto;
  const lista = Array.isArray(corpo.models) ? corpo.models : Array.isArray(bruto.modelos) ? bruto.modelos : null;
  if (!lista) throw new Error('JSON sem "models" (resposta da API) nem "modelos" (formato normalizado)');
  const modelos = lista.map((m) => ({
    id: String(m.model_name ?? m.id ?? '').trim(),
    nome: String(m.display_name ?? m.nome ?? m.model_name ?? m.id ?? '').trim(),
    estado: String(m.policy_state ?? m.estado ?? '').trim() || null,
  })).filter((m) => m.id).sort((a, b) => a.id.localeCompare(b.id));
  return {
    obtidoEm: bruto.obtidoEm || bruto.gerado_em || new Date().toISOString(),
    escopo: bruto.escopo || null,
    padrao: corpo.default_availability?.policy_state ?? bruto.padrao ?? null,
    fonte,
    modelos,
  };
}

export const lerLiberados = () => lerJson(LIBERADOS, null);

export function diferenca(antes, depois) {
  const a = new Map((antes?.modelos || []).map((m) => [m.id, m.estado]));
  const d = new Map((depois?.modelos || []).map((m) => [m.id, m.estado]));
  const mud = [];
  for (const [id, e] of d) if (!a.has(id)) mud.push({ id, de: null, para: e }); else if (a.get(id) !== e) mud.push({ id, de: a.get(id), para: e });
  for (const [id, e] of a) if (!d.has(id)) mud.push({ id, de: e, para: null });
  return mud;
}

// ---------------------------------------------------------------- casamento de nomes

// O OTel grava o id da resposta ("claude-sonnet-5-20261001"), a política usa o nome do modelo
// ("claude-sonnet-5") e o seletor do VS Code mostra o nome de exibição ("Claude Sonnet 5 (copilot)").
export function norm(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/\s*\((copilot|preview)\)\s*$/g, '')
    .replace(/^[a-z0-9-]+\//, '')
    .replace(/[\s._]+/g, '-')
    .replace(/-(?:\d{8}|\d{4}-\d{2}-\d{2})$/, '')
    .replace(/-+$/, '');
}
// Prefixo só casa quando a sobra é marca de versão de publicação, nunca outro modelo:
// "gpt-5" não casa com "gpt-5-mini", "claude-sonnet-5" casa com "claude-sonnet-5-latest".
const SOBRA_DE_VERSAO = /^(latest|preview|exp|\d{6,8})$/;
export function mesmoModelo(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [curto, longo] = x.length < y.length ? [x, y] : [y, x];
  return longo.startsWith(`${curto}-`) && SOBRA_DE_VERSAO.test(longo.slice(curto.length + 1));
}
export function acharNaLista(nome, lista) {
  return (lista?.modelos || []).find((m) => mesmoModelo(nome, m.id) || mesmoModelo(nome, m.nome)) || null;
}

// ---------------------------------------------------------------- cruzamento

export const idadeDias = (lista) => (lista ? (Date.now() - Date.parse(lista.obtidoEm)) / 864e5 : null);
export const ehReferencia = (lista) => String(lista?.fonte || '').startsWith('pacote:');
// A referência do pacote é um retrato do seletor, não uma política viva: não vence, só é sinalizada.
export const vencida = (lista, cfg) => Boolean(lista) && !ehReferencia(lista) && idadeDias(lista) > cfg.modelos.validadeDias;
// Modelo que está na tabela como "semPreco" é liberado sem preço conhecido, de propósito.
export const semPrecoDeclarado = (id, tabela) => (tabela?.semPreco || []).some((x) => mesmoModelo(x, id));

// Uma linha por modelo que aparece na lista ou no consumo. Cada linha diz política, uso, preço e
// o que merece atenção. Severidade: crit (número errado ou política violada), warn, info.
export function cruzar({ lista, consumo: todo, tabela }) {
  const consumo = (todo || []).filter((c) => !ehFundo(c));
  const linhas = new Map();
  const chave = (id) => norm(id);
  for (const m of lista?.modelos || []) linhas.set(chave(m.id), { id: m.id, nome: m.nome, estado: m.estado, naLista: true, chamadas: 0, creditos: 0, tokens: 0, sessoes: new Set(), ultimoUso: null, nomesUsados: new Set() });
  for (const c of consumo || []) {
    const naLista = acharNaLista(c.modelo, lista);
    const k = naLista ? chave(naLista.id) : chave(c.modelo);
    if (!linhas.has(k)) linhas.set(k, { id: c.modelo, nome: c.modelo, estado: null, naLista: false, chamadas: 0, creditos: 0, tokens: 0, sessoes: new Set(), ultimoUso: null, nomesUsados: new Set() });
    const l = linhas.get(k);
    l.chamadas++;
    l.creditos += c.creditos || 0;
    l.tokens += (c.in || 0) + (c.out || 0);
    if (c.sessao) l.sessoes.add(c.sessao);
    if (!l.ultimoUso || c.t > l.ultimoUso) l.ultimoUso = c.t;
    l.nomesUsados.add(c.modelo);
  }
  const temLista = Boolean(lista);
  const out = [...linhas.values()].map((l) => {
    const preco = precoDe(l.id, tabela) || [...l.nomesUsados].map((n) => precoDe(n, tabela)).find(Boolean) || null;
    const usado = l.chamadas > 0;
    const lib = ESTADOS[l.estado]?.libera;
    const alertas = [];
    if (usado && !preco) alertas.push(semPrecoDeclarado(l.id, tabela) ? { sev: 'warn', txt: 'usado sem preço (a tela não mostra): o custo dele conta como zero' } : { sev: 'crit', txt: 'usado sem preço na tabela: o custo dele conta como zero' });
    if (temLista && usado && lib === false) alertas.push({ sev: 'crit', txt: 'usado, mas bloqueado na política (lista desatualizada ou acesso por time)' });
    if (temLista && usado && !l.naLista) alertas.push({ sev: 'warn', txt: 'usado, mas fora da lista de política' });
    if (lib === true && !preco) alertas.push(semPrecoDeclarado(l.id, tabela) ? { sev: 'info', txt: 'liberado sem preço: a tela não mostra preço para ele' } : { sev: 'warn', txt: 'liberado sem preço na tabela' });
    if (lib === true && !usado) alertas.push({ sev: 'info', txt: 'liberado, sem uso no período' });
    return { ...l, sessoes: l.sessoes.size, nomesUsados: [...l.nomesUsados], preco: preco ? preco.id : null, usado, libera: lib, alertas };
  });
  const ordem = (r) => (r.alertas.some((a) => a.sev === 'crit') ? 0 : r.alertas.some((a) => a.sev === 'warn') ? 1 : r.usado ? 2 : r.libera === true ? 3 : 4);
  return out.sort((a, b) => ordem(a) - ordem(b) || b.creditos - a.creditos || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------- model: dos agentes

// Lê "model:" do frontmatter dos agentes. Aceita string ou lista ("[a, b]" ou "- a").
export function modelosDosAgentes(dirs) {
  const out = [];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d).filter((x) => x.endsWith('.agent.md'))) {
      const t = readFileSync(join(d, n), 'utf8').replace(/\r\n/g, '\n');
      const fm = t.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      const linhas = fm[1].split('\n');
      const i = linhas.findIndex((l) => /^model\s*:/.test(l));
      if (i < 0) continue;
      let valor = linhas[i].replace(/^model\s*:\s*/, '').trim();
      let nomes;
      if (valor.startsWith('[')) nomes = valor.replace(/^\[|\]$/g, '').split(',');
      else if (!valor) { nomes = []; for (let j = i + 1; j < linhas.length && /^\s+-\s*/.test(linhas[j]); j++) nomes.push(linhas[j].replace(/^\s+-\s*/, '')); }
      else nomes = [valor];
      nomes = nomes.map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      if (nomes.length) out.push({ agente: n.replace(/\.agent\.md$/, ''), arquivo: join(d, n), modelos: nomes });
    }
  }
  return out;
}
