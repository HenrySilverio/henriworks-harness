# Eixos de revisão

Referência do `hwk-review` e dos peixinhos `hwk-gf-*`. Leia apenas nessas fases.

## Por que isolado

O autor de um documento não vê a suposição que não escreveu: para ele, ela é óbvia. Um revisor sem a
conversa tropeça exatamente nela. Por isso cada estágio e cada eixo roda num subagente novo, com um
pacote gerado por script, e nenhum vê o veredito do outro.

Isolamento é verificado, não presumido: `hwk canario` prova, na máquina, que a conversa do pai não chega
ao subagente. Enquanto o canário não passar, trate a revisão como mais fraca e diga isso no relatório.

## Severidade e veredito

Todo achado tem uma severidade e uma evidência:

```
[bloqueante|importante|sugestão] <arquivo>:<linha ou seção> — o que está errado — o caso concreto — a menor correção
```

- **bloqueante**: com isso, o próximo passo produz o erro. Critério que não dá para testar, fatia que deixa
  decisão para o executor, bug, falha de segurança, perda de dado, critério sem cobertura.
- **importante**: deveria mudar, mas não impede o próximo passo.
- **sugestão**: melhora; ignore sem culpa.

Achado sem caso concreto não entra: "esta entrada leva a este resultado errado". Nada de "considere", gosto
de estilo ou preocupação vaga. Não elogie, não suavize, não peça desculpa. Comece pelo que está errado.

Veredito por estágio ou eixo, nunca consolidado: **REPROVADO** se houver ao menos um bloqueante;
**APROVADO** caso contrário. "Aprovado com ressalvas" é reprovado com educação.

Primeira linha do veredito: `# <rótulo> - APROVADO` ou `# <rótulo> - REPROVADO`. Rótulo da spec:
`spec-<estágio>`; do código: o nome do eixo. Segunda linha: `Spec revisada: <hash>` ou
`Commit revisado: <HEAD>`, exatamente como o pacote pediu. Terceira: `Achados: <n>`. Depois, os achados em
ordem de severidade.

## Revisão da spec

Lite: `design` (com a lente de zoom-out), depois `prontidao`. Full: `zoom-out`, `compreensao`, `design`,
`zoom-out-2`, `prontidao`, nesta ordem. Estruturação e estilo não são estágio: formato é portão do
`hwk validar`, e o validador já rodou.

| Estágio | Persona | Pergunta |
| --- | --- | --- |
| `zoom-out` | `hwk-gf-zoom-out` | precisa existir? há algo mais simples, ou já existente, que resolve? |
| `compreensao` | `hwk-gf-compreensao` | alguém sem contexto entende o que e por quê, sem perguntar? |
| `design` | `hwk-gf-design` | onde isso quebra: risco, carga, custo, acoplamento, contrato entre camadas |
| `zoom-out-2` | `hwk-gf-zoom-out` | depois dos ajustes, a solução cresceu além do problema? |
| `prontidao` | `hwk-gf-prontidao` | cada fatia executa sem decisão pendente, num contexto novo, só com os ponteiros? |

O veredito da spec é amarrado ao **hash da spec** (proposta, design, deltas e texto das fatias, sem as
marcas de checklist). Spec alterada depois da revisão invalida o veredito daquela versão; quem decide se
revisa de novo é o humano, na aprovação.

**Aprovação.** O portão é humano: `node .henriworks/bin/hwk.mjs aprovar-spec <id> --por "<nome>"`. Com
estágio REPROVADO ou faltando, o comando recusa, a não ser com `--apesar "<motivo>"`, que fica registrado.
O agente nunca roda esse comando por conta própria: ele mostra o resultado e pede a decisão.

**Resolução.** Achado aceito vira edição da spec pelo `hwk-plan`, com `replanejar:`, que registra em
`## Divergências` o que mudou e por quê. Achado rejeitado fica no veredito, com o motivo dito pelo dev na
aprovação.

## Revisão de código

Três eixos, três peixinhos, três vereditos. Código pode cumprir a proposta e violar todo padrão do
repositório, ou seguir todo padrão e implementar outra coisa, ou cumprir os dois e quebrar um chamador
fora do diff. As três falhas são independentes.

Antes dos pacotes, o orquestrador roda `node .henriworks/bin/verificar.mjs <id> --salvar`: a saída vai
para `revisao/verificacao-<HEAD>.txt` e é a única fonte de lint, tipos e testes. Nenhum peixinho roda
ferramenta nem reclassifica a saída.

### Eixo spec (`hwk-gf-spec`)

Lê a proposta, as fatias, os deltas, o design, o diff e a verificação.

- Critério de aceite: coberto, coberto parcialmente ou não coberto. Coberto por código sem teste é parcial.
- Tarefa `[x]` precisa de evidência no diff (arquivo alterado) ou de comando. Tarefa `(manual)` tem como
  evidência a linha `Evidência:`: aceite a declaração, aponte só se faltar o quê, onde, quem e quando.
  Tarefa de `Trabalho já existente na branch` tem como evidência um commit entre `Início` e HEAD.
