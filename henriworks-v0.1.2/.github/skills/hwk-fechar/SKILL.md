---
name: hwk-fechar
description: "Atalho de /hwk-fechar. A fase roda no agente hwk-archive."
argument-hint: "<pasta arquivada> <número da PR>"
disable-model-invocation: true
---
# /hwk-fechar

Esta fase roda no agente `hwk-archive`, que define as ferramentas e os passos dela.

Se as instruções deste chat começam com `# Agente hwk-archive`, siga-as com o texto que veio depois do comando, precedido de `fechar`, e ignore o resto deste arquivo.

Caso contrário, não leia nem execute nada. Responda em uma linha: selecione o agente `hwk-archive` no seletor
de agentes, num chat novo, e reenvie o mesmo pedido começando por `fechar`. Rodar a fase fora do agente pula o contrato e libera ferramentas
que ela não deveria ter.
