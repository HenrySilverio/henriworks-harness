#!/usr/bin/env node
// b.IA Credit Hive - ajusta o plugin.json do repositório do template para a versão completa.
// Rode no Git Bash, na raiz do clone:  node ~/Downloads/atualizar-plugin-json.mjs
// Muda só description e author. Versão e o resto ficam como estão: quem sobe a versão é o release-please.
import { readFileSync, writeFileSync } from 'node:fs';

const DESCRICAO = "b.IA Credit Hive: orquestrador de agentes para Spec-Driven Development no Copilot do VS Code, organizado como uma colmeia — a rainha conduz a mudança e cada operária tem um papel (discovery, plano em fatias, implementação por fatia com os agentes da sua stack, revisão por um subagente que não viu a conversa, arquivamento e OK do QA) — do ticket do Jira até a PR, com portões humanos, relatório de uso só com contagens e tokens e o conhecimento de cada entrega guardado no repositório. Comandos /bia-credit-hive:*. Use em front-end, BFF ou backend da b.IA Credit para planejar, implementar, revisar ou fechar uma mudança.";
const AUTOR = 'Henrique Silvério';

let p;
try { p = JSON.parse(readFileSync('plugin.json', 'utf8')); } catch (e) { console.error('não achei o plugin.json aqui: rode na raiz do clone.'); process.exit(2); }
if (p.name !== 'bia-credit-hive') { console.error(`este plugin.json é de "${p.name}", não do bia-credit-hive.`); process.exit(2); }
p.description = DESCRICAO;
p.author = typeof p.author === 'string' || !p.author ? AUTOR : { ...p.author, name: AUTOR };
writeFileSync('plugin.json', `${JSON.stringify(p, null, 2)}\n`);
console.log(`plugin.json atualizado: description e author. Versão ${p.version} mantida.`);
