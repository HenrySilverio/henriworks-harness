<p align="center">
  <img src="assets/henriworks-logo.svg" alt="HenriWorks Engineering Harness" width="420">
</p>

# HenriWorks Engineering Harness 0.1.2

Harness do GitHub Copilot no VS Code que leva uma intenção até a PR, em backend, BFF ou frontend, de
qualquer stack. Sucede o HenriSpec 0.4.5 e o HenriSpec Discovery 0.3.1, num pacote só.

O que muda em relação ao HenriSpec, em uma frase cada:

- **Quem escreve não revisa.** Toda revisão roda num subagente sem a conversa do autor, com um prompt
  gerado por script (modelo Elefante e Peixinho).
- **Uma fatia por arquivo.** O plano vira fatias verticais em `tarefas/NN-*.md`; um coordenador
  despacha cada fatia para um executor num contexto limpo, em sequência ou em paralelo.
- **Mapa antes de busca.** Um grafo do projeto, local e sem dependência, responde onde algo está e o
  que quebra se mexer, antes de o agente varrer arquivos.
- **Executores externos.** Um agente de terceiros (ex.: design-to-code) executa fatias por contrato,
  sem prompt novo.
- **Uso e custo por task.** Token, modelo e custo vêm do OpenTelemetry do Copilot e ficam ligados ao
  ticket do Jira, fora de qualquer repositório.
- **Só um arquivo vai para o Git:** o registro em `conhecimento/`. O resto fica em `.git/info/exclude`.

---

## Sumário

