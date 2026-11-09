---
name: hwk-ticket
description: "Mostra ou fixa o ticket do Jira usado para ligar uso e custo à task."
argument-hint: "[CHAVE-123 | --limpar]"
disable-model-invocation: true
---
# /hwk-ticket

Utilitário: roda em qualquer agente com terminal.

Rode `node .henriworks/bin/hwk.mjs ticket` com o argumento recebido, sem alterar, e mostre a saída. Sem argumento, ele só mostra o
ticket atual e de onde ele veio: fixado, proposta ou nome da branch.
