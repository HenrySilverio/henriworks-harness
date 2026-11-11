# Moldes de artefatos

Referência de formato. Leia antes de escrever qualquer artefato de `.henriworks/changes/`.

## proposta.md

Um bloco de metadados no topo, logo abaixo do título, e depois quatro seções obrigatórias,
nesta ordem, mais uma opcional ao final.

### Metadados

Quatro linhas obrigatórias antes da primeira seção, mais `Início` quando houver. A regra de
conteúdo está no SKILL.md, seções 5 e 6; aqui está só o formato:

```markdown
Ticket: GPCNLS-10019   (obrigatório; o change-id começa por ele: GPCNLS-10019-<slug>)
Branch: <nome da branch onde a implementação acontece>
Base:   <branch contra a qual a revisão compara o diff>
Rigor:  Lite, ou Full
Início: <hash do commit em que esta mudança começa; opcional, ver seção 5 do SKILL.md>
```

### Seções

| Seção               | Conteúdo                                         | Tamanho              |
| ------------------- | ------------------------------------------------ | -------------------- |
| Intenção            | problema real e para quem                        | duas a quatro frases |
| Escopo              | duas listas: dentro e fora do escopo             | itens observáveis    |
| Restrições          | o que não pode ser feito, transcrito do briefing | uma linha cada       |
| Critérios de aceite | ver formato abaixo                               | um por comportamento |
| Divergências        | opcional; ver formato abaixo                     | duas linhas por item |

A lista de fora do escopo não é opcional. Escopo que não foi negado por escrito volta como
retrabalho na revisão.

Nenhuma das quatro seções obrigatórias fica vazia. Quando não há o que dizer — briefing sem
restrição declarada é o caso comum em Lite — escreva `nenhuma`. Seção vazia é indistinguível
de seção esquecida, e quem revisa não tem como saber qual das duas aconteceu.

A seção de restrições existe porque o briefing costuma declarar limites que não viram
requisito, como o que não pode ser tocado ou o que deve permanecer compatível. Perder essa
informação entre o briefing e o plano é a falha mais cara do fluxo.

Se a mudança não altera comportamento observável, declare isso em uma linha ao final da
intenção. Ausência explícita de delta é informação; ausência implícita é dúvida para o revisor.

Se a mudança conflita com uma decisão vigente em `.henriworks/decisoes/`, declare o identificador na
intenção e diga se a proposta a respeita ou pretende substituí-la. Conflito não declarado é
achado na revisão.

## Critérios de aceite

Cada critério é um item numerado com uma frase normativa usando MUST, SHOULD ou MAY,
seguida de uma a três condições de verificação no formato dado, quando, então.

Um critério descreve comportamento observável. Se você precisou citar nome de classe,
arquivo ou biblioteca, moveu detalhe de implementação para dentro do critério. Corrija —
salvo no caso da subseção abaixo.

Cobertura mínima por critério: um caminho feliz e um caminho de erro. Acrescente condição
de borda sempre que houver limite numérico, temporal ou de permissão.

Sintomas de critério ruim: afirma que algo foi processado corretamente, em vez do resultado
visível; começa direto na ação, sem estado inicial; afirma que um método foi chamado, em
vez da consequência percebida; encadeia vários comportamentos em uma frase, quando deveria
ser mais de um critério.

### Mudança sem alteração de comportamento

Refactor puro não tem comportamento novo para descrever. Aqui, e só aqui, critério
estrutural é legítimo: quais símbolos um artefato exporta, quais imports ele não tem,
onde um teste mora, que o build passa em cada etapa isolada.

A exigência não desaparece, muda de forma — o critério continua tendo que ser
mecanicamente verificável. "A tela renderiza igual" não é critério, porque não diz
contra o quê. "Para a fixture de entrada gravada como linha de base, o resultado é igual,
campo a campo, ao valor esperado commitado junto" é.

A linha de base é gravada contra o código atual e commitada **antes** do primeiro commit da
mudança. Linha de base gerada depois do refactor grava o resultado, não a referência.

Isso a torna pré-requisito do operador, não tarefa do fluxo: nenhuma etapa comita, e a gravação
precisa estar commitada antes que a implementação comece. O plano a declara como linha
`Precondição:` na primeira fatia, e o `hwk-implement` confere antes de despachar qualquer fatia.
Colocá-la como tarefa produziria trabalho que o executor não tem como concluir: ele não comita.

O mecanismo da linha de base segue as instructions de teste do projeto, não uma escolha
livre do plano. Se elas proíbem snapshot automático como única verificação de lógica —
caso comum, porque snapshot aceito às cegas em `git add` não prova nada — a linha de base
é fixture explícita: entrada de builder pequeno, saída esperada escrita à mão, comparada
com `toEqual`. O valor tem que estar legível na revisão.

Critério estrutural que um lint ou um grep de CI consegue verificar deve virar lint ou
grep. Regra em markdown é cobrada em token toda vez que carrega; regra em código custa
zero e ainda pega o humano.

