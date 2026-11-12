Atualizei o item 1 com o campo. Confira só uma coisa antes de enviar: você escreveu `dataMaximaVenvimentoPrimeiraParcela`, com "Ven**v**imento", e o mínimo é `dataMinimaVen**c**imentoPrimeiraParcela`. Se o contrato tiver mesmo esse erro de digitação, ele precisa ficar igual na spec, senão o executor vai procurar um campo que não existe. Para não depender da sua digitação, o prompt manda o agente copiar a grafia exata do contrato.

```text
/hwk-plan replanejar: GPCNLS-10019-limitar-vencimento-primeira-parcela

Achados aceitos da revisão da spec. Mude só o que está abaixo.

1. [bloqueante] Limite máximo sem campo e sem origem (proposta.md, critérios 1 e 3; design.md, Abordagem).
   - Os dois limites vêm do mesmo response:
     mínimo = dataMinimaVencimentoPrimeiraParcela
     máximo = dataMaximaVenvimentoPrimeiraParcela
   - Confirme no contrato ou no tipo do response a grafia exata dos dois campos (o do máximo pode estar
     escrito "Venvimento") e use na spec exatamente como está lá. Consulte o mapa antes de buscar:
     node .henriworks/bin/henrimap.mjs query "dataMaximaVen"
   - Na proposta e no design, nomeie os dois campos e o response de origem, e diga que a faixa permitida
     é de dataMinima até dataMaxima, inclusive nas duas pontas.
   - Se um dos campos não existir no contrato, não invente: pare e me pergunte.

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

Ainda falta escolher A ou B no item 2 e apagar a outra antes de enviar.

Eu assumi que as duas pontas da faixa são permitidas, ou seja, que o gerente pode escolher a própria data mínima e a própria data máxima. Se o ticket disser outra coisa, troque essa frase antes de enviar. É exatamente o tipo de detalhe que o estágio de compreensão costuma reprovar.

O resto não muda: depois do replanejamento, rode `/hwk-review spec` num chat novo e, com tudo aprovado, rode você mesmo o `aprovar-spec` no terminal.