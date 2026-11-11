---
name: hwk-init
description: "Prepara o repositório depois da instalação: confere, corrige o seguro, roda o canário e liga o uso. Roda no agente hwk."
disable-model-invocation: true
---
# /hwk-init

Deixar o repositório pronto num chat só, depois de instalar ou atualizar: conferir, corrigir o que é
seguro, provar o isolamento do revisor e ligar a coleta de uso. Pode rodar de novo quando quiser: o que
já está pronto é pulado.

Roda no agente `hwk`. Se as instruções deste chat não começam com a linha `# Agente hwk`, não leia nem execute nada: responda em uma linha que é para selecionar o agente `hwk` num chat novo e enviar `/hwk-init` de novo. O agente define as ferramentas que estes passos precisam.

## Passo 1 - Conferir e corrigir

Rode `node .henriworks/bin/hwk.mjs init --corrigir` e mostre a saída inteira. Ele confere Node, Git, instalação, hooks, exclusão
no Git, mapa, modelos, preços, OpenTelemetry e canário, e corrige só o que é local e reversível (mapa,
hooks do Git, lista de modelos). Linha `GRAVE`: mostre e pare. Nada mais roda com a instalação quebrada.

## Passo 2 - Canário

Linha `canário` com "ligado": pule para o passo 3. Senão:

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

Hooks sem evento ou canário que falhou não param o init: siga para o passo 3 e deixe no relatório.

## Passo 3 - Uso e OpenTelemetry

Linha `otel` com "ligado": pule. Senão, rode `node .henriworks/bin/uso.mjs configurar` e mostre. Pergunte
ao dev, em uma frase, se pode ligar o exportador no usuário dele (grava variável de ambiente; nenhum
prompt, resposta ou comando é gravado). Só com sim explícito neste chat, rode
`node .henriworks/bin/uso.mjs configurar --aplicar` e lembre de fechar e abrir o VS Code.

## Passo 4 - Relatório

Rode `node .henriworks/bin/hwk.mjs init` e mostre a saída. Feche com até seis linhas: o que ficou pronto, o que ficou pendente e
quem resolve, e o próximo passo: `/hwk-start` com o que você quer fazer.

`verificacao.json` e `padroes.md` são do time. Se ainda estiverem no molde, aponte `/hwk-configurar`
(roda em qualquer agente com terminal) e não os edite aqui.
