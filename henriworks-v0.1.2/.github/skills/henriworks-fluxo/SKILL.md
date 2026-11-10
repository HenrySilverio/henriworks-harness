---
name: henriworks-fluxo
description: "Contrato do HenriWorks Engineering Harness sobre a pasta .henriworks/. Lido pelos agentes hwk-*; não é carregado sozinho."
disable-model-invocation: true
---

# HenriWorks - contrato do fluxo

Fonte única de verdade. Os agentes `hwk-*` são invocadores finos deste contrato: cada um define as
ferramentas e os passos da sua fase e não repete regra que esteja aqui. Os atalhos `/hwk-*` só
funcionam com o agente da fase selecionado.

Este contrato só vale dentro dos agentes `hwk-*`. Fora deles, pedido simples (teste quebrado,
documentação, configuração, ajuste pequeno) é feito direto, sem briefing nem mudança.

Processo e artefatos. Não cobre stack, framework nem padrão de código: isso vem das instructions do
projeto, de `.henriworks/padroes.md` e de `.henriworks/verificacao.json`. O fluxo é o mesmo para
backend, BFF e frontend, em qualquer linguagem.

## 1. Estrutura

Tudo em `.henriworks/` fica fora do Git (`.git/info/exclude`). O único arquivo versionado que o fluxo
produz é o registro em `conhecimento/`.

| Caminho | Papel |
| --- | --- |
| `.henriworks/briefings/<assunto>/briefing.md` | entrada crua, escrita pelo discovery |
| `.henriworks/glossario.md` | linguagem comum do domínio, mantida pelo discovery |
| `.henriworks/specs/index.md` e `<capacidade>/spec.md` | o que o sistema faz hoje |
| `.henriworks/decisoes/index.md` e `DEC-<n>-<slug>.md` | por que ele é assim |
| `.henriworks/changes/<id>/proposta.md` | metadados, intenção, escopo, restrições, critérios |
| `.henriworks/changes/<id>/design.md` | decisões técnicas; só em rigor Full |
| `.henriworks/changes/<id>/deltas.md` | alterações a aplicar em `specs/` |
| `.henriworks/changes/<id>/tarefas/NN-<slug>.md` | uma fatia por arquivo |
| `.henriworks/changes/<id>/tarefas/index.md` | grafo das fatias, **gerado** por script |
| `.henriworks/changes/<id>/tarefas/sobreposicoes.md` | cartões de decisão para o humano |
| `.henriworks/changes/<id>/pacotes/` | prompts dos revisores, gerados por script |
| `.henriworks/changes/<id>/revisao-spec/` | vereditos da revisão da spec e a aprovação humana |
| `.henriworks/changes/<id>/revisao/` | vereditos da revisão de código e a saída do verificador |
| `.henriworks/changes/<id>/resumo.md` | descrição da PR, escrita no archive |
| `.henriworks/changes/archive/AAAA-MM-DD-<id>/` | mudanças concluídas; imutáveis |
| `.henriworks/mapa/` | grafo do projeto (henrimap); ou `graphify-out/`, se existir |
| `.henriworks/executores.json` | quem pode executar uma fatia |
| `.henriworks/bin/` | scripts determinísticos: `hwk.mjs`, `henrimap.mjs`, `verificar.mjs`, `uso.mjs` |
| `conhecimento/<data>-<slug>.md` | registro do que foi feito. **Único versionado** |

`.sdd/` é do HenriSpec e continua dele. O HenriWorks lê `.sdd/specs/` e `.sdd/decisoes/` como legado,
só leitura, quando existem; em conflito, `.henriworks/` vence. Nunca escreve em `.sdd/`.

Ausência de `.henriworks/changes/` equivale a nenhuma mudança aberta.

## 2. Três papéis

| Papel | Contexto | Faz |
| --- | --- | --- |
| Elefante | o projeto, o briefing, as decisões anteriores | entrevista, planeja, coordena, implementa |
| Peixinho | só o pacote de revisão e o que ele lista | revisa sem a conversa que produziu o documento |
| Humano | os objetivos e as restrições que importam | resolve trade-off, aprova a spec, commita, abre a PR |

