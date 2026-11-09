---
name: hwk-adotar
description: "Copia specs e decisões do .sdd/ do HenriSpec para o HenriWorks, uma vez, sem mover nada."
disable-model-invocation: true
---
# /hwk-adotar

Utilitário: roda em qualquer agente com terminal.

1. Rode `node .henriworks/bin/hwk.mjs adotar` e mostre o plano. Nada é escrito nesse passo.
2. Pergunte se pode aplicar. Só com um sim explícito, rode `node .henriworks/bin/hwk.mjs adotar --aplicar`.

O `.sdd/` nunca é alterado. Mudanças abertas do HenriSpec não são copiadas: continuam no HenriSpec.
