---
name: hwk-canario
description: "Prova que o revisor sem contexto é isolado nesta máquina e que os hooks rodam."
argument-hint: "[preparar | conferir | aplicar]"
disable-model-invocation: true
---
# /hwk-canario

Utilitário: roda em qualquer agente com terminal.

Sem argumento, ou `preparar`: rode `node .henriworks/bin/hwk.mjs canario preparar` e mostre a saída inteira. Os passos seguintes
são do dev, num chat novo: não tente fazê-los aqui, porque a palavra-código precisa entrar só no chat do
agente `hwk-review`.

`conferir`: rode `node .henriworks/bin/hwk.mjs canario conferir` e mostre a saída inteira.

`aplicar`: rode `node .henriworks/bin/hwk.mjs canario aplicar` e mostre a saída. Só faz efeito se o canário passou.