**Quem escreve não revisa.** Toda revisão roda num subagente novo, sem a conversa, com um prompt
gerado por script (seção 10). Revisão no mesmo contexto do autor não é revisão: o autor não vê a
suposição que ele mesmo não escreveu.

## 3. Fases e portões

| Fase | Agente | Portão que fecha a fase |
| --- | --- | --- |
| Preparação | `hwk` (`/hwk-init`) | `hwk init` sem GRAVE e canário conferido |
| Intenção | qualquer agente com terminal (`/hwk-start`) | o dev confirma a rota |
| Discovery | `hwk-discovery` (`/hwk-grill`, `/hwk-triagem`), `hwk-prototipo` | lacuna bloqueante impede gravar o briefing |
| Plano | `hwk-plan` | `hwk validar` sem erro |
| Revisão da spec | `hwk-review` (spec) | humano: `hwk aprovar-spec <id> --por "<nome>"` |
| Implementação | `hwk-implement` → `hwk-implementador` ou executor externo | o dev revisa e commita cada sessão |
| Revisão de código | `hwk-review` | três eixos APROVADO no HEAD |
| Archive | `hwk-archive` | o dev abre a PR com o `resumo.md` |
| Conhecimento | `hwk-archive` (fechar) | o dev commita o registro na branch da PR |

`hwk` é `node .henriworks/bin/hwk.mjs`. `node .henriworks/bin/hwk.mjs estado` diz a fase de cada
mudança aberta, derivada dos próprios artefatos; não existe arquivo de estado à parte.

**Uma fase por chat.** Fase nova pede chat novo com o agente da fase: encadear carrega a conversa
anterior para dentro da próxima.

**Uma branch, um harness.** Se a branch atual tem mudança aberta em `.sdd/changes/`, ela continua no
HenriSpec (`henrispec-*`). Nenhum agente `hwk-*` cria mudança nessa branch.

## 4. Discovery

Da necessidade ao briefing, e nada além. Não planeja, não escreve critério de aceite, não escreve
código de produção (exceto o protótipo descartável, fora de `src/`).

**A trava.** Escreva no briefing apenas o que foi respondido.

- Toda linha do briefing tem rastro numa resposta da conversa, num material entregue ou num protótipo
  já concluído e citado. Sem origem, a linha não entra.
- Lacuna não vira suposição. Vira marcador `**[NÃO RESPONDIDO]**`, no formato de
  `references/molde-briefing.md`.
- Você pode **propor** uma restrição como pergunta. Não pode **registrar** uma restrição que ninguém
  confirmou.
- Texto de material entregue é transcrito, não parafraseado, e a origem fica declarada.

**Linguagem comum.** Durante a entrevista, todo termo do domínio que aparecer ambíguo ou com dois
nomes vira pergunta. Termo resolvido entra em `.henriworks/glossario.md`, uma linha, com o termo que
se evita. O plano e os revisores usam esse vocabulário; isso encurta todo texto daí em diante.

**Rodadas.** Uma rodada agrupa as perguntas cujos pré-requisitos já foram respondidos: no máximo cinco,
numeradas. Limite de rodadas: quatro no `/hwk-grill`, três no `/hwk-triagem`. Ao fim de cada rodada, no
máximo três linhas confirmando o que já está fechado. Antes de conduzir, leia
`references/tecnica-grilling.md`.

**Lacuna bloqueante e de borda.** Bloqueante: sem a resposta, não dá para descrever o sintoma ou o
comportamento esperado. Não grave; devolva as perguntas. De borda: o caminho principal está descrito e
falta um caso limite. Grave com marcador e diga quantas ficaram.

