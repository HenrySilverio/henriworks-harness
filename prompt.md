Então o código está certo e quem está errado é o critério 7 da spec. O revisor fez o trabalho dele: apontou que o código e a spec dizem coisas opostas. Só errou o lado, porque tratou a spec como verdade.

Não tire o `required`. O que precisa mudar é o critério 7.

**Por que corrigir a spec em vez de só aceitar a revisão**

Se você só aceitar, o `/hwk-archive` aplica o `deltas.md` e grava "data opcional" no estado do sistema. A descrição da PR também afirmaria o contrário do que o código faz. Daqui a três meses, quem consultar essa decisão vai encontrar a regra errada. A correção é uma linha.

**Passos**

1. Num chat novo com o agente `hwk-plan`:
   ```
   replanejar: GPCNLS-10019-limitar-vencimento-intervalo
   O critério 7 está errado: dtPagamentoParcela é obrigatória. A API não aceita requisição sem data
   ou com data fora do intervalo, então o required e o asterisco ficam. Corrija só o critério 7 e o
   trecho do deltas.md que fala disso. Nenhuma tarefa nova, nenhuma fatia nova.
   ```
2. Confira o estado e aprove a spec corrigida:
   ```bash
   node .henriworks/bin/hwk.mjs estado
   node .henriworks/bin/hwk.mjs aprovar-spec GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério"
   ```
   Os estágios da revisão da spec que já aprovaram não rodam de novo. Se o `estado` listar algum como "a revisar", rode o `/hwk-review spec` antes de aprovar.
3. Refaça o aceite da revisão de código com o motivo real. O HEAD não mudou, porque o `.henriworks/` não vai para o Git, então o comando só regrava o arquivo de aceite:
   ```bash
   node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "required correto: a API exige a data; o critério 7 estava errado e foi corrigido na spec. Evidência manual é declaração do dev, sem PR nem print."
   ```
4. Num chat novo com o agente `hwk-archive`: `/hwk-archive GPCNLS-10019-limitar-vencimento-intervalo`.

**Alternativa**

Em vez do passo 3, você pode rodar `rodada-extra` no eixo `spec` e depois o `/hwk-review` de novo. Com o critério corrigido, o `required` deixa de ser achado e sobra só a evidência, que você aceita.

- **Prós:** fica um veredito limpo para o eixo `spec`.
- **Contras:** mais uma rodada, e o revisor pode trazer ruído novo.

Para esta mudança eu ficaria com o aceite.

E as quatro correções do harness que listei antes: confirma que faço?