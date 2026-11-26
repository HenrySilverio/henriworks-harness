# Vault da tribo · estrutura de exemplo com 6 squads

> Esqueleto de proposta. Os nomes de tribo, squads e sistemas são **ilustrativos**. Antes de adotar, conferir contra o
> padrão OKF 0.2 e as regras do validador da esteira: se o OKF definir pastas, campos ou tipos, ele prevalece.

## Contexto

- Estrutura organizacional: **BU Crédito → Tribos → Squads**.
- Decisão da gerência: **um Vault por tribo**, organizado por squad dentro dele.
- Alteração **fechada por squad**: uma squad não altera o conteúdo de outra, e uma tribo não altera o Vault de outra.
- **O repositório do Vault é também um plugin**: o dev instala pelo marketplace e recebe o conteúdo na versão publicada.
- Premissa: o repositório fica na organização do GitHub, com release e publicação no marketplace como o Hive.

## A árvore

```
vault-tribo-credito-pf/                # repositório = plugin da tribo
├── <manifesto do plugin>              # mesmo formato e lugar do Hive; versão pelo release-please
├── README.md                          # o que é o Vault, como contribuir, quem são os guardiões
├── CHANGELOG.md                       # gerado no release
├── .github/
│   ├── CODEOWNERS                     # pasta → time do GitHub (gerado a partir de vault/_meta/squads.yml)
│   └── workflows/
│       ├── vault-check.yml            # no PR: esquema, guarda de caminho, links, título no padrão do release
│       └── release.yml                # no release: gera o grafo, fecha a versão, publica no marketplace
│
├── casca/                             # dono: guardiões · a parte "plugin" do plugin
│   ├── skills/
│   │   └── consultar-vault/           # ÚNICA skill: lê o grafo e devolve o recorte pedido
│   └── scripts/
│       ├── consultar.mjs              # Node sem dependência: vizinhança de um id, busca por tipo/dono
│       └── grafo.mjs                  # valida o esquema e gera vault/_meta/grafo/grafo.json
│
└── vault/                             # o CONTEÚDO · Markdown neutro, lido por qualquer ferramenta
    ├── _meta/                         # dono: guardiões
    │   ├── esquema/
    │   │   ├── tipos-de-no.md         # squad, sistema, componente, api, regra, conceito, decisao, jornada
    │   │   ├── tipos-de-aresta.md     # dono, parte_de, depende_de, expoe, consome, implementa, decidido_em, define
    │   │   └── campos-obrigatorios.md # id, tipo, dono, atualizado_em (+ o que o OKF exigir)
    │   ├── squads.yml                 # squad → time do GitHub → pasta
    │   └── grafo/
    │       └── grafo.json             # GERADO no release · não editar
    │
    ├── tribo/                         # dono: guardiões (arquitetura + 1 representante por squad)
    │   ├── dominio/
    │   │   ├── glossario.md           # um termo, uma definição, para a tribo inteira
    │   │   ├── limite-de-credito.md
    │   │   ├── score.md
    │   │   └── contrato.md
    │   ├── decisoes/
    │   │   ├── adr-0001-eventos-entre-sistemas.md
    │   │   └── adr-0002-versionamento-de-api.md
    │   ├── padroes/
    │   │   ├── nomenclatura-de-apis.md
    │   │   └── observabilidade.md
    │   └── sistemas-compartilhados/
    │       └── cadastro-cliente-credito/   # usado por várias squads, dono único: guardiões
    │           └── visao.md
    │
    └── squads/
        ├── squad-limites/
        │   ├── _squad.md              # missão, repositórios, contato, sistemas que possui
        │   ├── sistemas/
        │   │   └── motor-de-limite/
        │   │       ├── visao.md
        │   │       ├── componentes/
        │   │       │   ├── calculadora-limite.md
        │   │       │   └── cache-limite.md
        │   │       ├── apis/
        │   │       │   └── limite-api-v2.md
        │   │       ├── regras/
        │   │       │   ├── limite-minimo-pf.md
        │   │       │   └── reducao-por-atraso.md
        │   │       └── decisoes/
        │   │           └── adr-0007-cache-de-limite.md
        │   └── jornadas/
        │       └── revisao-de-limite.md
        │
        ├── squad-score/
        │   ├── _squad.md
        │   ├── sistemas/
        │   │   └── score-api/
        │   │       ├── visao.md
        │   │       ├── apis/score-api-v1.md
        │   │       └── regras/faixas-de-score.md
        │   └── jornadas/
        │
        ├── squad-contratacao/
        │   ├── _squad.md
        │   ├── sistemas/
        │   │   ├── simulador/
        │   │   │   ├── visao.md
        │   │   │   ├── componentes/mfe-simulador.md
        │   │   │   └── regras/calculo-de-parcelas.md
        │   │   └── formalizacao/
        │   │       ├── visao.md
        │   │       └── apis/contrato-api-v1.md
        │   └── jornadas/
        │       └── contratar-emprestimo-pessoal.md
        │
        ├── squad-cobranca/
        │   ├── _squad.md
        │   ├── sistemas/
        │   │   └── regua-de-cobranca/
        │   │       ├── visao.md
        │   │       └── regras/etapas-da-regua.md
        │   └── jornadas/
        │       └── cliente-em-atraso.md
        │
        ├── squad-renegociacao/
        │   ├── _squad.md
        │   ├── sistemas/
        │   │   └── motor-de-acordo/
        │   │       ├── visao.md
        │   │       ├── apis/acordo-api-v1.md
        │   │       └── regras/elegibilidade-acordo.md
        │   └── jornadas/
        │       └── renegociar-divida.md
        │
        └── squad-canais/
            ├── _squad.md
            ├── sistemas/
            │   └── vitrine-de-credito/
            │       ├── visao.md
            │       └── componentes/
            │           ├── mfe-vitrine.md
            │           └── bff-vitrine.md
            └── jornadas/
                └── oferta-no-app.md
```