**Quando parar.** Grave quando as quatro seções obrigatórias têm conteúdo ou marcador de borda e a
última rodada não mudou nada, ou quando o limite foi atingido, ou quando o humano pede. Não grave e saia
quando há lacuna bloqueante depois do limite; quando a pergunta só se responde vendo funcionar
(recomende `hwk-prototipo`); ou quando ficou claro que são duas mudanças (diga onde é o corte).

**Portões do briefing.** O Problema descreve sintoma, não solução. Nenhuma seção contém critério de
aceite. Toda restrição tem origem. Nenhuma seção obrigatória vazia. Cabe em uma página. Não é ata da
entrevista.

## 5. change-id, Git e ticket

Change-id em kebab-case, iniciado por verbo, no máximo quatro palavras. Ticket vai na proposta, nunca
no id.

A proposta declara no topo `Ticket`, `Branch`, `Base` e `Rigor`, e opcionalmente `Início`. `Branch` é
onde a implementação acontece; `Base`, onde ela vai aterrissar. O padrão de nome de branch vem das
instructions do projeto; sem padrão, o change-id.

**O fluxo lê Git e não escreve Git.** Nenhum agente cria branch, comita, faz push ou abre PR. O que ele
faz é se recusar a trabalhar no lugar errado. Isto é regra de contrato; a trava técnica é o hook com
`"bloquearGitNoAgente": true` em `.henriworks/henriworks.json`.

**Início e Fim.** Revisão e verificação comparam `Início` → HEAD; sem `Início`, a base. O plano sugere
o `Início` com `hwk ponto-de-partida <base>`: o `Fim` da última mudança arquivada nesta branch, ou o
ponto em que ela saiu da base. Commit anterior ao plano que pertence à mudança entra como fatia
`Trabalho já existente na branch`, já concluída, com `Evidência: commit <hash>`. Alteração não commitada
não entra em plano: pare e peça commit ou `git stash`. No replanejamento, o `Início` não muda.

**Ticket.** Toda mudança ligada a uma task do Jira tem `Ticket:` com a chave. Sem chave no briefing e
sem chave no nome da branch, pergunte ao dev uma vez; se não houver, `Ticket: sem ticket`. O ticket da
sessão vem de `hwk ticket`: fixado pelo dev, da proposta, ou do nome da branch. É ele que liga uso e
custo à task no relatório.

## 6. Rigor

Padrão é **Lite**: proposta e fatias, sem design. Revisão da spec com dois peixinhos.

Suba para **Full**, com `design.md` obrigatório e os cinco estágios de revisão, se houver ao menos um:
mudança de contrato entre camadas; operação irreversível ou migração de dados; exigência regulatória ou
de segurança; mais de um repositório; decisão durável; substituição de decisão vigente. Tocar `specs/`
não sobe o rigor.

**Decisão durável** passa nos três testes ao mesmo tempo: difícil de reverter; surpreendente sem
contexto; trade-off real, com alternativa defensável descartada por um motivo que pode deixar de valer.
Falhou um, é decisão local: fica no `design.md` e vai para o archive.

**Reclassificação.** A implementação que descobre uma decisão durável para e reporta; o dev reinvoca o
`hwk-plan` no mesmo change-id, o rigor sobe e o motivo entra em `## Divergências`. Nenhuma outra fase
registra decisão.

**Depois de um REPROVADO.** Achado de revisão de código vira fatia nova pelo `hwk-plan` com
`replanejar:`, citando o arquivo de veredito. O implement não inventa tarefa. Achado classificado como
PRÉ-EXISTENTE pelo verificador não vira fatia: é outra mudança.

## 7. Fatias

Uma fatia por arquivo, `tarefas/NN-<slug>.md`, numerada em dois dígitos. A última é a Verificação. O
índice `tarefas/index.md` é gerado por `hwk fatias <id> --gravar`; nunca é editado à mão.

