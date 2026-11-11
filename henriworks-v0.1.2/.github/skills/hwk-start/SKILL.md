---
name: hwk-start
description: "Diz qual é o próximo passo do fluxo, a partir do estado do repositório, e para."
argument-hint: "<o que você quer fazer, em uma frase>"
disable-model-invocation: true
---
# /hwk-start

Dizer qual é o próximo passo e parar. Não entreviste, não planeje e não edite nada.

Precisa de terminal. Sem ferramenta de terminal neste agente, responda em uma linha: selecione o agente
`hwk` e envie `/hwk-start` com o mesmo pedido.

## Passo 1 - Estado

Rode `node .henriworks/bin/hwk.mjs estado`. Sem a pasta `.henriworks/`, diga que o HenriWorks não está instalado neste repositório
e que a instalação está no README do pacote; pare.

## Passo 2 - Rota

Aplique a primeira que valer, na ordem:

1. Saída com linha `HENRISPEC`: a branch tem mudança aberta no HenriSpec. Indique o agente `henrispec-*`
   da fase dela e pare. Uma branch, um harness.
2. Mudança aberta nesta branch: diga a fase, o agente da próxima fase e a mensagem exata para enviar num
   chat novo. Na fase `revisao-spec` com "humano: hwk aprovar-spec", mostre o comando
   `node .henriworks/bin/hwk.mjs aprovar-spec <id> --por "<seu nome>"` e diga que essa decisão é do dev.
3. Mudança arquivada sem registro de conhecimento: agente `hwk-archive`, `/hwk-fechar <pasta> <número da PR>`,
   depois de a PR estar aberta.
4. Nenhuma mudança: escolha pela mensagem do dev.

| Situação | Próximo |
| --- | --- |
| pedido pequeno: teste quebrado, texto, configuração, ajuste em poucos arquivos | nenhum: faça no chat normal, sem fluxo |
| dor ou ideia, nada escrito | agente `hwk-discovery`, `/hwk-grill <a necessidade>` |
| ticket, chamado ou bug já escrito | agente `hwk-discovery`, `/hwk-triagem <ticket>` |
| decisão que só se toma vendo funcionar | agente `hwk-prototipo` |
| briefing pronto em `.henriworks/briefings/` | agente `hwk-plan`, com o caminho do briefing |

Se a mensagem não basta para escolher, faça uma pergunta e pare.

5. Sem `.henriworks/estado/init.json`, ou com canário não conferido, acrescente uma linha: antes da
   primeira revisão, agente `hwk`, `/hwk-init`.

## Saída

Até oito linhas: onde a branch está, o próximo agente, a mensagem para o chat novo, e o porquê em uma
frase. Não abra o próximo agente e não faça o trabalho dele.
