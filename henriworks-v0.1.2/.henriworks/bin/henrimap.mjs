#!/usr/bin/env node
// henrimap - mapa do projeto para o HenriWorks. Arquivo único de entrada, sem dependência nova, Node 20+.
//
//   node .henriworks/bin/henrimap.mjs <comando> [args] [--budget N]
//
//   build                     gera o grafo inteiro (ou consome graphify-out/graph.json, se existir)
//   atualizar [arquivos...]   reextrai só o que mudou (hash do Git); com arquivos, só eles
//   resumo                    o que existe, por pasta, dentro do orçamento de caracteres
//   explain <termo>           onde está, o que usa, quem usa
//   path <A> <B>              caminho mais curto entre dois nós
//   affected <arquivos...>    raio de impacto: quem depende do que mudou
//   query "<texto>"           nós que casam com o texto e seus vizinhos
//   status                    cobertura, idade e origem do grafo
//   git-hooks                 instala post-checkout, post-merge e post-commit locais (.git/hooks)
//
// Camadas de precisão, todas sem instalar nada:
//   L1  regex por linguagem (TS/JS, Java, Kotlin, C#, Python, Go). Sempre.
//   L2  API do compilador TypeScript carregada do node_modules do projeto (paths do tsconfig,
//       re-exports, herança, chamadas, DI); jdeps do JDK sobre as classes compiladas.
//   L3  rotas lazy do Angular, remotes do Native Federation, endpoints Spring e OpenAPI,
//       chamadas HTTP do front. Marcado INFERRED.
// Padrão que nenhuma análise estática resolve vira marca "ambiguo" no arquivo.
//
// O grafo segue o formato do Graphify (nodes/links, EXTRACTED/INFERRED). O modelo nunca lê o
// graph.json: lê a saída de uma consulta, cortada no orçamento.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync, chmodSync, renameSync, rmSync } from 'node:fs';
import { join, dirname, extname, relative, resolve, posix } from 'node:path';

const RAIZ = process.cwd();
const DIR = join(RAIZ, '.henriworks', 'mapa');
const CACHE = join(DIR, 'cache.json');
const GRAFO = join(DIR, 'graph.json');
const GRAPHIFY = join(RAIZ, 'graphify-out', 'graph.json');
const VERSAO_CACHE = 3;

// Hooks podem disparar duas atualizações ao mesmo tempo: grava em temporário e renomeia, para
// nenhum leitor ver JSON pela metade. Se o rename falhar (Windows com o arquivo aberto), grava direto.
function gravarAtomico(p, conteudo) {
  const tmp = `${p}.${process.pid}.tmp`;
  writeFileSync(tmp, conteudo);
  try { renameSync(tmp, p); } catch { writeFileSync(p, conteudo); rmSync(tmp, { force: true }); }
}

const EXT = { '.ts': 'ts', '.tsx': 'ts', '.mts': 'ts', '.js': 'js', '.jsx': 'js', '.mjs': 'js', '.cjs': 'js', '.java': 'java', '.kt': 'kt', '.cs': 'cs', '.py': 'py', '.go': 'go', '.yaml': 'oas', '.yml': 'oas', '.json': 'oas' };
const PULAR = /(^|\/)(node_modules|\.git|dist|build|out|target|coverage|\.angular|\.next|vendor|venv|\.venv|__pycache__|\.henriworks|graphify-out|\.sdd|bin|obj)(\/|$)/;
const TESTE = /(\.spec|\.test|_test|Test|Tests|IT)\.[a-z]+$|(^|\/)(test|tests|__tests__|spec)\//;
const AFETA = new Set(['imports', 'calls', 'uses', 'extends', 'implements', 're_exports', 'dynamic_import', 'lazy_loads', 'calls_http', 'exposes', 'loads_remote']);

const barra = (p) => String(p).replace(/\\/g, '/');
const idDe = (s) => String(s).replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const lerJson = (p, d) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return d; } };
const gitOut = (args) => { const r = spawnSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };

function opcoes(argv) {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--budget') op.budget = Number(argv[++i]) || 2000;
    else if (argv[i].startsWith('--')) op[argv[i].slice(2)] = true;
    else pos.push(argv[i]);
  }
  return { pos, op };
}

// ------------------------------------------------------------ arquivos e hash