### Um documento e suas arestas

```yaml
# vault/squads/squad-limites/sistemas/motor-de-limite/visao.md
---
id: cred-motor-de-limite            # estável: não muda se a pasta mudar
tipo: sistema
dono: squad-limites
atualizado_em: 2026-11-26
relacoes:
  depende_de:  [cred-score-api, cred-cadastro-cliente]
  expoe:       [cred-limite-api-v2]
  implementa:  [regra-limite-minimo-pf, regra-reducao-por-atraso]
  decidido_em: [adr-0007-cache-de-limite]
  define:      [conceito-limite-de-credito]   # conceito vive em vault/tribo/dominio
---
```

As arestas cruzam squads (`cred-score-api` é da squad-score) e saem para a área comum. **Ler e apontar é livre;
alterar, não.**

### Mapa de donos e CODEOWNERS

```yaml
# vault/_meta/squads.yml
guardioes: "@org/vault-credito-pf-guardioes"
squads:
  squad-limites:       { time: "@org/vault-credito-pf-limites",       pasta: vault/squads/squad-limites }
  squad-score:         { time: "@org/vault-credito-pf-score",         pasta: vault/squads/squad-score }
  squad-contratacao:   { time: "@org/vault-credito-pf-contratacao",   pasta: vault/squads/squad-contratacao }
  squad-cobranca:      { time: "@org/vault-credito-pf-cobranca",      pasta: vault/squads/squad-cobranca }
  squad-renegociacao:  { time: "@org/vault-credito-pf-renegociacao",  pasta: vault/squads/squad-renegociacao }
  squad-canais:        { time: "@org/vault-credito-pf-canais",        pasta: vault/squads/squad-canais }
```

```
# .github/CODEOWNERS (gerado a partir de squads.yml; a última regra que casa vence)
*                                @org/vault-credito-pf-guardioes
/casca/                          @org/vault-credito-pf-guardioes
/vault/_meta/                    @org/vault-credito-pf-guardioes
/vault/tribo/                    @org/vault-credito-pf-guardioes
/.github/                        @org/vault-credito-pf-guardioes
/vault/squads/squad-limites/       @org/vault-credito-pf-limites
/vault/squads/squad-score/         @org/vault-credito-pf-score
/vault/squads/squad-contratacao/   @org/vault-credito-pf-contratacao
/vault/squads/squad-cobranca/      @org/vault-credito-pf-cobranca
/vault/squads/squad-renegociacao/  @org/vault-credito-pf-renegociacao
/vault/squads/squad-canais/        @org/vault-credito-pf-canais
```

`.github/` aqui é do **repositório do Vault**. A regra "`.github/` nunca é versionado" vale para o repositório do produto.

---

## Defesa da escolha

### 1. A pasta da squad decide quem altera, e o `id` decide quem o documento é

O requisito mais duro é a permissão: alteração fechada por squad. No Git, permissão se aplica por **caminho**
(CODEOWNERS, guarda no CI, regras de push). Por isso o primeiro nível dentro de `vault/squads/` é a squad: cada pasta
corresponde a um time, e a regra de permissão fica em uma linha.

