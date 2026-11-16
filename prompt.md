Sim, o próximo passo é o archive. Antes, dois pontos:

**1. Confira se o motivo não ficou como `<motivo>` literal.** O comando aceita qualquer texto, e esse motivo vai para a PR, na seção "Pontos para o revisor humano". Confira:

```bash
cat .henriworks/changes/GPCNLS-10019-limitar-vencimento-intervalo/revisao/ACEITE-*.md
```

Se a linha `Apesar de:` estiver com `<motivo>`, rode de novo com o motivo real. O arquivo é regravado:

```bash
node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "achado fora da régua: <qual era e por quê>"
```

**2. Só aceite se o bloqueante estava fora da régua.** Fora da régua é: outra camada, render do Liquid, algo que já existia antes, pedido de mais evidência. Se o achado era um bug que o seu diff introduziu, aceitar leva o bug para a PR. Nesse caso, desfaça pelo `hwk-plan` com `replanejar:`. Se tiver dúvida, me manda o achado e eu te digo de que lado ele cai.

**Depois, o archive**

1. Deixe a árvore limpa. Qualquer commit novo invalida o aceite, porque o aceite fica preso ao HEAD.
   ```bash
   git status
   ```
2. Num chat novo com o agente `hwk-archive`, rode `/hwk-archive GPCNLS-10019-limitar-vencimento-intervalo`. Ele confere o aceite, gera o `resumo.md` com "Pontos para o revisor humano" e arquiva.
3. Abra a PR com o `resumo.md` como descrição. Com o número da PR, rode `/hwk-fechar <pasta arquivada> <número>` no mesmo agente.

Um problema do harness que esse caso mostrou: o `aceitar-revisao` deveria recusar texto entre `< >` como motivo. Vou incluir isso junto com as duas correções do limite de rodadas, se você quiser.


-------
Os dois bloqueantes caem em lados opostos da régua.

**Bloqueante 1: `required` no `dtPagamentoParcela`. Provavelmente é real.**

O critério 7 diz que a data não é obrigatória. Se foi o seu diff que colocou o `required`, então deixar a data vazia invalida o formulário e trava o "Simular". Isso é bug introduzido pela mudança: está dentro da régua e não deve ir aceito para a PR. Confirme:

```bash
git diff $(git merge-base HEAD origin/<base>) -- src/app/features/ofertas/ofertas-personalizadas/ofertas-personalizadas.component.html | grep -n "required\|\*"
```

- **Aparece com `+`:** foi a mudança que colocou. Corrija.
- **Não aparece:** já existia antes da mudança. Fica fora da régua e pode ser aceito.

**Bloqueante 2: evidência da 15.4 "sem resultado por cenário e sem apontar para a PR". Está fora da régua.**

É exatamente o que você proibiu. O revisor tirou isso do texto antigo da fatia, que ainda diz "registre na PR". Não corrija nada: esse vai no aceite.

**Os dois `[importante]` são opcionais.** São `OnPush` num componente que só existe dentro do teste e um teste que olha o emitter em vez da saída pública. Ignore os dois.

**Se o `required` veio da mudança**

1. Tire o `required` e o asterisco do rótulo, mantendo os validadores de intervalo. Faça à mão: são duas linhas. Pelo harness seria replanejar, aprovar-spec e implement para um atributo, um custo desproporcional. O custo de fazer à mão é que a correção não aparece como tarefa. Registre no motivo do aceite.
2. Rode os testes e commite. O commit novo invalida o aceite que você já fez, e é o que deve acontecer.
   ```bash
   git commit -am "fix(ofertas): data de pagamento opcional conforme criterio 7" -m "Refs: GPCNLS-10019"
   ```
3. O eixo `spec` continua no limite de rodadas, então libere uma rodada e revise de novo num chat novo do `hwk-review`:
   ```bash
   node .henriworks/bin/hwk.mjs rodada-extra GPCNLS-10019-limitar-vencimento-intervalo spec --por "Henrique Silvério"
   ```
   Depois, `/hwk-review GPCNLS-10019-limitar-vencimento-intervalo`.
4. Se sobrar só o bloqueante da evidência, aceite:
   ```bash
   node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "evidência manual é declaração do dev, sem PR nem print; required removido à mão em <commit> para cumprir o critério 7"
   ```
5. Depois, `/hwk-archive`.

**Se o `required` já existia antes da mudança:** só refaça o aceite com um motivo real e siga para o archive:

```bash
node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "required já existia antes da mudança; evidência manual é declaração do dev, sem PR nem print"
```

**Falha do harness:** o revisor ainda cobrou PR porque a régua não põe "evidência sem print ou PR" na lista de "nunca bloqueante". Ela só aparece como observação no eixo spec, e o texto da fatia falou mais alto. São quatro correções pendentes:

- esta da régua;
- o limite de rodadas contando reprovações da régua antiga;
- os outros eixos pararem quando um bate no limite;
- o `aceitar-revisao` aceitar `<motivo>` literal.

Quer que eu faça as quatro numa entrega só?