function arquivosAtuais() {
  const out = new Map();
  const ls = gitOut(['ls-files', '-s']);
  if (ls === null) {
    // fora de Git: caminhada simples, hash por tamanho e data
    const andar = (d) => {
      for (const e of readdirSync(join(RAIZ, d), { withFileTypes: true })) {
        const p = barra(posix.join(d, e.name)).replace(/^\.\//, '');
        if (PULAR.test(p)) continue;
        if (e.isDirectory()) andar(p);
        else if (EXT[extname(p).toLowerCase()]) { const s = statSync(join(RAIZ, p)); out.set(p, `${s.size}-${s.mtimeMs}`); }
      }
    };
    andar('.');
    return out;
  }
  for (const l of ls.split('\n')) {
    const m = l.match(/^\d+ ([0-9a-f]{40}) \d+\t(.+)$/);
    if (m && aceita(m[2])) out.set(m[2], m[1]);
  }
  const st = gitOut(['status', '--porcelain', '--untracked-files=all']) || '';
  const mudados = [];
  for (const l of st.split('\n').filter(Boolean)) {
    const p = barra(l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop());
    if (l.startsWith(' D') || l.startsWith('D ')) { out.delete(p); continue; }
    if (aceita(p) && existsSync(join(RAIZ, p))) mudados.push(p);
  }
  if (mudados.length) {
    const r = spawnSync('git', ['hash-object', '--stdin-paths'], { cwd: RAIZ, input: mudados.join('\n'), encoding: 'utf8' });
    const hs = (r.stdout || '').trim().split('\n');
    mudados.forEach((p, i) => out.set(p, hs[i] || `?${Date.now()}`));
  }
  return out;
}

function aceita(p) {
  if (PULAR.test(p)) return false;
  const e = EXT[extname(p).toLowerCase()];
  if (!e) return false;
  if (e === 'oas') return /(openapi|swagger|api-?spec)/i.test(p);
  return true;
}

// ----------------------------------------------------------------- L2 TS

let TS = null;
let TS_OPCOES = null;
function carregarTs() {
  if (TS !== null) return TS;
  TS = false;
  try {
    const req = createRequire(join(RAIZ, 'package.json'));
    TS = req('typescript');
    const cand = ['tsconfig.json', 'tsconfig.base.json', 'tsconfig.app.json'].map((n) => join(RAIZ, n)).find(existsSync);
    if (cand) {
      const lido = TS.readConfigFile(cand, TS.sys.readFile);
      TS_OPCOES = TS.parseJsonConfigFileContent(lido.config || {}, TS.sys, dirname(cand)).options;
    } else TS_OPCOES = { allowJs: true };
  } catch {
    TS = false;
  }
  return TS;
}

function resolverTs(spec, de) {
  if (TS && TS_OPCOES) {
    const r = TS.resolveModuleName(spec, join(RAIZ, de), TS_OPCOES, TS.sys).resolvedModule;
    if (r && !/node_modules/.test(r.resolvedFileName)) {
      const rel = barra(relative(RAIZ, r.resolvedFileName));
      if (!rel.startsWith('..')) return rel.replace(/\.d\.ts$/, '.ts');
    }
    if (r) return null;
  }
  if (!spec.startsWith('.')) return null;
  const base = posix.join(posix.dirname(de), spec);
  for (const suf of ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.js']) if (existsSync(join(RAIZ, base + suf)) && statSync(join(RAIZ, base + suf)).isFile()) return barra(base + suf);
  return null;
}

function extrairTs(p, txt) {
  const fid = idDe(p);
  const nodes = [{ id: fid, label: p.split('/').pop(), file_type: 'code', source_file: p, kind: 'arquivo' }];
  const refs = [];
  const importados = new Map();
  const ts = carregarTs();
  if (ts) {
    const sf = ts.createSourceFile(p, txt, ts.ScriptTarget.Latest, true, /x$/.test(p) ? ts.ScriptKind.TSX : undefined);
    const linha = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    const simbolo = (nome, kind, n) => {
      const id = `${fid}_${nome.toLowerCase()}`;
      if (!nodes.some((x) => x.id === id)) nodes.push({ id, label: nome, file_type: 'code', source_file: p, source_location: `L${linha(n)}`, kind });
      refs.push({ de: fid, para: id, rel: 'contains', local: true });
      return id;
    };
    const tipoNome = (t) => (t && ts.isTypeReferenceNode(t) ? t.typeName.getText(sf) : null);
    let atual = fid;
    const visitar = (n) => {
      if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
        const mod = n.moduleSpecifier.text;
        refs.push({ de: fid, mod, rel: 'imports' });
        const b = n.importClause?.namedBindings;
        if (b && ts.isNamedImports(b)) for (const e of b.elements) importados.set(e.name.text, { mod, nome: (e.propertyName || e.name).text });
        if (n.importClause?.name) importados.set(n.importClause.name.text, { mod, nome: 'default' });
      } else if (ts.isExportDeclaration(n) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
        refs.push({ de: fid, mod: n.moduleSpecifier.text, rel: 're_exports' });
      } else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
        refs.push({ de: atual, mod: n.arguments[0].text, rel: 'dynamic_import' });
      }
      const decl = (ts.isClassDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isEnumDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name && n.parent === sf;
      if (decl) {
        const kind = ts.isClassDeclaration(n) ? 'classe' : ts.isFunctionDeclaration(n) ? 'funcao' : ts.isInterfaceDeclaration(n) ? 'interface' : 'tipo';
        const id = simbolo(n.name.text, kind, n);
        for (const h of n.heritageClauses || []) {
          const rel = h.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';
          for (const t of h.types) refs.push({ de: id, nome: t.expression.getText(sf), rel });
        }
        const antes = atual;
        atual = id;
        ts.forEachChild(n, visitar);
        atual = antes;
        return;
      }
      if (ts.isVariableStatement(n) && n.parent === sf && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        for (const d of n.declarationList.declarations) if (ts.isIdentifier(d.name)) simbolo(d.name.text, 'const', d);
      }
      if (ts.isConstructorDeclaration(n)) for (const prm of n.parameters) { const t = tipoNome(prm.type); if (t) refs.push({ de: atual, nome: t, rel: 'uses' }); }
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const nome = n.expression.text;
        if (nome === 'inject' && n.arguments[0]) {
          const a = n.arguments[0];
          if (ts.isIdentifier(a)) refs.push({ de: atual, nome: a.text, rel: 'uses' });
          else nodes[0].ambiguo = [...new Set([...(nodes[0].ambiguo || []), 'inject com token não tipado'])];
        } else if (importados.has(nome)) refs.push({ de: atual, nome, rel: 'calls' });
      }
      if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && importados.has(n.expression.text)) refs.push({ de: atual, nome: n.expression.text, rel: 'uses' });
      ts.forEachChild(n, visitar);
    };
    visitar(sf);
  } else {
    // L1: regex
    for (const m of txt.matchAll(/^\s*import\s+(?:type\s+)?(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?[^'"\n]*?from\s*['"]([^'"]+)['"]/gm)) {
      refs.push({ de: fid, mod: m[3], rel: 'imports' });
      for (const n of (m[2] || '').split(',').map((s) => s.trim().split(/\s+as\s+/)).filter((x) => x[0])) importados.set((n[1] || n[0]).trim(), { mod: m[3], nome: n[0].trim() });
    }
    for (const m of txt.matchAll(/^\s*export\s+\*?\s*(?:\{[^}]*\})?\s*from\s*['"]([^'"]+)['"]/gm)) refs.push({ de: fid, mod: m[1], rel: 're_exports' });
    for (const m of txt.matchAll(/^export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(class|function|interface|enum|type|const)\s+([\w$]+)([^{=\n]*)/gm)) {
      const id = `${fid}_${m[2].toLowerCase()}`;
      nodes.push({ id, label: m[2], file_type: 'code', source_file: p, source_location: `L${txt.slice(0, m.index).split('\n').length}`, kind: m[1] });
      refs.push({ de: fid, para: id, rel: 'contains', local: true });
      const ext = m[3].match(/extends\s+([\w$.]+)/);
      if (ext) refs.push({ de: id, nome: ext[1], rel: 'extends' });
      const imp = m[3].match(/implements\s+([\w$.,\s]+)/);
      if (imp) for (const n of imp[1].split(',').map((s) => s.trim()).filter(Boolean)) refs.push({ de: id, nome: n, rel: 'implements' });
    }
    for (const m of txt.matchAll(/\binject\(\s*([\w$]+)\s*\)/g)) refs.push({ de: fid, nome: m[1], rel: 'uses' });
    for (const m of txt.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) refs.push({ de: fid, mod: m[1], rel: 'dynamic_import' });
  }
  // L3 front: rotas lazy, remotes, HTTP
  for (const m of txt.matchAll(/load(?:Component|Children)\s*:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)) refs.push({ de: fid, mod: m[1], rel: 'lazy_loads', inferido: true });
  for (const m of txt.matchAll(/loadRemoteModule\(\s*(?:\{[^}]*remoteName\s*:\s*['"]([^'"]+)['"][^}]*exposedModule\s*:\s*['"]([^'"]+)['"]|['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"])/g)) {
    const nome = `${m[1] || m[3]}/${(m[2] || m[4]).replace(/^\.\//, '')}`;
    const rid = `remote_${idDe(nome)}`;
    nodes.push({ id: rid, label: `remote ${nome}`, file_type: 'remote', source_file: p });
    refs.push({ de: fid, para: rid, rel: 'loads_remote', local: true, inferido: true });
  }
  for (const m of txt.matchAll(/\.(get|post|put|delete|patch)\s*(?:<[^()]*?>)?\s*\(\s*[`'"]([^`'"]*\/[^`'"]*)[`'"]/gi)) {
    const ep = endpointId(m[1], m[2]);
    if (ep) {
      nodes.push({ id: ep.id, label: ep.label, file_type: 'endpoint' });
      refs.push({ de: fid, para: ep.id, rel: 'calls_http', local: true, inferido: true });
    }
  }
  const amb = [];
  if (/new\s+InjectionToken|inject\(\s*['"]/.test(txt)) amb.push('token de DI por string');
  if (/\bwindow\s*\[|\beval\s*\(|\[\s*[`'"][\w-]+[`'"]\s*\]\s*\(/.test(txt)) amb.push('chamada dinâmica');
  if (amb.length) nodes[0].ambiguo = [...new Set([...(nodes[0].ambiguo || []), ...amb])];
  return { nodes, refs, importados: Object.fromEntries(importados) };
}

function endpointId(metodo, caminho) {
  let c = caminho.replace(/\$\{[^}]*\}/g, (x, off) => (off === 0 ? '' : '{}')).replace(/:[A-Za-z_]\w*/g, '{}').replace(/\{[^}]*\}/g, '{}');
  const i = c.indexOf('/');
  if (i < 0) return null;
  c = c.slice(i).split('?')[0].replace(/\/+$/, '') || '/';
  if (!/^\/[\w{}\-./]*$/.test(c)) return null;
  const label = `${metodo.toUpperCase()} ${c}`;
  return { id: `endpoint_${idDe(label)}`, label };
}

// ------------------------------------------------------------------ Java (L1 + L3)

function extrairJava(p, txt) {
  const fid = idDe(p);
  const pkg = (txt.match(/^\s*package\s+([\w.]+)\s*;/m) || [])[1] || '';
  const nodes = [{ id: fid, label: p.split('/').pop(), file_type: 'code', source_file: p, kind: 'arquivo', pacote: pkg }];
  const refs = [];
  const imports = new Map();
  for (const m of txt.matchAll(/^\s*import\s+(?:static\s+)?([\w.]+)(\.\*)?\s*;/gm)) {
    refs.push({ de: fid, fqn: m[1], rel: 'imports' });
    if (!m[2]) imports.set(m[1].split('.').pop(), m[1]);
  }
  let base = '';
  const classe = txt.match(/@RequestMapping\(\s*(?:value\s*=\s*|path\s*=\s*)?"([^"]*)"/);
  for (const m of txt.matchAll(/^(?:\s*@[\w.]+(?:\([^)]*\))?\s*)*\s*(?:public\s+|protected\s+|private\s+)?(?:abstract\s+|final\s+|static\s+|sealed\s+)*(class|interface|enum|record)\s+(\w+)([^{]*)\{/gm)) {
    const id = `${fid}_${m[2].toLowerCase()}`;
    nodes.push({ id, label: m[2], file_type: 'code', source_file: p, source_location: `L${txt.slice(0, m.index).split('\n').length}`, kind: m[1], fqn: pkg ? `${pkg}.${m[2]}` : m[2] });
    refs.push({ de: fid, para: id, rel: 'contains', local: true });
    const ext = m[3].match(/extends\s+([\w.]+)/);
    if (ext) refs.push({ de: id, nome: ext[1], rel: 'extends' });
    const imp = m[3].match(/implements\s+([\w.,\s<>]+)/);
    if (imp) for (const n of imp[1].replace(/<[^>]*>/g, '').split(',').map((s) => s.trim()).filter(Boolean)) refs.push({ de: id, nome: n, rel: 'implements' });
    if (!base && classe) base = classe[1];
  }
  const dono = nodes[1]?.id || fid;
  // DI: campos @Autowired e parâmetros de construtor com tipo da própria base de código
  for (const m of txt.matchAll(/@Autowired[\s\S]{0,80}?\b(?:private|protected|public)?\s*(?:final\s+)?([A-Z]\w+)(?:<[^>]*>)?\s+\w+\s*;/g)) refs.push({ de: dono, nome: m[1], rel: 'uses' });
  for (const m of txt.matchAll(/(?:public|protected)\s+[A-Z]\w+\s*\(([^)]*)\)\s*\{/g)) for (const t of m[1].matchAll(/(?:final\s+)?([A-Z]\w+)(?:<[^>]*>)?\s+\w+/g)) refs.push({ de: dono, nome: t[1], rel: 'uses' });
  // L3: endpoints Spring e Feign
  if (/@(Rest)?Controller\b/.test(txt)) {
    for (const m of txt.matchAll(/@(Get|Post|Put|Delete|Patch)Mapping(?:\(\s*(?:value\s*=\s*|path\s*=\s*)?"([^"]*)")?/g)) {
      const ep = endpointId(m[1], `${base}${m[2] || ''}` || '/');
      if (ep) { nodes.push({ id: ep.id, label: ep.label, file_type: 'endpoint' }); refs.push({ de: dono, para: ep.id, rel: 'exposes', local: true, inferido: true }); }
    }
  }
  if (/@FeignClient/.test(txt)) {
    for (const m of txt.matchAll(/@(Get|Post|Put|Delete|Patch)Mapping\(\s*(?:value\s*=\s*|path\s*=\s*)?"([^"]*)"/g)) {
      const ep = endpointId(m[1], m[2]);
      if (ep) { nodes.push({ id: ep.id, label: ep.label, file_type: 'endpoint' }); refs.push({ de: dono, para: ep.id, rel: 'calls_http', local: true, inferido: true }); }
    }
  }
  const amb = [];
  if (/Class\.forName|getBean\(|\.invoke\(/.test(txt)) amb.push('reflexão');
  if (/@Qualifier\(|@EventListener|ApplicationEventPublisher/.test(txt)) amb.push('ligação por nome ou evento');
  if (amb.length) nodes[0].ambiguo = amb;
  return { nodes, refs, importados: Object.fromEntries(imports) };
}

// ------------------------------------------------------------- outras linguagens (L1)

function extrairGenerico(p, txt, lang) {
  const fid = idDe(p);
  const nodes = [{ id: fid, label: p.split('/').pop(), file_type: 'code', source_file: p, kind: 'arquivo' }];
  const refs = [];
  const decl = {
    kt: [/^\s*(?:(?:public|internal|open|abstract|data|sealed)\s+)*(class|interface|object|fun)\s+(\w+)/gm, /^\s*import\s+([\w.]+)/gm],
    cs: [/^\s*(?:(?:public|internal|sealed|abstract|static|partial)\s+)*(class|interface|record|enum)\s+(\w+)/gm, /^\s*using\s+([\w.]+)\s*;/gm],
    py: [/^(class|def)\s+([A-Za-z]\w*)/gm, /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm],
    go: [/^(func|type)\s+(?:\([^)]*\)\s*)?([A-Z]\w*)/gm, /^\s*"([\w./-]+)"\s*$/gm],
  }[lang];
  for (const m of txt.matchAll(decl[0])) {
    const id = `${fid}_${m[2].toLowerCase()}`;
    nodes.push({ id, label: m[2], file_type: 'code', source_file: p, source_location: `L${txt.slice(0, m.index).split('\n').length}`, kind: m[1] });
    refs.push({ de: fid, para: id, rel: 'contains', local: true });
  }
  for (const m of txt.matchAll(decl[1])) refs.push({ de: fid, fqn: m[1] || m[2], rel: 'imports' });
  return { nodes, refs, importados: {} };
}

function extrairOpenApi(p, txt) {
  if (!/^\s*["']?(openapi|swagger)["']?\s*:/m.test(txt)) return { nodes: [], refs: [], importados: {} };
  const fid = idDe(p);
  const nodes = [{ id: fid, label: p.split('/').pop(), file_type: 'contract', source_file: p, kind: 'openapi' }];
  const refs = [];
  let caminho = null;
  for (const l of txt.split('\n')) {
    const pm = l.match(/^\s{2}["']?(\/[^"':]*)["']?\s*:\s*$/);
    if (pm) { caminho = pm[1]; continue; }
    const mm = caminho && l.match(/^\s{4}["']?(get|post|put|delete|patch)["']?\s*:/i);
    if (mm) {
      const ep = endpointId(mm[1], caminho);
      if (ep) { nodes.push({ id: ep.id, label: ep.label, file_type: 'endpoint' }); refs.push({ de: fid, para: ep.id, rel: 'declares', local: true }); }
    }
  }
  return { nodes, refs, importados: {} };
}

function extrair(p) {
  const txt = readFileSync(join(RAIZ, p), 'utf8');
  const lang = EXT[extname(p).toLowerCase()];
  if (lang === 'ts' || lang === 'js') return extrairTs(p, txt);
  if (lang === 'java') return extrairJava(p, txt);
  if (lang === 'oas') return extrairOpenApi(p, txt);
  return extrairGenerico(p, txt, lang);
}

// ----------------------------------------------------------- jdeps (L2 Java)

function pastasDeClasses() {
  const out = [];
  const andar = (d, prof) => {
    if (prof > 3) return;
    for (const e of readdirSync(join(RAIZ, d), { withFileTypes: true })) {
      if (!e.isDirectory() || /^(node_modules|\.git|src|\.henriworks)$/.test(e.name)) continue;
      const p = d ? `${d}/${e.name}` : e.name;
      if (/(^|\/)target\/classes$|(^|\/)build\/classes\/java\/main$/.test(p)) out.push(p);
      else andar(p, prof + 1);
    }
  };
  andar('', 0);
  return out;
}

function jdeps(cache) {
  const pastas = pastasDeClasses();
  if (!pastas.length) return { ativo: false, motivo: 'sem classes compiladas (target/classes)' };
  const assinatura = pastas.map((p) => `${p}:${statSync(join(RAIZ, p)).mtimeMs}`).join('|');
  if (cache.jdeps?.assinatura === assinatura) return cache.jdeps;
  const r = spawnSync('jdeps', ['-verbose:class', '-filter:none', ...pastas], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 27 });
  if (r.error || r.status !== 0) return { ativo: false, motivo: 'jdeps indisponível no PATH' };
  const pares = [];
  for (const l of r.stdout.split('\n')) {
    const m = l.match(/^\s+([\w.$]+)\s+->\s+([\w.$]+)/);
    if (m && !m[1].includes('$') && !m[2].includes('$') && m[1] !== m[2]) pares.push([m[1], m[2]]);
  }
  return { ativo: true, assinatura, pares };
}

// ---------------------------------------------------------------- montagem

function montar(cache) {
  const nodes = new Map();
  const links = [];
  const vistos = new Set();
  const porLabel = new Map();
  const porFqn = new Map();
  const arquivoPorCaminho = new Map();
  for (const [p, e] of Object.entries(cache.arquivos)) {
    arquivoPorCaminho.set(p, idDe(p));
    for (const n of e.nodes) {
      if (!nodes.has(n.id)) nodes.set(n.id, n);
      if (n.kind && n.kind !== 'arquivo') {
        if (!porLabel.has(n.label)) porLabel.set(n.label, []);
        porLabel.get(n.label).push(n.id);
      }
      if (n.fqn) porFqn.set(n.fqn, n.id);
    }
  }
  const ligar = (s, t, rel, conf, origem) => {
    if (!s || !t || s === t || !nodes.has(s) || !nodes.has(t)) return;
    const k = `${s}|${t}|${rel}`;
    if (vistos.has(k)) return;
    vistos.add(k);
    links.push({ source: s, target: t, relation: rel, confidence: conf, _origin: origem });
  };
  for (const [p, e] of Object.entries(cache.arquivos)) {
    const origem = e.l2 ? 'henrimap-l2' : 'henrimap';
    for (const r of e.refs) {
      const conf = r.inferido ? 'INFERRED' : 'EXTRACTED';
      if (r.local) { ligar(r.de, r.para, r.rel, conf, r.rel === 'contains' ? 'henrimap' : 'henrimap-l3'); continue; }
      if (r.mod !== undefined) {
        const alvo = e.resolvidos?.[r.mod];
        if (alvo && arquivoPorCaminho.has(alvo)) ligar(r.de, arquivoPorCaminho.get(alvo), r.rel, conf, r.rel === 'lazy_loads' ? 'henrimap-l3' : origem);
        continue;
      }
      if (r.fqn !== undefined) {
        const alvo = porFqn.get(r.fqn);
        if (alvo) ligar(r.de, alvo, r.rel, 'EXTRACTED', origem);
        continue;
      }
      if (r.nome) {
        const nome = r.nome.split('.').pop();
        const imp = e.importados?.[nome];
        let alvo = null;
        if (imp) {
          const arq = imp.mod !== undefined ? e.resolvidos?.[imp.mod] : null;
          if (arq) alvo = `${idDe(arq)}_${(imp.nome === 'default' ? nome : imp.nome).toLowerCase()}`;
          else if (typeof imp === 'string') alvo = porFqn.get(imp);
          if (alvo && !nodes.has(alvo) && arq) alvo = idDe(arq);
        }
        const local = `${idDe(p)}_${nome.toLowerCase()}`;
        if (!alvo && nodes.has(local)) alvo = local;
        // Java: mesmo pacote dispensa import.
        const pacote = nodes.get(idDe(p))?.pacote;
        if (!alvo && pacote && porFqn.has(`${pacote}.${nome}`)) alvo = porFqn.get(`${pacote}.${nome}`);
        if (alvo) ligar(r.de, alvo, r.rel, 'EXTRACTED', origem);
        else if (porLabel.get(nome)?.length === 1) ligar(r.de, porLabel.get(nome)[0], r.rel, 'INFERRED', origem);
      }
    }
  }
  if (cache.jdeps?.ativo) for (const [a, b] of cache.jdeps.pares) ligar(porFqn.get(a), porFqn.get(b), 'uses', 'EXTRACTED', 'jdeps');
  // Chamada HTTP do front com prefixo em variável ("${base}/acordos/..."): liga ao endpoint
  // declarado cujo caminho termina igual, com o mesmo método. Sempre INFERRED.
  const endpoints = [...nodes.values()].filter((n) => n.file_type === 'endpoint');
  for (const l of links.filter((x) => x.relation === 'calls_http')) {
    const ep = nodes.get(l.target);
    const [met, cam] = String(ep?.label || '').split(' ');
    for (const outro of endpoints) {
      const [m2, c2] = outro.label.split(' ');
      if (outro.id !== ep.id && m2 === met && c2.length > cam.length && c2.endsWith(cam)) ligar(l.source, outro.id, 'calls_http', 'INFERRED', 'henrimap-l3');
    }
  }
  return { nodes: [...nodes.values()], links };
}

// ---------------------------------------------------------------- build/update

function carregarGrafo() {
  if (existsSync(GRAPHIFY)) {
    const g = lerJson(GRAPHIFY, { nodes: [], links: [] });
    return { nodes: g.nodes || [], links: g.links || g.edges || [], origem: 'graphify', meta: g.graph || {} };
  }
  const g = lerJson(GRAFO, null);
  return g ? { nodes: g.nodes, links: g.links, origem: 'henrimap', meta: g.graph } : null;
}

function atualizar(somente = null, { forcar = false, silencioso = true } = {}) {
  if (existsSync(GRAPHIFY)) return { origem: 'graphify', mudou: 0 };
  let cache = lerJson(CACHE, null);
  if (!cache || cache.versao !== VERSAO_CACHE || forcar) cache = { versao: VERSAO_CACHE, arquivos: {} };
  const atuais = arquivosAtuais();
  const alvo = somente ? somente.filter((p) => atuais.has(p)) : [...atuais.keys()].filter((p) => cache.arquivos[p]?.h !== atuais.get(p));
  const removidos = somente ? [] : Object.keys(cache.arquivos).filter((p) => !atuais.has(p));
  const usaTs = carregarTs();
  for (const p of removidos) delete cache.arquivos[p];
  for (const p of alvo) {
    try {
      const e = extrair(p);
      e.h = atuais.get(p);
      e.l2 = Boolean(usaTs && /\.(ts|tsx|mts|js|jsx|mjs|cjs)$/.test(p));
      e.teste = TESTE.test(p);
      const mods = new Set(e.refs.filter((r) => r.mod !== undefined).map((r) => r.mod).concat(Object.values(e.importados || {}).map((x) => x?.mod).filter(Boolean)));
      e.resolvidos = Object.fromEntries([...mods].map((m) => [m, resolverTs(m, p)]).filter(([, v]) => v));
      cache.arquivos[p] = e;
    } catch (err) {
      cache.arquivos[p] = { h: atuais.get(p), nodes: [{ id: idDe(p), label: p.split('/').pop(), file_type: 'code', source_file: p, kind: 'arquivo', erro: String(err.message).slice(0, 120) }], refs: [] };
    }
  }
  const jd = jdeps(cache);
  const jdMudou = JSON.stringify(jd.assinatura) !== JSON.stringify(cache.jdeps?.assinatura);
  cache.jdeps = jd;
  const mudou = alvo.length + removidos.length + (jdMudou ? 1 : 0);
  if (mudou || !existsSync(GRAFO)) {
    const { nodes, links } = montar(cache);
    const camadas = { L1: true, L2_ts: Boolean(usaTs), L2_java: Boolean(jd.ativo), L3: true };
    mkdirSync(DIR, { recursive: true });
    gravarAtomico(CACHE, JSON.stringify(cache));
    gravarAtomico(GRAFO, `${JSON.stringify({ directed: true, multigraph: false, graph: { schema_version: 1, generator: 'henrimap', camadas, jdeps: jd.ativo ? 'ativo' : jd.motivo, atualizadoEm: new Date().toISOString(), arquivos: Object.keys(cache.arquivos).length }, nodes, links })}\n`);
    gravarAtomico(join(DIR, 'resumo.md'), `${resumo(nodes, links, 2000)}\n`);
  }
  if (!silencioso) console.log(`henrimap: ${alvo.length} arquivo(s) extraído(s), ${removidos.length} removido(s); TS ${usaTs ? 'L2 (compilador do projeto)' : 'L1 (regex)'}; Java ${jd.ativo ? 'L2 (jdeps)' : `L1 (${jd.motivo})`}`);
  return { origem: 'henrimap', mudou };
}

// ---------------------------------------------------------------- consultas

const corte = (txt, budget) => (txt.length <= budget ? txt : `${txt.slice(0, budget - 40).replace(/\n[^\n]*$/, '')}\n… (cortado no orçamento de ${budget} caracteres)`);

function resumo(nodes, links, budget) {
  const COMPART = /(util|helper|lib|common|shared|service|component|hook|core|model|schema|api|domain|store)/i;
  const porPasta = new Map();
  for (const n of nodes) {
    if (!n.source_file || n.kind === 'arquivo' || !n.kind || TESTE.test(n.source_file)) continue;
    const pasta = posix.dirname(n.source_file);
    if (!porPasta.has(pasta)) porPasta.set(pasta, []);
    porPasta.get(pasta).push(n.label);
  }
  const pastas = [...porPasta.keys()].sort((a, b) => (COMPART.test(b) - COMPART.test(a)) || a.localeCompare(b));
  const amb = nodes.filter((n) => n.ambiguo).length;
  const eps = nodes.filter((n) => n.file_type === 'endpoint').length;
  const linhas = [`# mapa: ${nodes.length} nós, ${links.length} arestas, ${eps} endpoint(s), ${amb} arquivo(s) com ligação ambígua`];
  for (const p of pastas) linhas.push(`${p}: ${[...new Set(porPasta.get(p))].join(', ')}`);
  return corte(linhas.join('\n'), budget);
}

function indice(g) {
  const nodes = new Map(g.nodes.map((n) => [n.id, n]));
  const saem = new Map();
  const entram = new Map();
  for (const l of g.links) {
    if (!saem.has(l.source)) saem.set(l.source, []);
    if (!entram.has(l.target)) entram.set(l.target, []);
    saem.get(l.source).push(l);
    entram.get(l.target).push(l);
  }
  return { nodes, saem, entram };
}

const rotulo = (n) => (n ? `${n.label}${n.source_file && n.kind !== 'arquivo' ? ` (${n.source_file}${n.source_location ? `:${n.source_location.replace(/^L/, '')}` : ''})` : n.source_file ? ` (${n.source_file})` : ''}` : '?');

function achar(g, termo) {
  const t = termo.toLowerCase();
  const exatos = g.nodes.filter((n) => String(n.label).toLowerCase() === t || barra(n.source_file || '') === barra(termo));
  if (exatos.length) return exatos.sort((a, b) => (a.kind === 'arquivo') - (b.kind === 'arquivo'))[0];
  return g.nodes.find((n) => String(n.label).toLowerCase().includes(t)) || null;
}

function cmdExplain(g, termo, budget) {
  const ix = indice(g);
  const n = achar(g, termo);
  if (!n) return `nenhum nó para "${termo}". Tente: query "${termo}"`;
  const fmt = (l, lado) => `  ${lado === 'out' ? '-->' : '<--'} ${rotulo(ix.nodes.get(lado === 'out' ? l.target : l.source))} [${l.relation}] [${l.confidence}]`;
  const out = (ix.saem.get(n.id) || []).filter((l) => l.relation !== 'contains');
  const inn = (ix.entram.get(n.id) || []).filter((l) => l.relation !== 'contains');
  const cont = (ix.saem.get(n.id) || []).filter((l) => l.relation === 'contains').map((l) => ix.nodes.get(l.target)?.label).filter(Boolean);
  return corte([
    `nó: ${rotulo(n)}${n.kind ? ` · ${n.kind}` : ''}${n.ambiguo ? ` · AMBÍGUO: ${n.ambiguo.join(', ')} (leia o código)` : ''}`,
    cont.length ? `contém: ${cont.join(', ')}` : null,
    `usa (${out.length}):`, ...out.slice(0, 25).map((l) => fmt(l, 'out')),
    `usado por (${inn.length}):`, ...inn.slice(0, 25).map((l) => fmt(l, 'in')),
  ].filter(Boolean).join('\n'), budget);
}

function cmdPath(g, a, b, budget) {
  const ix = indice(g);
  const na = achar(g, a);
  const nb = achar(g, b);
  if (!na || !nb) return `nó não encontrado: ${!na ? a : b}`;
  const viz = (id) => [...(ix.saem.get(id) || []).map((l) => [l.target, l, '-->']), ...(ix.entram.get(id) || []).map((l) => [l.source, l, '<--'])];
  const prev = new Map([[na.id, null]]);
  const fila = [na.id];
  while (fila.length && !prev.has(nb.id)) {
    const x = fila.shift();
    for (const [y, l, dir] of viz(x)) if (!prev.has(y)) { prev.set(y, [x, l, dir]); fila.push(y); }
  }
  if (!prev.has(nb.id)) return `sem caminho entre ${na.label} e ${nb.label}`;
  const passos = [];
  for (let c = nb.id; prev.get(c); c = prev.get(c)[0]) passos.unshift(prev.get(c));
  return corte([`caminho (${passos.length} salto(s)):`, `  ${rotulo(na)}`, ...passos.map(([, l, d]) => `  ${d}${l.relation}${d === '-->' ? '-->' : '--'} ${rotulo(ix.nodes.get(d === '-->' ? l.target : l.source))}`)].join('\n'), budget);
}

function cmdAffected(g, arquivos, budget) {
  const ix = indice(g);
  const inicio = new Set();
  for (const a of arquivos.map(barra)) for (const n of g.nodes) if (barra(n.source_file || '') === a) inicio.add(n.id);
  if (!inicio.size) return `nenhum nó para os arquivos informados (${arquivos.length}). Arquivo novo ou fora do mapa.`;
  // Contrato: quem expõe ou declara um endpoint afeta quem o chama.
  for (const id of [...inicio]) for (const l of ix.saem.get(id) || []) if (l.relation === 'exposes' || l.relation === 'declares') inicio.add(l.target);
  const prof = new Map([...inicio].map((i) => [i, 0]));
  const via = new Map();
  const fila = [...inicio];
  while (fila.length) {
    const x = fila.shift();
    if (prof.get(x) >= 3) continue;
    for (const l of ix.entram.get(x) || []) {
      if (!AFETA.has(l.relation)) continue;
      if (!prof.has(l.source)) { prof.set(l.source, prof.get(x) + 1); via.set(l.source, l); fila.push(l.source); }
    }
  }
  const porArquivo = new Map();
  for (const [id, d] of prof) {
    if (d === 0) continue;
    const n = ix.nodes.get(id);
    const arq = n?.source_file || n?.label;
    if (!arq || arquivos.map(barra).includes(barra(arq))) continue;
    const atual = porArquivo.get(arq);
    if (!atual || atual.d > d) porArquivo.set(arq, { d, rel: via.get(id).relation, conf: via.get(id).confidence, alvo: ix.nodes.get(via.get(id).target)?.label, teste: TESTE.test(arq) });
  }
  const linhas = [...porArquivo].sort((a, b) => a[1].d - b[1].d || a[0].localeCompare(b[0]));
  const amb = [...prof.keys()].map((i) => ix.nodes.get(i)).filter((n) => n?.ambiguo).map((n) => n.source_file);
  return corte([
    `raio de impacto de ${arquivos.length} arquivo(s): ${linhas.length} dependente(s) até 3 saltos`,
    ...linhas.map(([a, v]) => `  ${v.d}  ${a}  (${v.rel} ${v.alvo} ${v.conf})${v.teste ? ' [teste]' : ''}`),
    amb.length ? `AMBÍGUO, leia o código: ${[...new Set(amb)].join(', ')}` : null,
  ].filter(Boolean).join('\n'), budget);
}

function cmdQuery(g, texto, budget) {
  const ix = indice(g);
  const termos = texto.toLowerCase().split(/[^a-zà-ú0-9]+/).filter((t) => t.length > 2);
  const pont = g.nodes.map((n) => {
    const alvo = `${n.label} ${n.source_file || ''}`.toLowerCase();
    return [n, termos.filter((t) => alvo.includes(t)).length + (termos.some((t) => String(n.label).toLowerCase() === t) ? 2 : 0)];
  }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!pont.length) return `nada no mapa para "${texto}". Busca textual é o próximo passo.`;
  const linhas = [];
  for (const [n] of pont) {
    linhas.push(`- ${rotulo(n)}`);
    const viz = [...(ix.saem.get(n.id) || []), ...(ix.entram.get(n.id) || [])].filter((l) => l.relation !== 'contains').slice(0, 6);
    for (const l of viz) linhas.push(`    ${l.source === n.id ? '-->' : '<--'} ${ix.nodes.get(l.source === n.id ? l.target : l.source)?.label} [${l.relation}]`);
  }
  return corte(linhas.join('\n'), budget);
}

function cmdStatus(g) {
  if (!g) return 'sem mapa: rode build';
  const m = g.meta || {};
  return [
    `origem: ${g.origem}${g.origem === 'graphify' ? ' (graphify-out/graph.json; atualize com /graphify --update)' : ''}`,
    `nós ${g.nodes.length}, arestas ${g.links.length}`,
    m.camadas ? `camadas: ${Object.entries(m.camadas).filter(([, v]) => v).map(([k]) => k).join(', ')}${m.jdeps && m.jdeps !== 'ativo' ? ` (Java sem jdeps: ${m.jdeps})` : ''}` : null,
    m.atualizadoEm ? `atualizado em ${m.atualizadoEm}` : null,
  ].filter(Boolean).join('\n');
}

// ------------------------------------------------------------- git hooks (F3)

function cmdGitHooks() {
  const hp = (gitOut(['config', '--get', 'core.hooksPath']) || '').trim();
  if (hp) return `core.hooksPath=${hp} (Husky ou similar): acrescente à mão, em post-checkout, post-merge e post-commit:\n  node .henriworks/bin/henrimap.mjs atualizar >/dev/null 2>&1 &`;
  const dirRel = (gitOut(['rev-parse', '--git-path', 'hooks']) || '').trim();
  if (!dirRel) return 'sem Git: hooks de atualização não instalados';
  const dir = resolve(RAIZ, dirRel);
  mkdirSync(dir, { recursive: true });
  const linha = '# >>> henriworks\n(node .henriworks/bin/henrimap.mjs atualizar >/dev/null 2>&1 &)\n# <<< henriworks';
  const feitos = [];
  const manuais = [];
  for (const h of ['post-checkout', 'post-merge', 'post-commit']) {
    const p = join(dir, h);
    const atual = existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : '#!/bin/sh\n';
    if (atual.includes('>>> henriworks')) continue;
    const [primeira, ...resto] = atual.split('\n');
    // Hook existente em outra linguagem não recebe linha de shell; hook de shell recebe a linha logo
    // depois do shebang, para rodar mesmo quando o script termina com exit.
    if (!/^#!.*\b(sh|bash|dash|zsh)\b/.test(primeira)) { manuais.push(h); continue; }
    writeFileSync(p, [primeira, linha, ...resto].join('\n').replace(/\s*$/, '\n'));
    try { chmodSync(p, 0o755); } catch { /* Windows */ }
    feitos.push(h);
  }
  const partes = [];
  if (feitos.length) partes.push(`git hooks locais do mapa: ${feitos.join(', ')} (em .git/hooks, fora do repositório)`);
  if (manuais.length) partes.push(`AVISO ${manuais.join(', ')} já existe(m) e não é shell: acrescente à mão a chamada a node .henriworks/bin/henrimap.mjs atualizar`);
  return partes.join('\n') || 'git hooks locais do mapa: já instalados';
}

// ---------------------------------------------------------------------- main

const [cmd, ...resto] = process.argv.slice(2);
const { pos, op } = opcoes(resto);
const cfg = lerJson(join(RAIZ, '.henriworks', 'henriworks.json'), {});
const budget = op.budget || cfg.mapa?.orcamentoSaida || 2000;

if (cmd === 'git-hooks') { console.log(cmdGitHooks()); process.exit(0); }
if (cmd === 'build') { atualizar(null, { forcar: !existsSync(GRAPHIFY), silencioso: false }); console.log(cmdStatus(carregarGrafo())); process.exit(0); }
if (cmd === 'atualizar') { atualizar(pos.length ? pos.map(barra) : null, { silencioso: !op.verbose }); process.exit(0); }
if (!['resumo', 'explain', 'path', 'affected', 'query', 'status'].includes(cmd)) {
  console.error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(2);
}
// F1: toda consulta confere o hash dos arquivos e reextrai só o que mudou antes de responder.
atualizar();
const g = carregarGrafo();
if (!g) { console.error('sem mapa: node .henriworks/bin/henrimap.mjs build'); process.exit(1); }
// Marca, para o hook de "mapa antes de busca", que esta sessão consultou o mapa.
try { mkdirSync(join(RAIZ, '.henriworks', 'estado'), { recursive: true }); writeFileSync(join(RAIZ, '.henriworks', 'estado', 'mapa-consultado'), new Date().toISOString()); } catch { /* opcional */ }
const saida = {
  resumo: () => resumo(g.nodes, g.links, budget),
  explain: () => cmdExplain(g, pos.join(' '), budget),
  path: () => cmdPath(g, pos[0], pos[1], budget),
  affected: () => cmdAffected(g, pos, budget),
  query: () => cmdQuery(g, pos.join(' '), budget),
  status: () => cmdStatus(g),
}[cmd]();
console.log(saida);