O custo de organizar por squad é que squad muda (reorg, sistema que troca de dono, squad que acaba). Isso é
resolvido separando as duas coisas:

- **caminho = quem é o dono** (pode mudar);
- **`id` no frontmatter = identidade** (nunca muda);
- **links e arestas sempre por `id`**, nunca por caminho.

Se o `motor-de-limite` passar para a squad-score, move-se a pasta e troca-se o `dono`. Nenhum link quebra e o grafo
continua igual, com exceção da aresta `dono`.

### 2. A casca do plugin fica separada do conteúdo

O repositório é um plugin, mas o conhecimento não é do plugin: é da tribo. Por isso a raiz tem duas partes:

- **`casca/`**: manifesto, uma skill de consulta e os scripts. Dono: guardiões. Muda pouco.
- **`vault/`**: todo o conhecimento, em Markdown neutro. Donos: as squads.

Isso cumpre a regra "uma fonte, vários leitores": se amanhã o conteúdo precisar chegar ao Claude, Kiro ou Antigravity,
outra casca aponta para a mesma pasta `vault/`, sem mexer em nenhum documento. E a permissão fica limpa: nenhuma squad
precisa tocar na casca para documentar.

### 3. O conhecimento não vira skill nem instruction

O plugin tem **uma** skill (`consultar-vault`) que lê o grafo e devolve um recorte. Os documentos **não** são skills:

- uma ferramenta carrega a descrição de cada skill no contexto; centenas de documentos como skills viram ruído e
  gasto de tokens em toda conversa;
- conhecimento em formato de skill de uma ferramenta prende o Vault a ela;
- o Hive (F3) e a skill de consulta leem o mesmo `grafo.json` e o mesmo Markdown.

### 4. O comum é da tribo, não de uma squad

Glossário, ADRs transversais, padrões e sistemas usados por várias squads ficam em `vault/tribo/`, com dono nomeado
(os guardiões). Os motivos:

- **Uma definição por termo.** Se "limite de crédito" for definido em duas squads, o Vault reproduz exatamente a
  ambiguidade que ele deveria eliminar, e o Hive passa a ler duas verdades.
- **Evita que a squad mais ativa vire dona do que é de todos.**
- **Dá um lugar para o que não cabe em nenhuma squad**, sem criar uma "squad fantasma".

### 5. Um sistema, um dono

Se duas squads mexem no mesmo sistema, uma delas é a dona e a outra propõe mudanças por PR. Quando ninguém é dono
natural, o sistema vai para `vault/tribo/sistemas-compartilhados/`. Duplicar o documento é o pior caso: o grafo ganha
dois nós para a mesma coisa e as arestas se dividem.

### 6. Dentro da squad, organizado por sistema, e dentro do sistema, por tipo

`vault/squads/<squad>/sistemas/<sistema>/{componentes,apis,regras,decisoes}`:

- quem chega pelo ticket parte do sistema, e é assim que o discovery do Hive navega;
- o tipo de documento já fica claro pela pasta, o que facilita o validador e a geração da F1;
- `jornadas/` fica fora de `sistemas/` porque uma jornada atravessa vários sistemas, às vezes de squads diferentes.

### 7. O grafo é derivado, gerado no release

`vault/_meta/grafo/grafo.json` nunca é editado à mão:

- **no PR**, o `vault-check` valida o esquema, `id` duplicado, aresta para `id` inexistente, campo obrigatório ausente
  e nó órfão, sem gravar nada;
- **no release**, o workflow gera o `grafo.json` e o inclui na versão. Como o dev recebe o que foi publicado, o grafo
  que ele lê é sempre o da versão instalada, nunca um intermediário.

Gerar no PR e commitar faria cada PR de squad mexer num arquivo comum, com conflito entre squads o tempo todo.

### 8. A permissão é fácil de auditar

Cada pasta de squad aponta para um time do GitHub, e `vault/_meta/squads.yml` é a única fonte desse mapa (o
CODEOWNERS é gerado a partir dele). Para a auditoria, a pergunta "quem pode alterar o quê" tem resposta em um arquivo.

### 9. Combina com o Hive

- **F1 (gerar documento):** o gerador fica no Hive, não no plugin do Vault. O Hive sabe a squad do dev, escreve só em
  `vault/squads/<squad>/` num clone do repositório do Vault e abre o PR com a identidade do dev. O merge é portão humano.