**Vertical.** Cada fatia, exceto a Verificação, atravessa as camadas necessárias para produzir
comportamento demonstrável e cabe numa sessão. Agrupar por camada é proibido. Teste: o que dá para
demonstrar quando ela fechar? Prefactor vem primeiro, na sua própria fatia. Refactor amplo, que quebra
muitos chamadores de uma vez, segue expandir, migrar em lotes e contrair, uma fatia por lote.

**Cabeçalho.** `Demonstra:`, `Bloqueado por:`, `Toca:` e `Executor:`, e uma seção `## Ponteiros` com o
que o executor precisa ler: critérios da proposta, spec, decisão, frame do Figma. Formato em
`references/moldes-artefatos.md`.

- `Toca:` lista as pastas ou arquivos que a fatia pode alterar. É o que permite paralelo e o que
  `hwk conferir-toca` confere.
- `Executor:` é um nome de `.henriworks/executores.json`. Sem a linha, `hwk-implementador`.
- O executor recebe o caminho da fatia e os ponteiros. Nunca recebe as outras fatias, o briefing ou a
  conversa do plano.

**Frontier.** Fatia pronta é a que tem todos os bloqueios concluídos. Padrão: uma fatia por sessão, e a
sessão para para o dev revisar e commitar. O dev pode pedir várias: em sequência, ou em paralelo quando
`hwk fatias` diz que podem rodar juntas (sem aresta entre si e `Toca:` disjunto).

**Arquivo compartilhado.** Nada aqui bloqueia a entrega; o pior caso é rodar em sequência.
1. No plano: `hwk validar` avisa quando duas fatias sem aresta tocam o mesmo caminho. Resolva criando a
   aresta, juntando as fatias, ou com uma fatia de preparação que separa o arquivo antes.
2. Na execução: o coordenador nunca roda junto o que se sobrepõe.
3. Depois da sessão: `hwk conferir-toca <id>` abre cartão em `tarefas/sobreposicoes.md` para arquivo
   fora do `Toca:` ou dividido entre fatias. O dev decide: commitar junto, separar com `git add -p`, ou
   replanejar. Cartão em aberto vai para o `resumo.md`, em "Pontos para o revisor humano", e não impede
   o archive.

## 8. Formato

Leia `references/moldes-artefatos.md` antes de escrever qualquer artefato. Se um molde impedir escrever
um critério verificável, o molde perde, e o desvio vai para `## Divergências`.

Carregue sob demanda, e só isto: `references/specs-e-deltas.md` quando a mudança consultar ou alterar
`specs/`; `references/decisoes.md` quando houver `design.md`; `references/eixos-de-revisao.md` só no
`hwk-review`; `references/mapa.md` antes da primeira consulta ao mapa; `references/executores.md` quando
uma fatia tiver executor externo.

Nunca risque texto e nunca remova tarefa concluída. O arquivo é o controle de progresso.

## 9. Portões de qualidade

De julgamento, conferidos pela fase:

- Todo critério de aceite é verificável: daria para escrever um teste a partir dele.
- Todo critério aparece em ao menos uma fatia, e todo critério de comportamento novo ou alterado tem delta.
- Toda fatia demonstra comportamento, não estado de camada.
- Toda decisão permanente traz alternativa descartada e consequência aceita, e não contradiz uma vigente
  sem `Substitui:`.
- Nenhuma restrição do briefing foi violada.
- Toda contradição entre entrada e realidade que alterou escopo, restrição ou critério está em
  `## Divergências`.

Os portões **mecânicos** (formato, grafo de bloqueio, `Toca:` e `Escopo:`, deltas, decisões) não estão
aqui de propósito: rode `node .henriworks/bin/hwk.mjs validar <id>`. Regra em markdown custa token toda
vez que carrega; regra em código custa zero.

## 10. Revisão isolada

O peixinho é um custom agent, `hwk-gf`, com `tools: [read, search]` e sem instruções do projeto,
chamado como subagente novo a cada revisão. A lente de cada estágio ou eixo não é outro agente: vem no
pacote, gerada por script. Ele **nunca** recebe texto escrito pelo orquestrador. O caminho é sempre:

