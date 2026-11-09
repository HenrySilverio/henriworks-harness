---
name: hwk-plan
description: "Atalho de /hwk-plan. A fase roda no agente hwk-plan."
argument-hint: "<caminho do briefing.md> [replanejar: <change-id>]"
disable-model-invocation: true
---
# /hwk-plan

Esta fase roda no agente `hwk-plan`, que define as ferramentas e os passos dela.

Se as instruções deste chat começam com `# Agente hwk-plan`, siga-as com o texto que veio depois do comando e ignore o resto deste arquivo.

Caso contrário, não leia nem execute nada. Responda em uma linha: selecione o agente `hwk-plan` no seletor
de agentes, num chat novo, e reenvie o mesmo pedido. Rodar a fase fora do agente pula o contrato e libera ferramentas
que ela não deveria ter.