Quando isso valer, a intenção da proposta declara que não há mudança de comportamento
observável, e a mudança não gera deltas.

## Divergências

Opcional. Registra contradição encontrada no planejamento entre um documento de entrada e a
realidade do código — briefing que listou menos chamadores do que existem, molde que impede
escrever um critério verificável, restrição que o código já viola.

Só entra divergência que **mudou** escopo, restrição ou critério. Cada entrada diz qual
documento estava errado, o que a leitura encontrou, e o que foi feito. Duas linhas por
entrada. Divergência que não mudou nada não vem para cá — vira issue ou some. Sem essa
trava a seção vira caderno de anotações e toda proposta engorda.

Existe porque desvio silencioso destrói o valor do fluxo mesmo quando o desvio está certo:
o revisor compara o plano com a entrada, encontra diferença e reprova algo correto.

## design.md

Obrigatório apenas no rigor Full. Três seções `##`, com estes títulos exatos e nesta ordem:
`## Abordagem` em prosa, no máximo uma página; `## Decisões`; e `## Arquivos afetados`, cada
caminho marcado como novo, alterado ou removido.

O título `## Decisões` é literal: é por ele que o validador e o arquivamento localizam o bloco.
Escrito de outro jeito, os portões de decisão não rodam e a promoção não acontece.

Cada decisão registra quatro coisas: a restrição que a forçou, a escolha adotada, as
alternativas descartadas com o motivo de cada uma, e a consequência aceita.

Decisão sem alternativa descartada não é decisão, é narrativa. Se a mudança cria artefato
compartilhado de forma rígida entre camadas, justifique explicitamente ou recuse a
abordagem.

Cada decisão é um subtítulo `###` seguido de três a quatro linhas de campo e depois o texto
das quatro partes:

```markdown
### Idempotência por chave de contrato
Durabilidade: permanente
Capacidades: confirmacao-efetivacao
Substitui: DEC-004
```

`Durabilidade` é `local` ou `permanente` e não tem valor padrão — ausência é erro. Os três
testes que decidem qual dos dois estão no SKILL.md, seção 6. Decisão permanente é promovida
para `.henriworks/decisoes/` no arquivamento e sobrevive à mudança; decisão local vai para o archive
junto com ela.

`Capacidades` é obrigatória em decisão permanente e lista as capacidades de `specs/` que a
decisão afeta, ou `nenhuma`. Ela existe porque o arquivamento copia sem julgar: se o dado não
for escrito aqui, ninguém o produz depois.

`Substitui` só aparece quando a decisão contradiz uma vigente, e só em decisão permanente.

## Fatias: tarefas/NN-<slug>.md

Uma fatia por arquivo, em `tarefas/`, com dois dígitos e slug em kebab-case: `01-cliente-acordo-existente.md`.
A doutrina de fatia vertical está no SKILL.md, seção 7. Aqui está o formato.

```markdown
# 02. Confirmação idempotente na tela
Demonstra: uma segunda confirmação do mesmo contrato mostra o acordo existente.
Bloqueado por: 01
Toca: src/app/feature/renegociacao/confirmacao/, src/app/domain/acordo/acordo.service.ts
Executor: hwk-implementador

## Ponteiros
- proposta.md, critérios 2 e 3
- .henriworks/specs/confirmacao-efetivacao/spec.md, REQ-confirmacao-efetivacao-004
- frame do Figma: <link>, quando o executor é de tela

- [ ] 2.1 Exibir o acordo existente quando a confirmação devolve 200 com acordo
- [ ] 2.2 Teste do componente cobrindo a segunda confirmação
```

Regras do cabeçalho, conferidas por `hwk validar`:

- `Demonstra:` é comportamento observável quando a fatia fechar, nunca estado de camada.
- `Bloqueado por:` lista os números de fatia que precisam fechar antes. A primeira fatia escreve
  `nenhum`. A Verificação escreve `todos`.
- `Toca:` lista, separados por vírgula, as pastas (terminadas em `/`), arquivos ou globs que a fatia
  pode alterar. Declare o mínimo honesto: subdeclarar gera cartão de sobreposição; superdeclarar tira o
  paralelo de quem podia rodar junto.
- `Executor:` é um nome de `.henriworks/executores.json`. Omitido, vale `hwk-implementador`.
- `## Ponteiros` é tudo que o executor lê além da fatia. Ponteiro, não cópia: seção e número, não o
  texto. Executor sem ponteiro lê só a fatia.

Item de checklist, sem exceção: hífen, espaço, `[ ]` ou `[x]`, espaço, número `N.M` em que N é o número
da fatia, espaço, descrição.

### Tarefa manual

Tarefa que código e teste não provam — conferência visual, teste em homologação, aprovação — leva
`(manual)` no fim do texto. Concluída, a linha de baixo traz a evidência: o quê, onde, quem e quando. Sem
ela, o validador recusa o `[x]`.