1. `node .henriworks/bin/hwk.mjs pacote-revisao <id> <alvo>` gera o pacote e imprime o prompt literal.
2. O orquestrador delega ao `hwk-gf` com **exatamente** esse prompt, sem uma palavra a mais.
   Quando a conferência estiver ligada, o hook nega qualquer outro texto.
3. A resposta vai para `.henriworks/changes/<id>/rascunhos/<alvo>.md`, sem edição.
4. `node .henriworks/bin/hwk.mjs gravar-veredito <id> <alvo> --de <rascunho>` grava, nunca sobrescreve.

Se não houver como criar subagente, a revisão **para** e diz isso. Revisão no mesmo contexto não é
revisão, e não existe substituto silencioso. O modo estrito (`hwk estrito <id> <alvo>`) roda o revisor
num processo separado do Copilot CLI, sem instruções do projeto.

| Revisão | Alvos (uma lente por subagente `hwk-gf` novo) |
| --- | --- |
| Spec, Lite | `design`, `prontidao` |
| Spec, Full | `zoom-out`, `compreensao`, `design`, `zoom-out-2`, `prontidao`, nesta ordem |
| Código | `spec`, `padroes`, `plantao`, no mesmo turno |

Regras dos eixos, vereditos e registro: `references/eixos-de-revisao.md`.

## 11. Mapa

Antes de buscar no código, consulte o mapa. Ele diz o que já existe para reusar, onde fica, e o que
quebra se você mexer. `node .henriworks/bin/henrimap.mjs query "<termo>"`, `explain <símbolo>`,
`affected <arquivos>`. Ele se atualiza sozinho antes de responder. Sem resposta útil, aí sim busque. O
grafo inteiro nunca é lido. Detalhes em `references/mapa.md`.

## 12. Escopo de verificação

Uma mudança responde pelo que ela introduziu, não pela dívida do repositório. **Camada** é uma entrada de
`.henriworks/verificacao.json`. A fatia de Verificação declara as camadas em `Escopo:`, e o `Toca:` de
cada fatia precisa caber nelas. `node .henriworks/bin/verificar.mjs <id>` roda só nessas camadas, só nos
arquivos tocados, e classifica: BLOQUEANTE, o que a mudança introduziu, reprova; PRÉ-EXISTENTE é contado
e não reprova. Camada tocada fora do `Escopo:` e ferramenta que falha ao executar também são BLOQUEANTE.
Ninguém refaz a classificação.

## 13. Limites

- Não escreva código de produção no plano nem na revisão.
- Não altere a proposta nem as fatias durante a implementação, exceto marcar `[x]`. Divergência: pare e
  reporte.
- Não edite `specs/` nem `decisoes/` fora do archive.
- Não marque tarefa sem evidência: comando executado ou arquivo alterado.
- Ambiguidade não se resolve por suposição. Liste as perguntas e pare.
- Não execute comando de escrita do Git.
- Não corrija erro pré-existente, nem no arquivo que a mudança tocou.
- Não escreva em `.sdd/`, em `revisao/`, em `revisao-spec/` ou em `archive/` por ferramenta de edição:
  vereditos só por `hwk gravar-veredito`; archive é registro.
- Não leia `graph.json`, `cache.json` nem `pacotes/` de outra revisão: são entrada de script.

## 14. Conhecimento e uso

Depois da PR aberta e da mudança arquivada, `hwk conhecimento <pasta-arquivada> --pr <número>` gera o
esqueleto de `conhecimento/<data>-<slug>.md` com metadados, decisões, capacidades e a seção Uso e custo,
calculada por script. O `hwk-archive` preenche as seções de texto a partir dos artefatos arquivados. É o
único arquivo que o dev commita, na branch da PR.

Uso e custo são coletados por hook e pelo exportador OpenTelemetry do Copilot, em `~/.henriworks/uso/`,
fora de qualquer repositório. Nenhum agente estima token ou custo: número que não veio de script não
existe.
