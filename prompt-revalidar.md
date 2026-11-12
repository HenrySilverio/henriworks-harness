Para aprovar, basta resolver o **bloqueante**: o limite máximo sem campo e sem origem. Os dois "importantes" são o mesmo ponto (o critério 3), não impedem a aprovação e pedem uma decisão sua sobre o ticket. Nenhum prompt garante a aprovação, porque o revisor é independente; o que aumenta a chance é corrigir o problema de fato e não ampliar o escopo.

## 1. Chat novo, agente `hwk-plan`

Escolha **A** ou **B** no item 2 e apague a outra antes de enviar.

```text
/hwk-plan replanejar: GPCNLS-10019-limitar-vencimento-primeira-parcela

Achados aceitos da revisão da spec. Mude só o que está abaixo.

1. [bloqueante] Limite máximo sem campo e sem origem (proposta.md, critérios 1 e 3; design.md, Abordagem).
   - Consulte o mapa antes de buscar: node .henriworks/bin/henrimap.mjs query "vencimento primeira parcela"
   - Ache no contrato ou no response do BFF o campo da data máxima de vencimento da primeira parcela.
   - Na proposta e no design, nomeie os dois limites com o response de origem de cada um:
     mínimo = dataMinimaVencimentoPrimeiraParcela (<response>), máximo = <campo> (<response>).
   - Se o campo do máximo não existir no contrato, não invente nome nem origem: pare e me pergunte.

2. [importante] Critério 3 (preencher o campo com a data mínima). Decisão:
   (A) Não é requisito do ticket. Remova o critério 3 e as tarefas 2.4 e 2.5. O campo começa vazio
       e o calendário abre no mês da data mínima.
   (B) É requisito do ticket. Mantenha, com estas regras, cada uma com critério de aceite e teste na fatia:
       - só preenche quando o campo está vazio;
       - um response novo nunca substitui uma data que o gerente já escolheu e que continua dentro da faixa;
       - se a data escolhida ficar fora da nova faixa: <limpar o campo | manter a data e mostrar erro de validação>.

No fim, rode node .henriworks/bin/hwk.mjs validar GPCNLS-10019-limitar-vencimento-primeira-parcela
e mostre o que mudou em proposta.md, design.md e nas fatias.
```

O critério 3 nasceu do replanejamento anterior, quando a revisão pediu para definir a data inicial. Se o ticket não pede o campo preenchido, **A** é o menor escopo e o mais fácil de aprovar.

## 2. Chat novo, agente `hwk-review`

```text
/hwk-review spec GPCNLS-10019-limitar-vencimento-primeira-parcela
```

O replanejamento muda o hash da spec, então os cinco estágios rodam de novo sobre a versão nova.

## 3. Tudo APROVADO: aprovar no terminal

```powershell
node .henriworks\bin\hwk.mjs aprovar-spec GPCNLS-10019-limitar-vencimento-primeira-parcela --por "Henrique Silvério"
```

Rode você mesmo. A aprovação é o portão humano e não deve ficar com o agente.

Se sobrar um REPROVADO com que você não concorde, o mesmo comando aceita `--apesar "<motivo>"`. O motivo fica registrado, mas use só quando discordar do achado, não para pular um problema real.

Para essa rodada, vale fixar um modelo no chat em vez do Copilot Fusion (o GPT-6 Luna se comportou bem). As revisões ficam comparáveis entre rodadas.