---
name: hwk-triagem
description: "Atalho de /hwk-triagem. A fase roda no agente hwk-triagem."
argument-hint: "<caminho, #file ou texto do ticket>"
disable-model-invocation: true
---
# /hwk-triagem

Esta fase roda no agente `hwk-triagem`, que define as ferramentas e os passos dela.

Se as instruções deste chat começam com `# Agente hwk-triagem`, siga-as com o texto que veio depois do comando e ignore o resto deste arquivo.

Caso contrário, não leia nem execute nada. Responda em uma linha: selecione o agente `hwk-triagem` no seletor
de agentes, num chat novo, e reenvie o mesmo pedido. Rodar a fase fora do agente pula o contrato e libera ferramentas
que ela não deveria ter.