1. [Estado desta versão](#1-estado-desta-versão)
2. [Requisitos](#2-requisitos)
3. [Instalação](#3-instalação)
4. [Primeiro uso: o canário](#4-primeiro-uso-o-canário)
5. [O fluxo](#5-o-fluxo)
6. [Revisão isolada](#6-revisão-isolada)
7. [Fatias, paralelo e arquivo compartilhado](#7-fatias-paralelo-e-arquivo-compartilhado)
8. [Mapa do projeto](#8-mapa-do-projeto)
9. [Uso e custo](#9-uso-e-custo)
10. [O que vai para o Git](#10-o-que-vai-para-o-git)
11. [Convivência com o HenriSpec](#11-convivência-com-o-henrispec)
12. [Configuração](#12-configuração)
13. [Comandos](#13-comandos)
14. [Solução de problemas](#14-solução-de-problemas)
15. [Glossário](#15-glossário)

---

## 1. Estado desta versão

0.1.2 é a primeira versão pública: 0.1.0, mais o painel de uso completo (0.1.1) e os modelos liberados cruzados com uso e preço (0.1.2). O núcleo é estável; o que depende de comportamento do VS Code que ainda não
foi provado em cada máquina vem **desligado** até o canário (seção 4) passar.

| Parte | Estado | Por quê |
| --- | --- | --- |
| Agentes, fases, portões, validador, verificador | estável | portado do HenriSpec 0.4.5 e testado ponta a ponta |
| Revisão isolada por subagente (`hwk-gf-*`) | estável, **conferir com o canário** | depende de o subagente não herdar a conversa |
| Mapa (L1 regex, L2 TypeScript e `jdeps`, L3 rotas e endpoints) | estável | sem dependência; usa o compilador do próprio projeto quando existe |
| Uso e custo (OTel + painel) | experimental | o formato do arquivo OTel do Copilot ainda muda entre versões |
| Hooks (guardas, coleta, mapa antes de busca) | experimental | hooks em marketplace interno não foram testados; tudo falha aberto |
| Conferência do prompt literal do peixinho | experimental, **desligada** | liga com `hwk canario aplicar` |
| Modo estrito (`hwk estrito`) | experimental | exige o Copilot CLI |
| Trava de arquivo entre fatias paralelas | desligada | o padrão é avisar e pedir decisão ao humano, nunca bloquear |

"Falha aberto" quer dizer: se um hook der erro, demorar ou não existir, a sessão segue normalmente, só
sem aquela proteção. Nenhum hook pode travar o seu trabalho.

## 2. Requisitos

- VS Code com GitHub Copilot Chat, harness **Copilot** (custom agents, skills e subagentes).
- Node **20 ou mais** (recomendado 22) no PATH.
- Git.
- Opcionais: JDK com `jdeps` (mapa L2 de Java), `typescript` no `node_modules` do projeto (mapa L2 de
  TS), Copilot CLI (modo estrito).

Nada é instalado por npm. O pacote não usa rede.

## 3. Instalação

Descompacte o zip em qualquer pasta fora do repositório. Depois, da raiz do repositório:

```bash
# Git Bash, Linux, macOS
bash /caminho/henriworks-v0.1.2/instalar.sh repo .

# PowerShell ou cmd
node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .
```

Sempre dá para ver antes o que vai acontecer, sem escrever nada:

```bash
node /caminho/henriworks-v0.1.2/instalar.mjs repo . --dry-run
```

Para validar a máquina antes de instalar num repositório de verdade (Node, Git, scripts e hooks), rode o
teste de fumaça do pacote. Ele cria um repositório temporário, instala, percorre o fluxo inteiro por
script e apaga tudo no fim:

```bash
node /caminho/henriworks-v0.1.2/testes/smoke.mjs
```

O resultado esperado é `20/20 passos ok`. O teste não prova o que depende do VS Code (subagente
isolado, hooks carregados pela janela): isso é o canário (seção 4).

### O que o instalador faz

| Onde | O quê |
| --- | --- |
| `.github/agents/hwk*.agent.md` | 16 agentes: 9 de fase, 7 revisores |
| `.github/skills/hwk-*/` | 15 atalhos `/hwk-*` |
| `.github/skills/henriworks-fluxo/` | o contrato do fluxo e as referências |
| `.github/hooks/henriworks.json` | os hooks do workspace |
| `.henriworks/bin/` | scripts: `hwk.mjs`, `henrimap.mjs`, `verificar.mjs`, `uso.mjs`, `hook.mjs` |
| `.henriworks/*.json`, `*.md` | sementes: configuração, verificação, padrões, glossário, índices |
| `.henriworks/docs/` | este README e a logo |
| `AGENTS.md` | um bloco curto entre `<!-- henriworks:inicio -->` e `<!-- henriworks:fim -->` |
| `.git/info/exclude` | um bloco com tudo acima, para nada disso aparecer no `git status` |

Depois de copiar, roda a pós-instalação: constrói o mapa, instala os hooks locais do Git que mantêm o
mapa em dia (`post-checkout`, `post-merge`, `post-commit`) e lembra o canário e a configuração do OTel.

### Tipos de arquivo

- **Gerenciado**: é do toolkit. Atualizado a cada versão. Se você alterou, o instalador para com
  `CONFLITO` e não escreve nada; compare e decida, ou rode com `--forcar` (faz backup antes).
- **Semente**: criado só se não existir. Depois é seu: `verificacao.json`, `padroes.md`, `glossario.md`,
  `henriworks.json`, `executores.json`, índices. Atualizar a versão nunca toca neles.
- Mudanças, specs, decisões, briefings, vereditos e o mapa nunca são lidos nem tocados pelo instalador.

O lock fica em `.henriworks/henriworks.lock.json`; backups em `.henriworks/.toolkit-backup/`.

### Opções

| Opção | Efeito |
| --- | --- |
| `--dry-run` | mostra o plano e não escreve nada |
| `--forcar` | sobrescreve arquivo gerenciado alterado (com backup) e permite voltar de versão |
| `--sem-github` | não toca em `.github/`, exceto o hook; use junto com a instalação global |
| `--sem-instrucoes` | não inclui o bloco no `AGENTS.md` (para repositório onde instrução de projeto é proibida) |

### Instalação global (agentes e skills no seu usuário)

Para não copiar agentes e skills em cada repositório:

```bash
node /caminho/henriworks-v0.1.2/instalar.mjs global
# depois, em cada repositório:
node /caminho/henriworks-v0.1.2/instalar.mjs repo . --sem-github
```

O modo global grava em `~/.copilot/agents` e `~/.copilot/skills` (ou em `COPILOT_HOME`). `.henriworks/` e
o hook continuam por repositório, porque são do repositório. Não instale dos dois jeitos no mesmo
repositório: o agente aparece duas vezes no seletor.

### Atualizar

Rode o mesmo comando com o pacote novo. O instalador compara cada arquivo com o lock: atualiza o que
está intacto, cria o que é novo, remove o que saiu do pacote e para no que você alterou.

### Pendências depois da primeira instalação

1. Edite `.henriworks/verificacao.json`: camadas e comandos vieram de um molde de MFE Angular. Uma camada
   é um conjunto de pastas com os comandos que a verificam (lint, teste, build).
2. Preencha `.henriworks/padroes.md` com as regras do repositório que dá para auditar. Vazio, o eixo
   padrões da revisão usa só o que o próprio código já faz.
3. Rode o canário (seção 4).
4. Ligue o OTel, se quiser uso e custo (seção 9).

## 4. Primeiro uso: o canário

O canário prova duas coisas **na sua máquina**, antes de você confiar nelas:

- que o revisor (subagente) não recebe a conversa de quem pediu a revisão;
- que os hooks rodam e que formato de evento o seu VS Code entrega.

```bash
node .henriworks/bin/hwk.mjs canario preparar
```

A saída traz uma palavra-código (`hwk-canario-xxxxxxxx`) e os passos:

1. Recarregue o VS Code (hooks são lidos ao abrir a janela).
2. Abra um chat **novo**, selecione o agente `hwk-review` e envie: `canario hwk-canario-xxxxxxxx`.
3. O agente gera um pacote, delega ao revisor e grava a resposta.
4. Rode `node .henriworks/bin/hwk.mjs canario conferir`.

| Resultado | Significa | O que fazer |
| --- | --- | --- |
| `isolamento confirmado` | o revisor não viu a palavra-código | nada; opcionalmente `hwk canario aplicar` |
| `isolamento FALHOU` | o subagente herdou a conversa | use `hwk estrito` para revisar até investigar |
| `NENHUM evento registrado` | hooks bloqueados, não recarregados, ou fora do harness Copilot | as guardas não estão ativas; o fluxo funciona, sem elas |
| `bloco do AGENTS.md chegou ao peixinho: sim` | o revisor recebe as instruções do projeto | aceitável: o bloco só roteia |

`hwk canario aplicar` liga a conferência do prompt literal: daí em diante, o hook nega qualquer chamada
a um revisor `hwk-gf-*` cujo texto não seja exatamente o prompt do pacote.

Também existe o atalho `/hwk-canario` em qualquer agente com terminal.

## 5. O fluxo

Uma fase por chat. Cada fase tem um agente; selecione-o no seletor de agentes do Copilot Chat. O atalho
`/hwk-*` só funciona com o agente da fase selecionado (fora dele, ele diz qual selecionar).

| Fase | Agente | Atalho | Sai com |
| --- | --- | --- | --- |
| Intenção | `hwk` | `/hwk-start` | a rota: direto, discovery, plano |
| Discovery | `hwk-grill` | `/hwk-grill` | `briefings/<assunto>/briefing.md` |
| Triagem de ticket | `hwk-triagem` | `/hwk-triagem` | briefing a partir de um ticket ou bug |
| Protótipo | `hwk-prototipo` | `/hwk-prototipo` | resposta a uma pergunta de design, fora de `src/` |
| Plano | `hwk-plan` | `/hwk-plan` | proposta, design (Full), deltas, fatias |
| Revisão da spec | `hwk-review` | `/hwk-review spec <id>` | vereditos e aprovação humana |
| Implementação | `hwk-implement` | `/hwk-implement <id>` | código, uma sessão por fatia |
| Revisão de código | `hwk-review` | `/hwk-review <id>` | três vereditos no HEAD |
| Archive | `hwk-archive` | `/hwk-archive <id>` | `resumo.md` (corpo da PR) e mudança arquivada |
| Conhecimento | `hwk-archive` | `/hwk-fechar <pasta> <PR>` | `conhecimento/<data>-<slug>.md` |

Os portões entre fases são de script, não de opinião. `node .henriworks/bin/hwk.mjs estado` mostra a
fase de cada mudança aberta, derivada dos artefatos.

**O fluxo lê Git e não escreve Git.** Nenhum agente cria branch, commita, faz push ou abre PR. O agente
para e diz o que fazer; você faz.

### Rigor

- **Lite** (padrão): proposta e fatias. Revisão da spec com dois revisores (design e prontidão).
- **Full**: com `design.md` e cinco estágios de revisão. Obrigatório quando há mudança de contrato entre
  camadas, operação irreversível, requisito regulatório ou de segurança, mais de um repositório, ou
  decisão durável.

### Exemplo curto

```
[agente hwk]          quero que o extrato mostre o saldo projetado do mês
                      → rota: discovery
[agente hwk-grill]    /hwk-grill saldo projetado no extrato
                      → .henriworks/briefings/saldo-projetado/briefing.md
[agente hwk-plan]     /hwk-plan .henriworks/briefings/saldo-projetado/briefing.md
                      → .henriworks/changes/mostrar-saldo-projetado/ (Lite, 4 fatias)
[agente hwk-review]   /hwk-review spec mostrar-saldo-projetado
                      → 2 vereditos; você: hwk aprovar-spec mostrar-saldo-projetado --por "Ana"
[agente hwk-implement]/hwk-implement mostrar-saldo-projetado
                      → fatia 01 pronta; você revisa e commita. Repete até a 04 (Verificação).
[agente hwk-review]   /hwk-review mostrar-saldo-projetado
                      → spec, padrões e plantão APROVADO
[agente hwk-archive]  /hwk-archive mostrar-saldo-projetado
                      → resumo.md; você abre a PR com ele
[agente hwk-archive]  /hwk-fechar 2026-11-05-mostrar-saldo-projetado 1234
                      → conhecimento/2026-11-05-mostrar-saldo-projetado.md; você commita na branch da PR
```

## 6. Revisão isolada

O problema que ela resolve: quem escreveu um documento lê o que quis dizer, não o que escreveu. Revisor
que leu a conversa tem o mesmo ponto cego.

Três papéis:

- **Elefante**: o agente da fase. Tem o projeto e a conversa; planeja e implementa.
- **Peixinho**: um agente `hwk-gf-*` com só `read` e `search`, chamado como subagente. Recebe uma linha
  apontando para um **pacote de revisão** e lê só o que o pacote lista.
- **Humano**: resolve trade-off, aprova a spec, commita, abre a PR.

O caminho de uma revisão:

1. `hwk pacote-revisao <id> <alvo>` gera o pacote e imprime o prompt literal.
2. O elefante delega ao peixinho com exatamente esse prompt. Com a conferência ligada, o hook nega
   qualquer outro texto.
3. A resposta vai para um rascunho, sem edição.
4. `hwk gravar-veredito` grava. Veredito nunca é sobrescrito: uma nova rodada vira `-2`, `-3`.

O veredito da spec fica preso ao hash da spec: mudou o texto, a aprovação deixa de valer. O veredito de
código fica preso ao HEAD.

| Revisão | Revisores |
| --- | --- |
| Spec, Lite | design, prontidão |
| Spec, Full | zoom-out, compreensão, design, zoom-out (2ª rodada), prontidão |
| Código | spec (o diff faz o que as fatias pedem), padrões (regras do repositório), plantão (bug, segurança, carga) |

Se o VS Code não deixar criar subagente, a revisão **para**. Não existe revisão no mesmo contexto como
substituto.

**Modo estrito** (experimental): `hwk estrito <id> <alvo>` roda o revisor num processo separado do
Copilot CLI, sem instruções do projeto e sem ferramenta de escrita ou terminal.

## 7. Fatias, paralelo e arquivo compartilhado

Cada fatia é um arquivo em `tarefas/NN-<slug>.md` com:

- `Demonstra:` o comportamento que dá para mostrar quando ela fechar;
- `Bloqueado por:` as fatias que precisam vir antes;
- `Toca:` as pastas ou arquivos que ela pode alterar;
- `Executor:` quem executa (padrão `hwk-implementador`);
- `## Ponteiros`: o que o executor precisa ler. Ele não recebe mais nada: nem as outras fatias, nem o
  briefing, nem a conversa.

`hwk fatias <id>` mostra o grafo, a frontier (fatias prontas) e quais podem rodar juntas. O padrão é uma
fatia por sessão; você pode pedir várias (`/hwk-implement <id> 2 fatias`) ou em paralelo
(`/hwk-implement <id> paralelo`), e o coordenador só junta fatias sem dependência e com `Toca:` disjunto.

**Duas fatias mexeram no mesmo arquivo?** Nada bloqueia a entrega. `hwk conferir-toca <id>` abre um
cartão em `tarefas/sobreposicoes.md` e você decide: commitar junto, separar com `git add -p`, ou
replanejar. Cartão em aberto vai para o corpo da PR, em "Pontos para o revisor humano".

### Executores externos

Um agente de terceiros executa fatias se estiver registrado em `.henriworks/executores.json`:

```json
"design-to-code": {
  "tipo": "agente-externo",
  "quando": "tela nova ou alterada a partir de um frame do Figma",
  "entrada": ["caminho da fatia", "link do frame do Figma, na seção Ponteiros da fatia"],
  "saida": "arquivos alterados e a confirmação da linha Demonstra",
  "exige": ["agente design-to-code instalado", "MCP do Figma"],
  "revisao": "tres-eixos"
}
```

O plano usa o nome em `Executor:`. Se o agente não estiver instalado, o coordenador para e diz qual
falta; nunca troca em silêncio pelo executor padrão. A saída passa pelo mesmo `conferir-toca` e pela
mesma revisão de código de qualquer fatia.

## 8. Mapa do projeto

O mapa responde, sem varrer arquivos: o que já existe para reusar, onde fica, e o que quebra se mexer.

```bash
node .henriworks/bin/henrimap.mjs query "saldo projetado"
node .henriworks/bin/henrimap.mjs explain ExtratoService
node .henriworks/bin/henrimap.mjs affected src/app/extrato/extrato.service.ts
node .henriworks/bin/henrimap.mjs path ExtratoComponent SaldoController
node .henriworks/bin/henrimap.mjs resumo
node .henriworks/bin/henrimap.mjs status
```

Toda saída é cortada em 2.000 caracteres: o modelo nunca lê o grafo inteiro.

| Marca | Origem | Confiança |
| --- | --- | --- |
| `EXTRACTED` | lido do código ou do compilador | confie |
| `INFERRED` | resolvido por nome, convenção de framework ou caminho de endpoint | confira no código |
| `AMBÍGUO` | DI por string, reflexão, evento, chamada dinâmica | leia o código |

Camadas: L1 regex (TS/JS, Java, Kotlin, C#, Python, Go, OpenAPI); L2 o compilador TypeScript do
`node_modules` do projeto e o `jdeps` do JDK, quando existem; L3 rotas lazy do Angular, remotes do Native
Federation, endpoints Spring e OpenAPI, Feign e chamadas HTTP do front ligadas ao endpoint do back.

**Sempre em dia.** Antes de cada consulta o mapa confere o hash dos arquivos e reextrai só o que mudou.
Os hooks locais do Git e o hook `postToolUse` também atualizam em segundo plano.

**Graphify.** Se o repositório já tem `graphify-out/graph.json`, o mapa usa esse grafo.

**Mapa antes de busca.** Numa sessão de agente `hwk-*`, a primeira busca textual antes de qualquer
consulta ao mapa é negada uma vez, com a sugestão de consultar o mapa. A segunda passa.

## 9. Uso e custo

Experimental. Responde: quanto token, de que modelo, em que agente e skill, em qual task do Jira.

Duas fontes, as duas fora de qualquer repositório, em `~/.henriworks/uso/` (ou `HENRIWORKS_USO`):

- **OpenTelemetry do Copilot**: token, modelo, tempo. Precisa ser ligado uma vez por máquina.
- **Hooks**: sessão, repositório, branch, ticket, mudança, agente `hwk-*`, subagente, ferramenta.

```bash
node .henriworks/bin/uso.mjs configurar            # mostra se está ligado e como ligar
node .henriworks/bin/uso.mjs configurar --aplicar  # Windows: grava as variáveis no seu usuário
```

Ou, nas configurações do VS Code: `github.copilot.chat.otel.enabled`, exportador `file` e o arquivo de
saída que o `configurar` mostra. Depois de ligar, feche e abra o VS Code.

```bash
node .henriworks/bin/uso.mjs painel                               # HTML em ~/.henriworks/uso/painel/
node .henriworks/bin/uso.mjs orcamento mostrar-saldo-projetado 300  # aviso em 50%, 80% e 100%
```

O painel é um HTML local, sem script e sem rede, com:

- **Números do topo**: sessões, créditos a valor de lista (e em US$), tokens de entrada com a parcela lida de
  cache, tokens de saída, sessões do fluxo que consultaram o mapa antes de buscar, sessões sem ticket.
- **Orçamentos por mudança**: barra até 125% do orçamento, com marcas em 50%, 80% e 100%, e o estado.
- **Créditos por dia** (últimos 30 dias, pico em destaque) e **acumulado** da mudança com orçamento e
  atividade mais recente, sessão a sessão, com o ponto em que cada aviso disparou.
- **Tokens por fase do fluxo**, **créditos por modelo, por ticket e por mudança**, **agentes por sessão** e
  **guardas que negaram**. A fase vem do agente selecionado na sessão (hook do agente), porque o OTel não
  grava o nome de custom agent.
- **Modelos · política × uso × preço**: cada modelo da política do Copilot e cada modelo usado de fato nos
  últimos 30 dias, com o estado na política, sessões, créditos, se tem preço na tabela e o que merece
  atenção (ver "Modelos liberados", abaixo).
- **Sessões recentes**: início, repositório, branch, ticket, mudança, fase, tokens, créditos e se o mapa
  veio antes da busca.

O orçamento só avisa, no início da sessão; nunca bloqueia.

**Privacidade.** Nunca é gravado prompt, resposta, argumento de ferramenta nem texto de comando. O
`captureContent` do OTel continua desligado. Os dados são do seu usuário, na sua máquina. Antes de
consolidar uso de várias pessoas, confirme com a área responsável por LGPD.

**Custo** é estimado com a tabela `.henriworks/config/precos.json` (data no próprio arquivo). Nenhum
agente estima token ou custo: número que não veio de script não aparece.

### Modelos liberados

Quais modelos a empresa liberou vem da API oficial de política de modelos do GitHub (GA em 19/10/2026):
`GET /orgs/{org}/copilot/model-policies` ou `GET /enterprises/{enterprise}/copilot/model-policies`. As
duas exigem permissão de admin. Por isso o desenho tem duas pontas:

1. **Um job, com a credencial.** O time de plataforma roda `modelos gerar` num job agendado, num
   repositório interno, e publica `modelos-liberados.json`. O modelo do job está em
   `extras/modelos-liberados.yml` neste pacote: usa um GitHub App só de leitura, só faz commit quando a
   política muda (ou uma vez a cada 5 dias, para a lista não vencer).
2. **Cada dev, só leitura.** `modelos atualizar` lê esse JSON com o `gh` que você já usa e guarda uma
   cópia em `~/.henriworks/uso/modelos/`. Ninguém do time precisa de token de admin.

```bash
node .henriworks/bin/modelos.mjs atualizar --de gh:<org>/<repo>/modelos-liberados.json   # uma vez
node .henriworks/bin/modelos.mjs                     # liberados × usados × preço, no terminal
node .henriworks/bin/modelos.mjs conferir            # código 1 se houver alerta grave
```

Fixe a fonte em `.henriworks/henriworks.json` (`"modelos": { "fonte": "gh:..." }`) ou na variável
`HENRIWORKS_MODELOS_FONTE`; a pós-instalação já atualiza a lista quando a fonte existe. Fontes aceitas:
`gh:<dono>/<repo>/<caminho>[@ref]`, `api:org/<org>` ou `api:enterprise/<ent>` (direto na API, para quem
é admin), URL `https://` (tenta `fetch` e depois `curl`, que respeita `HTTPS_PROXY`) e caminho de arquivo.

O cruzamento marca, por modelo:

| Alerta | Gravidade | Por quê |
| --- | --- | --- |
| usado sem preço na tabela | grave | o custo dele conta como zero no painel e no registro |
| usado, mas bloqueado na política | grave | lista desatualizada, ou acesso dado por time; confira antes de confiar |
| usado, mas fora da lista | atenção | modelo novo que a política ainda não lista |
| liberado sem preço na tabela | atenção | o primeiro uso vai sair com custo zero: atualize `precos.json` |
| liberado, sem uso no período | info | candidato a revisão de política, ou a modelo por fase |

`conferir` também lê o `model:` dos agentes (do repositório e do usuário) e falha se nenhum dos modelos
listados num agente estiver liberado.

**Limite.** A política diz o estado de cada modelo, não o que cada pessoa consegue usar: com acesso por
time, os acessos se somam. Por isso o painel cruza com o uso registrado pelo OpenTelemetry. Não use o
endpoint `api.githubcopilot.com/models`: ele não é documentado e devolve lista reduzida para token de app.

**Ticket.** O ticket que liga uso à task vem, nesta ordem: fixado por `/hwk-ticket CHAVE-123`, da linha
`Ticket:` da proposta, ou do nome da branch.

## 10. O que vai para o Git

Só o registro em `conhecimento/<data>-<slug>.md`, commitado por você na branch da PR, depois de a PR
estar aberta e a mudança arquivada. Ele traz o que foi feito, as decisões, as capacidades alteradas e o
uso e custo calculado por script.

Todo o resto fica no `.git/info/exclude`: `.henriworks/`, os agentes, as skills, o hook e, se o
instalador o criou, o `AGENTS.md`. O `exclude` é local e não é versionado; o `.gitignore` do time não
muda.

Se o `AGENTS.md` (ou `.github/copilot-instructions.md`) já existia e é versionado, o instalador inclui
o bloco e marca o arquivo com `skip-worktree`, para a alteração ficar só na sua máquina. Para desfazer:
`git update-index --no-skip-worktree AGENTS.md`. Se instrução de projeto é proibida no repositório, use
`--sem-instrucoes`.

Para versionar os artefatos no futuro, quando a política permitir: `"versionarArtefatos": true` em
`.henriworks/henriworks.json` e remova as linhas do bloco no `exclude`.

## 11. Convivência com o HenriSpec

- `.sdd/` continua do HenriSpec. O HenriWorks lê `.sdd/specs/` e `.sdd/decisoes/` como legado, só
  leitura, e nunca escreve ali.
- **Uma branch, um harness.** Branch com mudança aberta em `.sdd/changes/` continua no HenriSpec; nenhum
  agente `hwk-*` cria mudança nela.
- Os dois instaladores convivem: locks, blocos do `AGENTS.md` e blocos do `exclude` são separados.
- `/hwk-adotar` copia, uma vez, specs e decisões do `.sdd/` para `.henriworks/`. Mostra o plano antes e
  só aplica com confirmação. Mudanças abertas não são copiadas.

## 12. Configuração

`.henriworks/henriworks.json` (semente: é seu depois de criado):

| Chave | Padrão | Efeito |
| --- | --- | --- |
| `versionarArtefatos` | `false` | reservado para quando a política permitir versionar `.henriworks/` |
| `bloquearGitNoAgente` | `false` | o hook nega commit, push, merge, rebase, reset e afins pelo terminal de qualquer agente do workspace |
| `conhecimento` | `"conhecimento/"` | pasta do registro versionado |
| `ticket.padrao` | `[A-Z][A-Z0-9]+-\d+` | como achar a chave do Jira na branch |
| `revisaoIsolada.conferirPacote` | `"off"` | `"negar"` depois de `hwk canario aplicar` |
| `revisaoIsolada.modoEstrito` | `false` | reservado: revisão pelo Copilot CLI por padrão |
| `sobreposicao.travaArquivo` | `"off"` | trava de arquivo entre fatias paralelas (experimental) |
| `mapa.primeiroAntesDeBusca` | `"negar-uma-vez"` | `"off"` desliga a sugestão do mapa |
| `mapa.orcamentoSaida` | `2000` | caracteres por resposta do mapa |
| `uso.coletar` | `true` | coleta dos hooks |
| `uso.alertas` | `[0.5, 0.8, 1.0]` | limiares do aviso de orçamento |
| `modelos.fonte` | `null` | de onde ler a lista de modelos liberados (seção 9) |
| `modelos.validadeDias` | `7` | idade a partir da qual a lista é tratada como vencida |

Outros arquivos seus: `verificacao.json` (camadas e comandos), `padroes.md` (regras auditáveis),
`glossario.md` (linguagem do domínio), `executores.json` (quem executa fatias).

## 13. Comandos

Rode da raiz do repositório. `hwk` abaixo é `node .henriworks/bin/hwk.mjs`.

| Comando | Para quê |
| --- | --- |
| `hwk estado` | fase de cada mudança aberta |
| `hwk validar [id]` | portões mecânicos do plano |
| `hwk fatias <id> [--gravar]` | grafo, frontier e paralelo; `--gravar` gera `tarefas/index.md` |
| `hwk conferir-toca <id>` | arquivos alterados contra o `Toca:`; abre cartão |
| `hwk ponto-de-partida <base>` | `Início:` sugerido e trabalho já existente na branch |
| `hwk pacote-revisao <id> <alvo>` | pacote e prompt literal do revisor |
| `hwk gravar-veredito <id> <alvo> --de <arquivo>` | grava veredito, nunca sobrescreve |
| `hwk aprovar-spec <id> --por "<nome>"` | aprovação humana da spec |
| `hwk arquivar <id> [--conferir]` | precondições e archive |
| `hwk conhecimento <pasta> --pr <n>` | esqueleto do registro versionado |
| `hwk ticket [CHAVE \| --limpar]` | ticket da sessão |
| `hwk adotar [--aplicar]` | cópia única do `.sdd/` |
| `hwk canario preparar \| conferir \| aplicar` | prova do isolamento e dos hooks |
| `hwk estrito <id> <alvo>` | revisor pelo Copilot CLI |
| `node .henriworks/bin/verificar.mjs <id> [--salvar]` | lint, teste e build só no que a mudança tocou |
| `node .henriworks/bin/henrimap.mjs ...` | mapa (seção 8) |
| `node .henriworks/bin/uso.mjs ...` | uso e custo (seção 9) |
| `node .henriworks/bin/modelos.mjs [atualizar\|conferir\|gerar]` | modelos liberados × usados × preço (seção 9) |

Atalhos utilitários, em qualquer agente com terminal: `/hwk-canario`, `/hwk-ticket`, `/hwk-adotar`,
`/hwk-mapa`, `/hwk-uso`, `/hwk-modelos`.

Nesta versão os atalhos se chamam `/hwk-*`. Quando o HenriWorks for distribuído como plugin, os mesmos
comandos virão como `/hwk:*`.

## 14. Solução de problemas

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Agente `hwk-*` não aparece no seletor | harness diferente de Copilot, ou janela não recarregada | selecione o harness Copilot e recarregue a janela |
| Atalho `/hwk-x` responde "selecione o agente" | o agente da fase não está selecionado | selecione o agente que ele indica, num chat novo |
| `CONFLITO` no instalador | você alterou um arquivo gerenciado | compare com o pacote; `--forcar` sobrescreve com backup |
| Canário: `NENHUM evento registrado` | hooks bloqueados por política, ou janela não recarregada | recarregue; se persistir, o fluxo funciona sem as guardas |
| Revisão "não há como criar subagente" | ferramenta de subagente desligada | habilite subagentes no Copilot Chat; ou use `hwk estrito` |
| Busca negada com "consulte o mapa" | primeira busca da sessão sem consulta ao mapa | consulte o mapa; a próxima busca passa. Desligue com `mapa.primeiroAntesDeBusca: "off"` |
| `henrimap status` sem L2 de TS | `typescript` não está no `node_modules` do projeto | rode o `npm install` do projeto; o mapa segue em L1 |
| `henrimap status` sem `jdeps` | JDK fora do PATH, ou projeto Java não compilado | compile (`target/classes`) e ponha o JDK no PATH |
| Painel de uso sem token nem custo | OTel desligado | `uso.mjs configurar` (seção 9) |
| `modelos atualizar`: "gh não encontrado" ou 404 | sem GitHub CLI, sem `gh auth login`, ou sem acesso ao repositório da lista | instale o `gh`, autentique, peça leitura no repositório interno |
| `modelos gerar`: 403 ou 404 | o token não tem permissão de admin na org ou enterprise | rode no job do time de plataforma, não na sua máquina |
| Modelo usado aparece "bloqueado" | lista velha ou acesso por time | `modelos atualizar`; se persistir, fale com quem administra o Copilot |
| Proxy corporativo | nada no HenriWorks usa rede | nenhum ajuste necessário |
| Instalação global: o revisor pede permissão para ler um arquivo | a referência de eixos fica em `~/.copilot/skills`, fora do workspace | aprove a leitura, ou instale no repositório |
| Git hooks do mapa não instalados | `core.hooksPath` (Husky) ou hook existente que não é shell | acrescente a linha que a pós-instalação mostra |

## 15. Glossário

- **Agente (custom agent)**: arquivo `.agent.md` que define instruções e ferramentas de uma persona do
  Copilot Chat.
- **Skill**: pasta com `SKILL.md`; aqui, usada como atalho `/hwk-*`.
- **Subagente**: agente chamado por outro, num contexto novo.
- **Hook**: comando que o VS Code roda em eventos da sessão (início, antes e depois de ferramenta).
- **Mudança (change)**: uma unidade de trabalho, em `.henriworks/changes/<id>/`.
- **Fatia**: parte vertical de uma mudança que produz comportamento demonstrável numa sessão.
- **Frontier**: fatias com todos os bloqueios concluídos.
- **Pacote de revisão**: arquivo gerado por script com o que o revisor deve ler e o formato da resposta.
- **Veredito**: resposta de um revisor, gravada e nunca sobrescrita.
- **Delta**: alteração a aplicar na spec viva de uma capacidade.
- **Decisão durável**: difícil de reverter, surpreendente sem contexto, com alternativa descartada.
- **Camada (verificação)**: conjunto de pastas com os comandos que a verificam.
