---
name: hwk-modelos
description: "Modelos que a política do Copilot libera, cruzados com o uso registrado e a tabela de preço."
argument-hint: "[atualizar [--de <fonte>] | conferir]"
disable-model-invocation: true
---
# /hwk-modelos

Utilitário: roda em qualquer agente com terminal.

- Sem argumento: rode `node .henriworks/bin/modelos.mjs` e mostre a saída inteira.
- `atualizar`: rode `node .henriworks/bin/modelos.mjs atualizar` com o resto do argumento, sem alterar.
- `conferir`: rode `node .henriworks/bin/modelos.mjs conferir`. Código 1 é alerta grave: mostre e pare.

Não interprete além da saída. Política, uso e preço vêm de script; não sugira trocar de modelo por conta própria.
