---
name: hwk-review
description: "Atalho de /hwk-review. A fase roda no agente hwk-review."
argument-hint: "<spec | (nada) | estrito> <change-id>"
disable-model-invocation: true
---
# /hwk-review

Esta fase roda no agente `hwk-review`, que define as ferramentas e os passos dela.

Se as instruções deste chat começam com `# Agente hwk-review`, siga-as com o texto que veio depois do comando e ignore o resto deste arquivo.

Caso contrário, não leia nem execute nada. Responda em uma linha: selecione o agente `hwk-review` no seletor
de agentes, num chat novo, e reenvie o mesmo pedido. Rodar a fase fora do agente pula o contrato e libera ferramentas
que ela não deveria ter.
