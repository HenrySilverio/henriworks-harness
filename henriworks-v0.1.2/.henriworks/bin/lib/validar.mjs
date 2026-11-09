// HenriWorks - validador dos portões mecânicos. Regra em markdown custa token toda vez que
// carrega; regra aqui custa zero. Julgamento continua nas etapas e nos revisores.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { HW, ler, linhasDe, lerFatias, tocaParaTeste, tocasSobrepoem, globParaRegex, lerJson } from './comum.mjs';

const SECOES_PROPOSTA = ['Intenção', 'Escopo', 'Restrições', 'Critérios de aceite'];

export function validarMudanca(dir, raiz = process.cwd()) {
  const achados = [];
  const erro = (f, m) => achados.push({ nivel: 'ERRO', arquivo: f, msg: m });
  const aviso = (f, m) => achados.push({ nivel: 'AVISO', arquivo: f, msg: m });
  validarProposta(dir, erro, aviso);
  validarFatias(dir, raiz, erro, aviso);
  validarDesign(dir, raiz, erro);
  validarDeltas(dir, raiz, erro, aviso);
  return achados;
}

function seccionar(txt) {
  const out = {};
  let atual = null;
  for (const l of linhasDe(txt)) {
    const m = l.match(/^##\s+(.+?)\s*$/);
    if (m) {
      atual = m[1].toLowerCase();
      out[atual] = '';
    } else if (atual !== null) out[atual] += `${l}\n`;
  }
  return out;
}

function validarProposta(dir, erro, aviso) {
  const file = join(dir, 'proposta.md');
  const txt = ler(file);
  if (txt === null) return erro(file, 'proposta.md não existe');
  const pre = txt.split(/^##\s+/m)[0];
  for (const campo of ['Ticket', 'Branch', 'Base', 'Rigor']) {
    if (!new RegExp(`^\\s*${campo}\\s*:\\s*\\S`, 'mi').test(pre)) erro(file, `metadado ausente antes da primeira seção: ${campo}`);
  }
  const rigor = (pre.match(/^\s*Rigor\s*:\s*(\S+)/im) || [])[1];
  if (rigor && !/^(lite|full)$/i.test(rigor)) erro(file, `Rigor "${rigor}" inválido. Use Lite ou Full`);
  for (const campo of ['In[ií]cio', 'Fim']) {
    const m = pre.match(new RegExp(`^\\s*${campo}\\s*:\\s*(\\S*)`, 'mi'));
    if (m && !/^[0-9a-f]{7,40}$/i.test(m[1])) erro(file, `${campo.replace('In[ií]cio', 'Início')} precisa ser hash de commit, de 7 a 40 caracteres: "${m[1]}"`);
  }
  const corpo = seccionar(txt);
  for (const s of SECOES_PROPOSTA) {
    const c = corpo[s.toLowerCase()];
    if (c === undefined) erro(file, `seção obrigatória ausente: ${s}`);
    else if (c.trim() === '') erro(file, `seção vazia: ${s}. Sem conteúdo, escreva "nenhuma"`);
  }
  if (corpo.escopo && !/fora/i.test(corpo.escopo)) aviso(file, 'Escopo não parece declarar o que está fora');
  if (/full/i.test(rigor || '') && !existsSync(join(dir, 'design.md'))) erro(file, 'Rigor Full exige design.md');
}

function validarFatias(dir, raiz, erro, aviso) {
  const pasta = join(dir, 'tarefas');
  if (!existsSync(pasta)) return erro(pasta, 'tarefas/ não existe. Uma fatia por arquivo: tarefas/01-<slug>.md');
  if (existsSync(join(dir, 'tarefas.md'))) erro(join(dir, 'tarefas.md'), 'tarefas.md único não existe no HenriWorks: use tarefas/NN-<slug>.md');
  const estranhos = readdirSync(pasta).filter((n) => n.endsWith('.md') && n !== 'index.md' && n !== 'sobreposicoes.md' && !/^\d{2}-[a-z0-9-]+\.md$/.test(n));
  for (const n of estranhos) erro(join(pasta, n), 'nome fora do padrão NN-<slug>.md, em kebab-case');
  const fatias = lerFatias(dir);
  if (fatias.length === 0) return erro(pasta, 'nenhuma fatia em tarefas/');

  const nums = fatias.map((f) => f.num);
  const ultima = fatias[fatias.length - 1];
  if (!ultima.verificacao) erro(ultima.arquivo, `a última fatia deve ser a Verificação, e é "${ultima.titulo}"`);
  fatias.filter((f) => f.verificacao && f !== ultima).forEach((f) => erro(f.arquivo, 'só a última fatia é de Verificação'));

  for (const f of fatias) {
    const ehV = f === ultima;
    if (f.itens.length === 0) erro(f.arquivo, 'fatia sem item de checklist');
    if (f.bloqueadoTxt === null) erro(f.arquivo, 'não declara "Bloqueado por:"');
    f.itens.forEach((it) => {
      if (it.marcadorX) erro(f.arquivo, `linha ${it.linha}: use x minúsculo em "[X]"`);
      if (!it.numero) erro(f.arquivo, `linha ${it.linha}: item sem número. Formato: "- [ ] ${Number(f.num)}.1 descrição"`);
      else if (it.numero.split('.')[0] !== String(Number(f.num))) erro(f.arquivo, `linha ${it.linha}: item ${it.numero} não pertence à fatia ${Number(f.num)}`);
      if (it.feito && it.manual && (!it.evidencia || it.evidencia.trim().length < 10)) {
        erro(f.arquivo, `linha ${it.linha}: tarefa manual marcada [x] sem "Evidência:" logo abaixo dizendo o quê, onde, quem e quando`);
      }
    });
    if (ehV) {
      if (f.demonstra !== null) erro(f.arquivo, 'a Verificação não leva "Demonstra:"');
      if (!f.todos) erro(f.arquivo, 'a Verificação declara "Bloqueado por: todos"');
      validarEscopo(f, fatias, raiz, erro, aviso);
      continue;
    }
    if (f.escopo !== null) erro(f.arquivo, '"Escopo:" só existe na fatia de Verificação');
    if (!f.demonstra) erro(f.arquivo, 'não declara "Demonstra:"');
    else if (/\b(está|estão|foi|foram|ficou|ficaram)\s+(pront|criad|implementad|feit)[oa]s?\b/i.test(f.demonstra)) {
      aviso(f.arquivo, `"Demonstra:" parece estado de camada, não comportamento: "${f.demonstra}"`);
    }
    if (!f.toca.length) erro(f.arquivo, 'não declara "Toca:" com as pastas ou arquivos que a fatia pode alterar');
    if (!/^##\s+Ponteiros/im.test(f.texto)) aviso(f.arquivo, 'sem "## Ponteiros": o executor recebe só este arquivo');
    if (f.todos) erro(f.arquivo, '"Bloqueado por: todos" é só da Verificação');
    for (const b of f.bloqueadoPor) {
      if (!nums.includes(b)) erro(f.arquivo, `bloqueada por ${b}, que não existe`);
      if (b === f.num) erro(f.arquivo, 'bloqueia a si mesma');
    }
  }
  if (fatias[0].bloqueadoPor.length || fatias[0].todos) erro(fatias[0].arquivo, 'a primeira fatia tem bloqueio: alguma precisa começar');

  const arestas = new Map(fatias.map((f) => [f.num, f.bloqueadoPor.filter((b) => nums.includes(b))]));
  const ciclo = acharCiclo(arestas);
  if (ciclo) erro(pasta, `ciclo em "Bloqueado por:": ${ciclo.join(' -> ')}`);

  // Sobreposição de Toca entre fatias sem caminho entre si: aviso, nunca erro. O plano decide:
  // criar aresta, juntar as fatias ou uma fatia de preparação. O coordenador nunca as roda juntas.
  const alcanca = (a, b, vistos = new Set()) => {
    for (const x of arestas.get(a) || []) {
      if (x === b) return true;
      if (!vistos.has(x)) {
        vistos.add(x);
        if (alcanca(x, b, vistos)) return true;
      }
    }
    return false;
  };
  const reais = fatias.filter((f) => !f.verificacao);
  for (let i = 0; i < reais.length; i++) {
    for (let j = i + 1; j < reais.length; j++) {
      const [a, b] = [reais[i], reais[j]];
      const s = tocasSobrepoem(a.toca, b.toca);
      if (s && !alcanca(a.num, b.num) && !alcanca(b.num, a.num)) {
        aviso(pasta, `fatias ${a.num} e ${b.num} sem aresta entre si e com Toca sobreposto (${s[0]} x ${s[1]}): rodam em sequência. Se a ordem importa, declare a aresta`);
      }
    }
  }
}

function validarEscopo(v, fatias, raiz, erro, aviso) {
  const cfgPath = join(raiz, HW, 'verificacao.json');
  if (!existsSync(cfgPath)) {
    if (v.escopo) aviso(v.arquivo, `"Escopo:" declarado, mas ${HW}/verificacao.json não existe`);
    return;
  }
  if (!v.escopo) return erro(v.arquivo, `a Verificação não declara "Escopo:" com camadas de ${HW}/verificacao.json`);
  const cfg = lerJson(cfgPath);
  if (!cfg) return erro(cfgPath, 'não é JSON válido');
  const camadas = cfg.camadas || {};
  const escopo = v.escopo.split(/[,;\s]+/).filter(Boolean);
  for (const c of escopo) if (!camadas[c]) erro(v.arquivo, `Escopo cita a camada "${c}", que não existe em verificacao.json`);
  if (!/verificar\.mjs/.test(v.texto)) aviso(v.arquivo, 'a Verificação não roda node .henriworks/bin/verificar.mjs');
  // Toca de cada fatia precisa caber no Escopo: aproximação por prefixo dos globs da camada.
  const globs = escopo.flatMap((c) => camadas[c]?.arquivos || []).map((g) => ({ g, re: globParaRegex(g), base: g.replace(/[*?].*$/, '') }));
  if (!globs.length) return;
  for (const f of fatias) {
    if (f.verificacao) continue;
    for (const t of f.toca) {
      const amostra = t.endsWith('/') ? `${t}arquivo.ts` : t.replace(/[*?].*$/, 'arquivo.ts');
      const coberto = globs.some(({ re, base }) => re.test(amostra) || t.startsWith(base) || base.startsWith(t.replace(/[*?].*$/, '')));
      if (!coberto) aviso(f.arquivo, `Toca "${t}" não parece caber no Escopo da Verificação (${escopo.join(', ')})`);
    }
  }
}

function acharCiclo(arestas) {
  const cor = new Map([...arestas.keys()].map((k) => [k, 0]));
  const pilha = [];
  let achado = null;
  const visitar = (n) => {
    if (achado) return;
    cor.set(n, 1);
    pilha.push(n);
    for (const m of arestas.get(n) || []) {
      if (cor.get(m) === 1) {
        achado = [...pilha.slice(pilha.indexOf(m)), m];
        return;
      }
      if (cor.get(m) === 0) visitar(m);
      if (achado) return;
    }
    pilha.pop();
    cor.set(n, 2);
  };
  for (const n of arestas.keys()) if (cor.get(n) === 0) visitar(n);
  return achado;
}

function validarDesign(dir, raiz, erro) {
  const file = join(dir, 'design.md');
  const txt = ler(file);
  if (txt === null) return;
  for (const t of ['Abordagem', 'Decisões', 'Arquivos afetados']) {
    if (!new RegExp(`^##\\s+${t}\\s*$`, 'mi').test(txt)) erro(file, `seção obrigatória ausente: ## ${t}`);
  }
  const decisoes = [];
  let atual = null;
  let em = false;
  linhasDe(txt).forEach((l, i) => {
    const h2 = l.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      em = /^decis/i.test(h2[1]);
      atual = null;
      return;
    }
    const d = l.match(/^###\s+(.+?)\s*$/);
    if (d) {
      atual = em ? { titulo: d[1], linha: i + 1, durabilidade: null, substitui: null, capacidades: null } : null;
      if (atual) decisoes.push(atual);
      return;
    }
    if (!atual) return;
    const du = l.match(/^\s*Durabilidade\s*:\s*(\S+)/i);
    if (du) atual.durabilidade = du[1].toLowerCase().replace(/[.,]$/, '');
    const su = l.match(/^\s*Substitui\s*:\s*(DEC-\d{3})/i);
    if (su) atual.substitui = su[1].toUpperCase();
    const ca = l.match(/^\s*Capacidades\s*:\s*(.*)$/i);
    if (ca) atual.capacidades = ca[1].trim();
  });
  if (!decisoes.length) return erro(file, 'nenhuma decisão sob "## Decisões", cada uma em "### Título"');
  const idx = ler(join(raiz, HW, 'decisoes', 'index.md')) || '';
  const vigentes = new Set([...idx.matchAll(/\bDEC-(\d{3})\b/g)].map((m) => `DEC-${m[1]}`));
  for (const d of decisoes) {
    if (!d.durabilidade) erro(file, `decisão "${d.titulo}" (linha ${d.linha}) não declara Durabilidade`);
    else if (!['local', 'permanente'].includes(d.durabilidade)) erro(file, `decisão "${d.titulo}": Durabilidade "${d.durabilidade}" inválida`);
    if (d.durabilidade === 'permanente' && !d.capacidades) erro(file, `decisão "${d.titulo}" é permanente e não declara Capacidades`);
    if (d.substitui) {
      if (d.durabilidade !== 'permanente') erro(file, `decisão "${d.titulo}" declara Substitui mas não é permanente`);
      if (!vigentes.has(d.substitui)) erro(file, `decisão "${d.titulo}": Substitui ${d.substitui}, que não existe em decisoes/index.md`);
    }
  }
}

function validarDeltas(dir, raiz, erro, aviso) {
  const file = join(dir, 'deltas.md');
  const txt = ler(file);
  if (txt === null) return;
  const ops = [...txt.matchAll(/^\s*[-|]?\s*Opera(?:ç|c)(?:ã|a)o\s*[:|]\s*(\w+)/gim)].map((m) => m[1].toUpperCase());
  const alvos = [...txt.matchAll(/^\s*[-|]?\s*Alvo\s*[:|]\s*(\S+)/gim)].map((m) => m[1]);
  const caps = [...txt.matchAll(/^\s*[-|]?\s*Capacidade\s*[:|]\s*(\S+)/gim)].map((m) => m[1]);
  if (!ops.length) return erro(file, 'deltas.md sem nenhuma entrada com Operação');
  if (ops.length !== alvos.length || ops.length !== caps.length) {
    return erro(file, `${ops.length} Operação, ${caps.length} Capacidade, ${alvos.length} Alvo: cada entrada precisa dos três`);
  }
  const specs = join(raiz, HW, 'specs');
  const reqPorCap = new Map();
  if (existsSync(specs)) {
    for (const cap of readdirSync(specs)) {
      const t = ler(join(specs, cap, 'spec.md'));
      reqPorCap.set(cap, new Set(t ? [...t.matchAll(/\bREQ-[\w-]+-\d{3}\b/g)].map((m) => m[0]) : []));
    }
  }
  ops.forEach((op, i) => {
    const [alvo, cap] = [alvos[i], caps[i]];
    if (!['ADICIONAR', 'SUBSTITUIR', 'REMOVER'].includes(op)) return erro(file, `operação inválida: ${op}`);
    if (op === 'ADICIONAR') {
      if (!/^novo$/i.test(alvo)) erro(file, `ADICIONAR deve ter Alvo "novo", e tem "${alvo}"`);
      return;
    }
    if (!/^REQ-/.test(alvo)) return erro(file, `${op} precisa apontar para um REQ-..., e aponta para "${alvo}"`);
    if (!reqPorCap.has(cap)) return erro(file, `${op} ${alvo}: capacidade "${cap}" não existe. Só ADICIONAR cria capacidade`);
    if (!reqPorCap.get(cap).has(alvo)) erro(file, `${op} aponta para ${alvo}, que não existe em "${cap}"`);
  });
  if (/\b(ajustar|atualizar|melhorar) o (requisito|texto)\b/i.test(txt)) aviso(file, 'algum Texto parece descrever a intenção em vez de trazer o texto final');
}

export function imprimir(id, achados) {
  const erros = achados.filter((a) => a.nivel === 'ERRO').length;
  const avisos = achados.length - erros;
  console.log(`\n${id}: ${erros ? `${erros} erro(s)` : 'ok'}${avisos ? `, ${avisos} aviso(s)` : ''}`);
  for (const a of achados) console.log(`  ${a.nivel.padEnd(5)} ${basename(a.arquivo).padEnd(28)} ${a.msg}`);
  return erros;
}

export { readFileSync };
