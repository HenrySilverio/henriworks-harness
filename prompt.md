**Diagnóstico:** o replanejamento não resolve porque o problema não está no plano, e sim na forma como o verificador classifica a falha.

**Por que cai sempre no mesmo lugar**

- O `verificar.mjs` só chama uma falha de teste de PRÉ-EXISTENTE se existir um `baseline.json`, gravado na base antes do primeiro commit da mudança. Sem esse arquivo, toda falha de teste conta como BLOQUEANTE, porque não há como provar que ela é antiga.
- A sua mudança provavelmente está sem baseline. Na hora de gravar, a branch já tinha commits da tentativa que você descartou, e nesse caso o subcomando se recusa a gravar.
- Resultado: qualquer teste antigo quebrado num arquivo que a mudança toque vira bloqueante. Aqui foi o `ofertas.component.spec.ts`, porque a fatia 13 tirou um `console.log` dele.

Confira com:

```powershell
Test-Path .henriworks\changes\GPCNLS-10019-limitar-vencimento-intervalo\baseline.json
```

**Atenção a uma ambiguidade:** quando o agente escreveu "teste preexistente", isso quer dizer que o teste já existia. Não quer dizer que a falha já existia. Ninguém verificou isso ainda, e é a primeira coisa a descobrir.

**O que fazer**

1. Revise o diff da fatia 13 e commite. As duas falhas não vêm dela: os testes novos passaram, e o arquivo antigo só perdeu um log.
2. Rode o teste que falha no commit da base. O `.henriworks/` não é versionado, então continua no lugar quando você troca de commit:
   ```powershell
   $mb = git merge-base HEAD origin/<Base da proposta>
   git switch --detach $mb
   npx jest src/app/features/ofertas/ofertas.component.spec.ts   # ou o comando de teste do seu verificacao.json
   ```

**Caso A: o teste também falha na base.** Então a falha já existia. Ainda no commit da base, grave o baseline e volte para a branch:

```powershell
node .henriworks\bin\verificar.mjs baseline GPCNLS-10019-limitar-vencimento-intervalo
git switch -
node .henriworks\bin\verificar.mjs GPCNLS-10019-limitar-vencimento-intervalo --salvar
```

Isso não é contornar a guarda. A guarda existe para impedir um baseline gravado com código da mudança dentro, e no commit da base esse código não está. As duas falhas passam a aparecer como PRÉ-EXISTENTE, e isso vale para o resto da mudança. Deixe registrado no `resumo.md`, em "Pontos para o revisor humano", que esse teste já falhava na base.

**Caso B: o teste passa na base.** Então foi a sua mudança que quebrou, e é um bloqueante de verdade. Volte para a branch com `git switch -`. O provável: o botão da linha 271 agora depende da nova regra de intervalo de vencimento, e a data do teste ficou fora do limite. A decisão é sua:

- **O comportamento novo é o esperado:** a fixture do teste está desatualizada, e corrigir faz parte da mudança.
- **Não é o esperado:** é bug no componente.

Nos dois casos, a correção vira uma tarefa na fatia que mudou o componente, ou na própria 13, que já tem esse arquivo no `Toca:`. Não crie uma fatia nova. Com o pacote atualizado, uma tarefa a mais não reabre a revisão inteira: os estágios que já aprovaram não rodam de novo, e basta rodar o `aprovar-spec` outra vez.

Não aceite `xit`, `skip` nem comentar o teste. Isso apaga o sinal.

**Falha do harness, que eu corrigiria:**

- Hoje o verificador marca a falha como "sem-baseline" internamente, mas a saída não diz isso, nem diz como resolver.
- O certo é ele imprimir que não há baseline e mostrar a receita acima.
- Além disso, o `hwk-implement` deveria parar logo no início quando o baseline for recusado, e não seguir sem avisar.

Quer que eu inclua isso no pacote?