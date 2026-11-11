---
name: hwk-canario
description: "Prova que o revisor sem contexto é isolado nesta máquina e que os hooks rodam. Roda no agente hwk."
argument-hint: "[conferir | aplicar]"
disable-model-invocation: true
---
# /hwk-canario

Prova, nesta máquina, que o peixinho (`hwk-gf`) não recebe a conversa do pai, e que os hooks rodam. O
`/hwk-init` já faz isto; use este comando para repetir só o canário.

Roda no agente `hwk`. Se as instruções deste chat não começam com a linha `# Agente hwk`, não leia nem execute nada: responda em uma linha que é para selecionar o agente `hwk` num chat novo e enviar `/hwk-canario` de novo. O agente define as ferramentas que estes passos precisam.

- `conferir`: rode `node .henriworks/bin/hwk.mjs canario conferir` e mostre a saída.
- `aplicar`: rode `node .henriworks/bin/hwk.mjs canario aplicar` e mostre a saída. Só faz efeito se o canário passou.
- Sem argumento: o teste inteiro, neste chat:

1. `node .henriworks/bin/hwk.mjs canario preparar`. A palavra-código passa a estar na conversa deste chat: é a isca. Não a
   repita em nenhuma mensagem sua.
2. `node .henriworks/bin/hwk.mjs pacote-revisao canario`.
3. Delegue ao subagente `hwk-gf` com o prompt literal impresso, sem nada antes nem depois.
4. Grave a resposta dele, sem edição, em `.henriworks/estado/canario-resposta.md`.
5. `node .henriworks/bin/hwk.mjs canario conferir` e mostre a saída inteira.
   - "isolamento confirmado" e chamada de subagente registrada: rode `node .henriworks/bin/hwk.mjs canario aplicar`.
   - "NENHUM evento registrado": os hooks não rodaram nesta janela. Diga ao dev para rodar
     "Developer: Reload Window" e repetir o comando.
   - "isolamento FALHOU": mostre e encerre o canário. A revisão padrão não é confiável nesta máquina até investigar;
     o caminho é o modo estrito (`estrito` no `hwk-review`).

Sem ferramenta de subagente nesta sessão: diga isso e encerre o canário. Não simule a resposta do peixinho.