```markdown
- [x] 3.3 Conferir a tela de parcelas em homologação (manual)
  Evidência: print anexado na task PIX-482, conferido por Ana em 25/10
```

Prefira um teste. A tarefa manual existe para o que não dá para automatizar.

### Trabalho já existente na branch

Commits anteriores ao plano que pertencem à mudança entram como a fatia 01, já concluída:

```markdown
# 01. Trabalho já existente na branch
Demonstra: <o que esse trabalho já entrega>
Bloqueado por: nenhum
Toca: <pastas que esse trabalho alterou>
- [x] 1.1 <o que foi feito>
  Evidência: commit a1b2c3d
```

### Verificação

A última fatia, e só ela, não tem `Demonstra:` nem `Toca:`, declara `Bloqueado por: todos` e declara
`Escopo:` com as camadas de `.henriworks/verificacao.json` que a mudança toca:

```markdown
# 05. Verificação
Bloqueado por: todos
Escopo: domain, feature

- [ ] 5.1 `node .henriworks/bin/verificar.mjs adicionar-idempotencia-confirmacao` sem achado BLOQUEANTE
- [ ] 5.2 Cada critério de aceite mapeado para ao menos um teste
```

Lint e teste do projeto inteiro não entram: reprovam por erro que a mudança não criou.

### Índice

`tarefas/index.md` é gerado por `node .henriworks/bin/hwk.mjs fatias <id> --gravar`, a partir das
fatias. Não escreva à mão: duas fontes para o mesmo grafo divergem.

### Regras

- Uma tarefa é concluível em uma sessão. Uma fatia também. Se não cabe, a fatia está grossa: corte
  mais fino, não escreva mais tarefas.
- Toda tarefa tem critério observável. "Ajustar o serviço" não é tarefa.
- Todo critério de aceite aparece em ao menos uma fatia.
- Mudança que não cabe em poucas fatias são duas mudanças: declare a linha de corte e planeje a primeira.

## briefing.md

Cópia literal do arquivo de briefing informado na invocação do `hwk-plan`, sem edição,
sem resumo e sem reformatação. Existe para que o archive guarde o pedido original ao lado
do acordo.

Não é fonte de verdade para nenhuma etapa posterior. Se algo do briefing importa para a
implementação, esse algo tinha que ter virado restrição ou critério na proposta.

## deltas.md

Formato definido em `specs-e-deltas.md`. Só existe quando a mudança altera comportamento
observável.

## resumo.md

Escrito pelo `hwk-archive` antes de mover a pasta. É a **descrição da pull request**: vai para a PR, para
a task do Jira e, se houver, para o Confluence. Quem lê não conhece o fluxo e não vê `.henriworks/`.

```markdown
## <tipo>(<escopo>): <o que muda, no imperativo>

**Ticket:** <Ticket>

### Contexto
<o problema em duas ou três frases: quem era afetado, o que acontecia, por que importa>

### O que mudou
- <cada mudança de comportamento ou de estrutura, pelo efeito, não pelo arquivo>

### Como testar
1. <passo a passo para ver a mudança funcionando, como um revisor ou QA faria>
2. <resultado esperado em cada cenário relevante, inclusive os de erro>

### Risco do merge
- Porta: <mão dupla, se reverter o commit desfaz tudo; mão única, se há migração, dado gravado,
  contrato publicado ou efeito fora do repositório, e o que muda para reverter>
- Raio de impacto: <quem chama o que mudou, pelo mapa: telas, serviços, consumidores do endpoint>

### Decisões técnicas
- <cada escolha que um revisor questionaria, com o porquê e a alternativa descartada>
- ou: nenhuma decisão fora do padrão do projeto

### Fora do escopo
- <o que ficou de fora de propósito>

### Pontos para o revisor humano
- <cada cartão de sobreposição em aberto: arquivo e o que ficou para decidir>
- ou: nenhum

### Testes
- <testes criados ou alterados, pelo que cobrem>
- Lint, tipos e testes das áreas alteradas sem erro novo; <N> erro(s) que já existiam e não foram tocados

### Arquivos
<o resumo do diff --stat, agrupado por pasta quando passar de oito arquivos>
```

Regras: toda linha vem de um artefato da mudança, do Git ou do mapa, nada da memória da conversa. O
título usa o padrão de assunto de commit. Nenhuma menção a change, change-id, fatia, tarefa, critério de
aceite, delta, spec, `DEC-`, `REQ-`, veredito, agente ou caminho de `.henriworks/`: o archive recusa. Fontes:
o briefing para o Contexto; a proposta para O que mudou, Fora do escopo e Como testar; o design para
Decisões técnicas; `henrimap affected` sobre os arquivos do diff para o Raio de impacto; o diff e o
verificador para Testes e Arquivos; `tarefas/sobreposicoes.md` para os Pontos. Seção sem conteúdo sai
com a frase de "ou", nunca omitida.
