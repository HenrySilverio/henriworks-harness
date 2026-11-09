---
name: hwk-start
description: "Atalho de /hwk-start. A fase roda no agente hwk."
argument-hint: "<o que você quer fazer>"
disable-model-invocation: true
---
# /hwk-start

Esta fase roda no agente `hwk`, que define as ferramentas e os passos dela.

Se as instruções deste chat começam com `# Agente hwk`, siga-as com o texto que veio depois do comando e ignore o resto deste arquivo.

Caso contrário, não leia nem execute nada. Responda em uma linha: selecione o agente `hwk` no seletor
de agentes, num chat novo, e reenvie o mesmo pedido. Rodar a fase fora do agente pula o contrato e libera ferramentas
que ela não deveria ter.