- **F3 (consumir):** discovery e plano leem o `grafo.json` da versão instalada e os documentos vizinhos, com teto de
  tokens. O Hive funciona sem o Vault (só perde o contexto); um não depende do outro para instalar.
- **Uma fonte, vários leitores:** é tudo Markdown com frontmatter, sem depender de nenhuma ferramenta de IA.

## O que muda por o Vault ser um plugin

| Consequência | O que fazer |
| --- | --- |
| **Merge na main não chega ao dev.** Chega quando sai uma versão | O release é um portão a mais, dos guardiões. Definir a cadência (diária, semanal ou por demanda): mais frequente = Vault mais fresco e mais atualizações para o dev |
| **Ler = instalar.** O conteúdo vai para a máquina de todo dev que instala | Quem tem acesso ao marketplace lê tudo. Nada no Vault que não possa estar na máquina de qualquer dev com esse acesso. Isso responde, em parte, "leitura aberta para a BU ou só para a tribo" |
| **O release-please lê o título dos commits** | O `vault-check` barra PR com título fora do padrão (`docs(squad-limites): …`), senão a versão não sai ou sai errada |
| **Tudo é baixado a cada atualização** | Diagramas em Mermaid ou SVG leve, nada de imagem pesada nem binário. Pôr um teto de tamanho no `vault-check` |
| **O Hive precisa achar o Vault na máquina** | Testar onde o Copilot guarda o plugin instalado. Se o caminho não for estável, o Hive pede o caminho uma vez e grava no `bchive.json` |

## Alternativas avaliadas

| Alternativa | Por que não |
| --- | --- |
| **Por sistema ou domínio na raiz** (`vault/sistemas/motor-de-limite/`, com `dono:` no frontmatter) | Funciona bem no grafo, mas a permissão fica espalhada (uma linha de CODEOWNERS por sistema, que muda a cada sistema novo) e contradiz a decisão de organizar por squad. É a melhor segunda opção se a tribo tiver muita troca de dono |
| **Por tipo de documento na raiz** (`decisoes/`, `apis/`, `regras/`) | Todas as squads escrevem em todas as pastas. Permissão por caminho fica inviável |
| **Um repositório por squad** | Isolamento de escrita real, mas contradiz "um Vault por tribo", espalha links entre repositórios, multiplica plugins para instalar e exige criar repositórios, o que não está na nossa mão |
| **Pastas planas, com tags** | Sem caminho por dono, a permissão de alteração não tem onde se apoiar |
| **Conteúdo na raiz, junto com a casca** | Mistura o que é dos guardiões com o que é das squads e amarra o conteúdo ao formato de plugin de uma ferramenta |
| **Cada documento como skill** | Ruído e tokens em toda conversa, e o Vault fica preso a uma ferramenta |

## Custos e riscos assumidos

- **O instalador pode não copiar `vault/`.** Se o instalador do plugin só levar as pastas declaradas no manifesto
  (agentes, skills), o conteúdo não chega à máquina. **É o primeiro teste a fazer**, antes de qualquer documento:
  publicar uma versão de teste com um `.md` em `vault/` e conferir se ele aparece onde o plugin foi instalado.
- **CODEOWNERS controla quem aprova, não quem escreve.** Quem tem acesso de escrita no repositório abre PR em qualquer
  pasta, e um admin passa por cima. A guarda de caminho no CI deixa a regra explícita. Bloqueio real no push depende de
  regras de push por caminho, que precisam ser confirmadas com quem administra a organização.
- **A área comum e o release dependem de os guardiões existirem e responderem.** Sem eles, os PRs em `vault/tribo/` e
  as versões ficam parados.
- **Disciplina de `id`.** Se alguém linkar por caminho, uma reorg quebra o link. O validador precisa recusar link por
  caminho entre documentos.
- **Reorg ainda custa:** mover a pasta, trocar o `dono` e atualizar `squads.yml`. É barato, mas não é de graça.

## Em aberto

1. O OKF 0.2 define pastas, campos ou tipos? (pode mudar esta árvore)
2. O instalador do plugin copia pastas fora das declaradas no manifesto?
3. Leitura: quem tem acesso ao marketplace onde o Vault é publicado? Só a tribo ou a BU inteira?
4. Quem são os guardiões da área comum e do release, e qual a cadência de versão?
5. O plugin do Vault vai em qual marketplace, e quem administra times e proteções no GitHub?