- Toda fatia fechada, exceto a Verificação, demonstra a própria linha `Demonstra:` no código.
- Deltas nas duas direções: todo critério de comportamento novo tem delta; todo delta tem critério. Delta
  que descreve intenção em vez de texto final reprova.
- Decisão permanente com as quatro partes e `Capacidades`; nenhuma contradiz vigente sem `Substitui:`; a
  classificação local ou permanente resiste aos três testes.
- Cartão de sobreposição em aberto: aponte como importante, com o arquivo.

Reprova com: critério não coberto ou sem teste; tarefa sem evidência; fatia que não demonstra; escopo
além da proposta; restrição violada; achado em delta ou decisão; BLOQUEANTE na verificação.

### Eixo padrões (`hwk-gf-padroes`)

Não lê a proposta, de propósito: sem ela, não há como racionalizar uma violação como "necessária para o
critério 3". Lê o diff, `.henriworks/padroes.md`, as instructions cujo `applyTo` casa com o diff (o pacote
já lista só essas) e a verificação.

- Julga o diff, não o arquivo. Violação em linha que a mudança não alterou é pré-existente: não reprova e
  não entra como achado.
- `.henriworks/padroes.md` marca com `[grave]` a regra cuja violação isolada já reprova. Regra sem marca
  reprova com mais de um achado do mesmo assunto. Regra de instruction segue a condição geral.
- Sem padrão escrito, use o baseline abaixo e declare que o repositório não tem padrão: isso é achado
  importante, e o baseline sozinho nunca reprova.
- Achado que um lint, type check ou grep de CI pegaria entra também como recomendação de promoção a lint.

Baseline: função que só se entende lendo inteira; lógica duplicada no diff ou com vizinho evidente;
parâmetro booleano que liga dois comportamentos; condicional aninhada que é regra de negócio sem nome;
dado exposto entre camadas no formato interno de quem produz; artefato compartilhado de forma rígida entre
camadas criado sem justificativa; erro engolido; valor mágico repetido; nome de mecanismo em vez de
propósito; teste que afirma chamada em vez de consequência.

### Eixo plantão (`hwk-gf-plantao`)

O sênior que vai ser acordado quando quebrar. Lê o diff, o raio de impacto do mapa e a verificação, e o
código que o diff toca: chamadores de cada função alterada, o que ela chama, os testes.

Na ordem: correto, seguro, aguenta a carga real, testado, rápido, enxuto.

1. **Bug**: resultado errado, caso de borda (vazio, zero, último item, arredondamento, fuso), chamador
   quebrado por mudança de assinatura ou retorno, correção feita num chamador com a função compartilhada
   ainda quebrada.
2. **Risco**: injeção, segredo, entrada de usuário sem validação na fronteira, erro engolido, escrita fora
   de ordem, perda de dado.
3. **Carga**: certo para um usuário, errado para muitos: verificar-e-gravar com corrida, consulta por item,
   lista que só cresce, estado por processo que precisava ser compartilhado. Diga que carga você assumiu.
4. **Teste faltando**: lógica arriscada nova (ramo, parser, dinheiro, segurança, escrita, correção de bug)
   sem um teste que falhe quando ela quebrar. Um bom teste, não cobertura.
5. **Lentidão** relevante. Ganho pequeno é sugestão.
6. **Enxuto**: código que não precisava existir; helper que o repositório já tem (diga o caminho);
   biblioteca padrão ou recurso nativo que já resolve; abstração com uma implementação; cópia que precisa
   mudar junto.

Comentário `shortcut: <limite>, <quando subir>` é decisão registrada, não achado, a não ser que a carga
esperada já passe do limite. Proponha a menor correção; prefira a que apaga código. Nunca proponha camada,
framework ou configuração que o problema não pede.

Reprova com: bug, falha de segurança, perda de dado, quebra na carga esperada, lógica arriscada sem teste.

## O registro do veredito

O peixinho devolve o texto. O orquestrador grava a resposta, sem editar, em
`.henriworks/changes/<id>/rascunhos/<alvo>.md` e roda:

```
node .henriworks/bin/hwk.mjs gravar-veredito <id> <alvo> --de .henriworks/changes/<id>/rascunhos/<alvo>.md
```

O script confere a primeira linha e o hash ou o HEAD, recusa árvore suja na revisão de código, acrescenta
os arquivos locais revisados com o hash de cada um, e grava `revisao/<eixo>-<HEAD>.md` ou
`revisao-spec/<estágio>-<hash>.md`. Nunca sobrescreve: revisão repetida na mesma versão vira `-2`, `-3`, e
vale o de maior número.

O archive exige os três eixos de código APROVADO no HEAD atual. Aprovar, seguir codando e arquivar não
passa: o HEAD mudou.
