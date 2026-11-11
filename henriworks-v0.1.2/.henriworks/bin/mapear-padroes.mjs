#!/usr/bin/env node
// Mapeia, por camada, quantas vezes cada jeito de fazer aparece num app Angular. Sem dependência, Node 20+.
//
//   node .henriworks/bin/mapear-padroes.mjs [raiz-do-repo] [--saida <arquivo>]   (padrão: .henriworks/estado/padroes-mapeados.md)
//
// Só conta e lista caminhos: nenhum trecho de código vai para a saída. Serve para decidir o padrão alvo
// de cada divergência e escolher os arquivos exemplares das .instructions.md.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, sep, resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const RAIZ = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--saida') || process.cwd();
const iSaida = args.indexOf('--saida');
const SAIDA = iSaida >= 0 ? args[iSaida + 1] : join(RAIZ, '.henriworks', 'estado', 'padroes-mapeados.md');
const APP = join(RAIZ, 'src', 'app');
if (!existsSync(APP)) { console.error(`não achei ${APP}`); process.exit(2); }

const barra = (p) => p.split(sep).join('/');
const arquivos = [];
(function andar(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!/^(node_modules|dist|\.angular)$/.test(n)) andar(p); }
    else if (/\.(ts|html|scss)$/.test(n)) arquivos.push(p);
  }
})(APP);

