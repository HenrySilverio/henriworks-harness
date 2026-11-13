Não: a revisão não é a cada fatia. Ela pediu revisão por causa de um defeito meu no cálculo de "a spec mudou?". Também tem razão sobre as imagens: anexadas no chat, elas não servem como evidência.

## O fluxo certo

| Revisão | Quando | Quantas vezes |
| --- | --- | --- |
| Da **spec** | depois do plano, antes de implementar; você aprova com `aprovar-spec` | uma |
| Do **código** | no fim, depois da última fatia (a de Verificação) | uma |
| Entre fatias | não existe | nenhuma |

## O que aconteceu

O `aprovar-spec` grava um "hash" (uma impressão digital) da spec. O `hwk estado` recalcula e compara. Se mudou, ele entende que alguém alterou o acordo e pede nova revisão.

Marcar `[x]` e escrever a evidência não deveriam contar como mudança. Mas a minha conta ainda deixava uma linha vazia no lugar da evidência. Na tarefa 3.5, isso mudou o hash, e o estado pediu revisão da spec no meio da implementação.

Pior: o revisor recebeu a fatia com a sua evidência e julgou a evidência como se fosse spec. Daí veio o "bloqueante" das capturas, que não deveria existir.

## Correção no zip novo (36 de 36 no teste de fumaça)

- **Hash:** checkbox e todo o bloco de evidência (a linha `Evidência:` e as linhas de continuação) saem do cálculo, como se nunca tivessem sido escritos. O teste novo usa evidência em duas linhas e arquivo com quebra de linha do Windows.
- **Aprovações antigas:** continuam valendo pelo modo de compatibilidade.
- **Revisor da spec:** o pacote diz que checkbox e evidência são registro de execução, fora da revisão.
- **Tarefa manual:** a evidência fica em uma linha, por exemplo `Evidência: conferido por Henrique Silvério em 13/11/2026, localhost com mock, faixa 13/11 a 19/12; capturas na PR`.
- **Capturas de tela:** vão na **descrição da PR**. O `resumo.md` ganhou a seção "Evidências manuais", onde você as anexa. É ali que o revisor e o QA veem, e ali elas ficam.
- **`hwk-implement`:** não pede mais para anexar imagem no chat como evidência. Se o estado pedir revisão depois de marcar uma tarefa, ele mostra e para, sem mandar você revisar.
- O README tem a seção "Revisões: duas, não uma por fatia" e uma linha em "Solução de problemas".

## O que fazer agora, nessa mudança

```powershell
node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .
node .henriworks\bin\hwk.mjs estado
```

- **O estado mostra `implement`, com a fatia 04 na frontier:** siga para a 04 no `hwk-implement` e, no fim, a revisão de código. Não precisa refazer a revisão da spec.
- **Ainda mostra `revisao-spec`:** o agente provavelmente mexeu em algo além da evidência. Abra `tarefas/03-calendario-restrito.md` e confira:
  - **Se só a 3.5 e a linha de evidência mudaram:** aprove uma vez, registrando o motivo:
    ```powershell
    node .henriworks\bin\hwk.mjs aprovar-spec GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "só a evidência da 3.5 mudou o hash (pacote antigo)"
    ```
  - **Se o texto da tarefa mudou:** aí a revisão da spec faz sentido.

O achado `[importante]` da última revisão, sobre limites ausentes ou invertidos, continua opcional: aceite, anote ou ignore. Ele não bloqueia.