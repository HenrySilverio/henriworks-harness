# Sondagem do formato de plugin - bia-credit-hive 1.0.1-dev.3+258f720

Gerado em 2026-11-18T12:48:25.113Z. Sem conteúdo de prompt ou de conversa.

| Item | Resultado | Detalhe |
| --- | --- | --- |
| Comando no chat | INFO | `/bia-credit-hive:bchive-probe` (com o nome do plugin na frente) |
| Init achou o plugin | OK | método: skill-dir; PLUGIN_ROOT no terminal: não; win32, Node 22.23.0 |
| Núcleo roda do repositório | OK | `node .bchive/bin/bchive.mjs` executou |
| Versão do núcleo = plugin | OK | núcleo 1.0.1-dev.3+258f720; plugin 1.0.1-dev.3+258f720 |
| Hooks do plugin rodam | OK | eventos: postToolUse, sessionEnd, sessionStart, userPromptSubmitted, preToolUse, subagentStart |
| Variante do comando do hook | OK | powershell, agent-scoped |
| PLUGIN_ROOT no hook | OK | definido |
| Hook roda na raiz do repositório | FALHOU | 0/16 execuções |
| Hook do agente (frontmatter) | OK | rodou |
| sessionStart | OK | rodou |
| subagentStart | OK | rodou |
| preToolUse vê a chamada do subagente | OK | ferramenta task, agente bia-credit-hive:bchive-gf |
| Subagente chamável | OK | agent_type usado: `bia-credit-hive:bchive-gf` |
| Isolamento do revisor | OK | token não visto (NONE) |
| Ferramentas do revisor | OK | functions.view, functions.rg, functions.glob, multi_tool_use.parallel |
| Contexto do revisor | INFO | AGENTS.md |