const camadaDe = (rel) => (rel.match(/^src\/app\/(core|domain|feature|shared)\//) || [])[1] || 'outros';
const CAMADAS = ['core', 'domain', 'feature', 'shared', 'outros'];

// Cada decisão: dois ou mais jeitos, contados por arquivo que usa.
const DECISOES = [
  { id: 'entradas', titulo: 'Entradas de componente', ext: /\.component\.ts$/, jeitos: { 'input()/input.required()': /\binput(\.required)?\s*[<(]/, '@Input()': /@Input\s*\(/ } },
  { id: 'saidas', titulo: 'Saídas de componente', ext: /\.component\.ts$/, jeitos: { 'output()': /\boutput\s*[<(]/, '@Output() + EventEmitter': /@Output\s*\(/ } },
  { id: 'injecao', titulo: 'Injeção de dependência', ext: /\.ts$/, filtro: /@(Component|Injectable|Directive|Pipe)\s*\(/, jeitos: { 'inject()': /\binject\s*\(/, 'construtor com parâmetro': /constructor\s*\(\s*(private|public|protected|readonly)\b/ } },
  { id: 'cd', titulo: 'Change detection', ext: /\.component\.ts$/, jeitos: { OnPush: /ChangeDetectionStrategy\.OnPush/, 'padrão (sem OnPush)': /^(?![\s\S]*ChangeDetectionStrategy\.OnPush)/ } },
  { id: 'fluxo', titulo: 'Control flow no template', ext: /\.html$/, jeitos: { '@if/@for/@switch': /@(if|for|switch)\s*\(/, '*ngIf/*ngFor/ngSwitch': /\*ng(If|For)|\[ngSwitch\]/ } },
  { id: 'estado', titulo: 'Estado de tela', ext: /\.ts$/, filtro: /@Injectable|signalStore\s*\(/, jeitos: { 'signalStore': /signalStore\s*\(/, 'BehaviorSubject/Subject em service': /new\s+(Behavior|Replay)?Subject\s*[<(]/, 'signal() em service': /@Injectable[\s\S]*\bsignal\s*[<(]/ } },
  { id: 'http', titulo: 'Chamada HTTP', ext: /\.ts$/, jeitos: { 'HttpClient direto': /\bHttpClient\b/, 'HttpService do core': /\bHttpService\b/ } },
  { id: 'assinatura', titulo: 'Observable em componente', ext: /\.component\.ts$/, jeitos: { '.subscribe() manual': /\.subscribe\s*\(/, 'toSignal()/async pipe': /toSignal\s*\(|\|\s*async/ } },
];

const ALERTAS = [
  { titulo: '`any` explícito', ext: /\.ts$/, re: /:\s*any\b|as\s+any\b|<any>/ },
  { titulo: '`console.*` em código', ext: /(?<!\.spec)\.ts$/, re: /\bconsole\.(log|warn|error|info|debug)\s*\(/ },
  { titulo: 'cor fixa em SCSS (hex/rgb)', ext: /\.scss$/, re: /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/ },
  { titulo: '`::ng-deep`', ext: /\.scss$/, re: /::ng-deep/ },
  { titulo: '`!important`', ext: /\.scss$/, re: /!important/ },
  { titulo: '`customElements.define` sem `customElements.get`', ext: /\.ts$/, re: /customElements\.define/, nao: /customElements\.get/ },
  { titulo: '`standalone: false` ou `@NgModule`', ext: /\.ts$/, re: /standalone\s*:\s*false|@NgModule\s*\(/ },
  { titulo: '`document.createElement` em componente', ext: /\.component\.ts$/, re: /document\.createElement/ },
];

// Imports que cruzam camada na direção proibida.
const PROIBIDO = { core: ['domain', 'feature'], domain: ['feature'], shared: ['core', 'domain', 'feature'], feature: [] };
const reImport = /from\s+['"]([^'"]+)['"]/g;

const tabela = {};
const exemplos = {};
const alertas = {};
const violacoes = [];
const semSpec = [];
for (const abs of arquivos) {
  const rel = barra(relative(RAIZ, abs));
  const cam = camadaDe(rel);
  const txt = readFileSync(abs, 'utf8');
  for (const d of DECISOES) {
    if (!d.ext.test(rel) || /\.spec\.ts$/.test(rel) || (d.filtro && !d.filtro.test(txt))) continue;
    for (const [jeito, re] of Object.entries(d.jeitos)) {
      if (!re.test(txt)) continue;
      const k = `${d.id}|${jeito}`;
      (tabela[k] ||= Object.fromEntries(CAMADAS.map((c) => [c, 0])))[cam]++;
      (exemplos[k] ||= []).push(rel);
    }
  }
  for (const a of ALERTAS) {
    if (!a.ext.test(rel) || !a.re.test(txt) || (a.nao && a.nao.test(txt))) continue;
    (alertas[a.titulo] ||= []).push(rel);
  }
  if (rel.endsWith('.ts') && !rel.endsWith('.spec.ts')) {
    for (const m of txt.matchAll(reImport)) {
      const alvo = m[1];
      // Relativo vira caminho do repo; alias (@core/, @shared/, @app/...) é lido pelo nome.
      const relAlvo = alvo.startsWith('.') ? barra(relative(RAIZ, resolve(dirname(abs), alvo))) : null;
      const camAlvo = relAlvo ? camadaDe(`${relAlvo}/`) : (alvo.match(/^@(core|domain|feature|shared)\b/) || alvo.match(/^@app\/(core|domain|feature|shared)\b/) || [])[1];
      if (!camAlvo || camAlvo === 'outros') continue;
      if (camAlvo !== cam && (PROIBIDO[cam] || []).includes(camAlvo)) violacoes.push(`${rel} → ${alvo}`);
      if (cam === 'feature' && camAlvo === 'feature' && relAlvo) {
        const minha = rel.split('/')[3];
        const dele = relAlvo.split('/')[3];
        if (dele && minha && dele !== minha) violacoes.push(`${rel} → ${alvo} (feature para feature)`);
      }
    }
    if (/\.(component|service|pipe|mapper|store)\.ts$/.test(rel) && !existsSync(abs.replace(/\.ts$/, '.spec.ts'))) semSpec.push(rel);
  }
}

const out = [`# Padrões mapeados · ${barra(relative(process.cwd(), RAIZ)) || '.'}`, '', `Gerado por mapear-padroes.mjs em ${new Date().toISOString()}. ${arquivos.length} arquivo(s) em src/app. Só contagem e caminhos, nenhum trecho de código.`, '', '## Divergências (arquivos que usam cada jeito, por camada)', ''];
for (const d of DECISOES) {
  const linhas = Object.keys(d.jeitos).map((j) => [j, tabela[`${d.id}|${j}`]]).filter(([, v]) => v);
  if (!linhas.length) continue;
  out.push(`### ${d.titulo}`, '', `| Jeito | ${CAMADAS.join(' | ')} | total | exemplos |`, `| --- | ${CAMADAS.map(() => '---:').join(' | ')} | ---: | --- |`);
  for (const [j, v] of linhas) {
    const total = Object.values(v).reduce((a, b) => a + b, 0);
    out.push(`| ${j} | ${CAMADAS.map((c) => v[c] || '').join(' | ')} | ${total} | ${(exemplos[`${d.id}|${j}`] || []).slice(0, 3).map((e) => `\`${e}\``).join('<br>')} |`);
  }
  out.push('');
}
out.push('## Imports na direção proibida', '', violacoes.length ? violacoes.slice(0, 40).map((v) => `- \`${v}\``).join('\n') : 'nenhum', '');
out.push('## Alertas', '');
for (const a of ALERTAS) { const l = alertas[a.titulo] || []; out.push(`- ${a.titulo}: ${l.length}${l.length ? ` (${l.slice(0, 4).map((x) => `\`${x}\``).join(', ')}${l.length > 4 ? ', …' : ''})` : ''}`); }
out.push('', `## Sem spec ao lado: ${semSpec.length}`, '', semSpec.slice(0, 30).map((s) => `- \`${s}\``).join('\n') || 'nenhum', '');
mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, `${out.join('\n')}\n`);
console.log(`mapa de padrões: ${SAIDA}`);
