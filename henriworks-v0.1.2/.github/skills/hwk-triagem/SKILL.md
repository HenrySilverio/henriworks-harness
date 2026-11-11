---
name: hwk-triagem
description: "Converte um ticket, chamado ou bug já escrito em briefing, entrevistando só as lacunas. Roda no agente hwk-discovery."
argument-hint: "<caminho, #file ou texto do ticket>"
disable-model-invocation: true
---
# /hwk-triagem

A demanda quase nunca chega como página em branco: chega como um ticket escrito com pressa. Aproveite
o que está escrito e pergunte só o que falta.

Roda no agente `hwk-discovery`. Se as instruções deste chat não começam com a linha `# Agente hwk-discovery`, não leia nem execute nada: responda em uma linha que é para selecionar o agente `hwk-discovery` num chat novo e enviar `/hwk-triagem` de novo. O agente define as ferramentas que estes passos precisam.

## Entradas

O **material** vem na primeira mensagem: caminho, `#file` ou o texto colado. As seguintes são as
respostas das rodadas.

## Passo 0 - Contrato

Leia `.github/skills/henriworks-fluxo/SKILL.md`, seções 1, 3 e 4. Material vazio: peça o texto do ticket e pare. Caminho inexistente: diga e
pare. Não use busca e não leia código: o objetivo é entender o pedido, não o sistema.

## Passo 1 - Mapear

Leia o material inteiro e classifique cada seção obrigatória do briefing, sem escrever arquivo: coberta
(o material responde e você cita o trecho), parcial, ou ausente.

Duas armadilhas, e as duas contam como ausente:

- **Solução no lugar do problema.** "Criar endpoint de idempotência" diz o que alguém decidiu. `Problema`
  está ausente; o texto vai para `Contexto útil` como solução cogitada por quem pediu.
- **Reprodução no lugar do esperado.** Passos de reprodução descrevem o defeito. `O que se espera` segue
  ausente até alguém dizer o que deveria acontecer.

Mostre o mapa em até seis linhas antes de perguntar. A chave do ticket, quando o material tem, vai para
`Prazo e ticket`. Sem chave no material, ela é a primeira pergunta da primeira rodada, e é obrigatória:
sem ela, nada é gravado.

## Passo 2 - Entrevistar as lacunas

Leia `.github/skills/henriworks-fluxo/references/tecnica-grilling.md`. Pergunte só sobre o que ficou parcial ou ausente. Limite de três rodadas.
`Restrições` é ausente em quase todo ticket e entra sempre na primeira rodada. Termo ambíguo do domínio
vira pergunta, como no `/hwk-grill`.

## Passo 3 - Gravar

Leia `.github/skills/henriworks-fluxo/references/molde-briefing.md` e grave `.henriworks/briefings/<TICKET>-<assunto>/briefing.md`. Se o material
contradisser a entrevista, a entrevista vence e a contradição vai para `Contexto útil` em uma linha.
Termos resolvidos vão para o fim de `.henriworks/glossario.md`.

## Saída

O formato do molde, mais uma linha com a origem de cada seção, uma com as contradições, e a próxima ação:
num chat novo, agente `hwk-plan`, com o caminho do briefing.
