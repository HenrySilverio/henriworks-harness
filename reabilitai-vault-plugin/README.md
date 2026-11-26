# reabilitai-vault

Vault de conhecimento da tribo, distribuído como plugin. Reúne, em Markdown, o que a tribo sabe sobre seus sistemas,
regras, decisões e jornadas, extraído do código, do Confluence, de e-mails e de outras fontes. Cada squad mantém a
sua parte; qualquer dev da tribo consulta tudo.

> **Antes de usar este README:** troque os nomes `squad-alfa` … `squad-epsilon`, os times `@org/…` e os campos entre
> `<…>` pelos valores reais. O formato dos documentos segue o padrão OKF 0.2; onde o padrão definir algo diferente
> deste README, vale o padrão.

## Sumário

1. [O que é](#o-que-é)
2. [Squads e donos](#squads-e-donos)
3. [Estrutura](#estrutura)
4. [O documento](#o-documento)
5. [Fontes](#fontes)
6. [Como contribuir](#como-contribuir)
7. [Quem altera o quê](#quem-altera-o-quê)
8. [Grafo e índice](#grafo-e-índice)
9. [Versões](#versões)
10. [Uso pelo b.IA Credit Hive](#uso-pelo-bia-credit-hive)
11. [Guardiões e contato](#guardiões-e-contato)

## O que é

- **Uma fonte de conhecimento por tribo.** Um sistema, uma regra, um termo: um documento só, com um dono só.
- **Markdown neutro.** Nada aqui depende de uma ferramenta de IA. O plugin só entrega o conteúdo e uma skill de
  consulta; qualquer leitor (pessoa, Copilot, Claude, outro agente) lê os mesmos arquivos.
- **Conhecimento destilado, não cópia.** O Vault guarda o que a fonte ensina e de onde veio. A fonte bruta (código,
  página, e-mail) fica onde está.
- **Distribuído como plugin.** Instalar o plugin baixa o conteúdo da versão publicada para a máquina do dev.

### Instalar

Pelo marketplace `<nome-do-marketplace>`, do mesmo jeito que o b.IA Credit Hive. Depois de instalar ou atualizar,
recarregue a janela do VS Code (**Developer: Reload Window**).

## Squads e donos

| Squad | Pasta | Time no GitHub | Foco |
| --- | --- | --- | --- |
| squad-alfa | `vault/squads/squad-alfa/` | `@org/reabilitai-vault-alfa` | `<sistemas e jornadas da squad>` |
| squad-beta | `vault/squads/squad-beta/` | `@org/reabilitai-vault-beta` | `<…>` |
| squad-gama | `vault/squads/squad-gama/` | `@org/reabilitai-vault-gama` | `<…>` |
| squad-delta | `vault/squads/squad-delta/` | `@org/reabilitai-vault-delta` | `<…>` |
| squad-epsilon | `vault/squads/squad-epsilon/` | `@org/reabilitai-vault-epsilon` | `<…>` |
| Guardiões da tribo | `vault/tribo/`, `vault/_meta/`, `skills/`, `.github/` | `@org/reabilitai-vault-guardioes` | Área comum, esquema, plugin e versões |

A fonte desta tabela é `vault/_meta/squads.yml`. O CODEOWNERS é gerado a partir dele.

## Estrutura

```
reabilitai-vault/
├── plugin.json                        # manifesto do plugin
├── README.md · CONTRIBUTING.md
├── release-please-config.json · .release-please-manifest.json
├── .github/
│   ├── CODEOWNERS                     # gerado de vault/_meta/squads.yml
│   └── workflows/                     # checagem do PR e release
├── skills/
│   └── reabilitai-vault/
│       ├── SKILL.md                   # consulta ao Vault (as regras ficam em vault/_meta/esquema)
│       └── scripts/
│           ├── grafo.mjs              # valida o esquema e gera o grafo e o índice
│           └── consultar.mjs          # vizinhança de um id, busca por tipo, dono ou fonte
└── vault/
    ├── index.md                       # GERADO no release · não editar
    ├── _meta/                         # guardiões
    │   ├── esquema/                   # tipos de nó, tipos de aresta, campos obrigatórios, tipos de fonte
    │   ├── squads.yml                 # squad → time → pasta
    │   └── grafo/grafo.json           # GERADO no release · não editar
    ├── tribo/                         # guardiões
    │   ├── dominio/                   # glossário e conceitos: um termo, uma definição
    │   ├── decisoes/                  # ADRs que valem para mais de uma squad
    │   ├── padroes/                   # padrões técnicos da tribo
    │   └── sistemas-compartilhados/   # sistemas usados por várias squads, sem dono natural
    └── squads/
        ├── squad-alfa/
        │   ├── _squad.md              # missão, repositórios, contato, sistemas que possui
        │   ├── index.md               # índice da squad
        │   ├── log.md                 # o que entrou, de qual fonte, quando
        │   ├── sistemas/
        │   │   └── <sistema>/
        │   │       ├── visao.md
        │   │       ├── componentes/
        │   │       ├── apis/
        │   │       ├── regras/
        │   │       └── decisoes/
        │   └── jornadas/              # jornadas que atravessam sistemas
        ├── squad-beta/                # mesma estrutura
        ├── squad-gama/
        ├── squad-delta/
        └── squad-epsilon/
```

Regras da estrutura:

- **A pasta da squad diz quem altera.** A identidade do documento é o `id` no frontmatter, nunca o caminho. Se um
  sistema mudar de squad, a pasta muda e nenhum link quebra.
- **Comum fica em `vault/tribo/`.** Glossário, ADR transversal e sistema compartilhado não ficam dentro de squad.
- **Um sistema, um dono.** Se outra squad precisa mudar algo, ela abre PR e o dono aprova. Não se duplica documento.

## O documento

Todo arquivo em `vault/` (fora de `_meta/` e dos arquivos gerados) começa com este frontmatter:

```yaml
---
id: alfa-motor-de-acordo             # estável, único na tribo, nunca muda
tipo: sistema                        # ver "Tipos de nó"
titulo: Motor de acordo
dono: squad-alfa
status: vigente                      # vigente | divergente | obsoleto
atualizado_em: 2026-11-26
fontes:
  - tipo: codigo
    ref: <repositorio>/src/acordo/elegibilidade.ts
    versao: <sha-do-commit>
    extraido_em: 2026-11-20
  - tipo: confluence
    ref: <id-da-pagina>
    versao: 14
    extraido_em: 2026-11-21
relacoes:
  depende_de:  [beta-score-api]
  expoe:       [alfa-acordo-api-v1]
  implementa:  [regra-elegibilidade-acordo]
  decidido_em: [adr-0003-parcelamento-minimo]
---
```

### Tipos de nó

| Tipo | O que descreve | Onde fica |
| --- | --- | --- |
| `squad` | A squad: missão, repositórios, contato | `squads/<squad>/_squad.md` |
| `sistema` | Um sistema ou serviço e o que ele faz | `squads/<squad>/sistemas/<sistema>/visao.md` |
| `componente` | Parte de um sistema (MFE, BFF, worker, job) | `…/<sistema>/componentes/` |
| `api` | Contrato exposto: operações, versões, consumidores | `…/<sistema>/apis/` |
| `regra` | Regra de negócio: condição, efeito, exceções | `…/<sistema>/regras/` |
| `decisao` | ADR: contexto, decisão, consequências | `…/<sistema>/decisoes/` ou `tribo/decisoes/` |
| `conceito` | Termo do domínio e sua definição | `tribo/dominio/` |
| `jornada` | Caminho do cliente ou do operador entre sistemas | `squads/<squad>/jornadas/` |

### Tipos de aresta

| Aresta | Significa |
| --- | --- |
| `dono` | Squad responsável (vem do campo `dono`) |
| `parte_de` | Componente → sistema, sistema → jornada |
| `depende_de` | Precisa do outro para funcionar |
| `expoe` / `consome` | Publica / usa uma API |
| `implementa` | Sistema ou componente → regra |
| `decidido_em` | Qualquer nó → ADR que o explica |
| `define` | Nó → conceito do glossário |
| `menciona` | Link no corpo do texto (gerada, aresta fraca) |

### Regras de escrita

- **Link sempre por `id`:** `[[beta-score-api]]`. Link por caminho é recusado pela checagem do PR.
- **Uma ideia por documento.** Regra com 3 exceções é um documento; 3 regras diferentes são 3 documentos.
- **A primeira frase responde o que o documento é.** Sem introdução.
- **Tipo novo ou aresta nova só com caso real**, proposto em PR para os guardiões em `vault/_meta/esquema/`.

## Fontes

O Vault junta conhecimento de várias origens. A regra é a mesma para todas: **sobe o que a fonte ensina, com a
referência de onde veio. A fonte em si não sobe.** Isso importa porque o plugin copia o conteúdo para a máquina de
todo dev que o instala.

| Fonte | Vira | Referência no `fontes` | Nunca sobe |
| --- | --- | --- | --- |
| **Código** (repositórios da squad) | `componente`, `api`, `regra`; o teste é lido como fonte de regra | repositório + caminho + commit | Código, teste, pipeline, configuração, segredo |
| **Confluence** | `sistema`, `decisao`, `jornada`, `conceito` | id da página + versão | Cópia da página, anexo |
| **E-mail** | `decisao` ou `regra` confirmada | data + área de origem + assunto em poucas palavras | O e-mail, nomes, endereços, dados de cliente |
| **Jira** | Contexto de `regra` e `decisao` | chave do ticket | Descrição inteira, comentários |
| **Reunião, Teams, ata** | `decisao` | data + fórum | Transcrição, gravação |
| **Documento** (Word, PDF, planilha) | `regra`, `conceito`, `api` | nome + local + versão ou data | O arquivo |
| **Especialista** (conversa) | Qualquer tipo | papel (não o nome) + data | — |

Regras para todas as fontes:

- **Nada de dado de cliente, dado pessoal, credencial ou segredo**, nem como exemplo. Use valores fictícios.
- **Pessoas aparecem pelo papel ou pela área**, não pelo nome: "PO da squad-alfa", "Jurídico".
- **Fonte com versão:** commit, versão da página, data do e-mail. É o que permite saber quando o documento ficou velho.
- **Fontes que discordam:** não escolha em silêncio. Registre as duas no `fontes`, marque `status: divergente` e
  explique a divergência numa seção `## Divergência`. A squad dona resolve.
- **Cada entrada vai para o `log.md` da squad:** data, documento, tipo de fonte.

Precedência quando as fontes discordam:

1. **Como funciona hoje:** o código vale mais que a documentação.
2. **Por que é assim:** a decisão registrada (ADR, ata, e-mail de decisão) vale mais que o código.
3. **O que deveria ser:** é proposta; não entra como `vigente` até virar decisão.

## Como contribuir

O passo a passo completo está no [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo, no Git Bash:

```bash
git checkout -b docs/squad-alfa/regra-elegibilidade
# edite só dentro de vault/squads/squad-alfa/
git add vault/squads/squad-alfa
git commit -m "docs(squad-alfa): regra de elegibilidade do acordo"
git push -u origin docs/squad-alfa/regra-elegibilidade
# abra o PR com título no mesmo formato do commit
```

A checagem do PR recusa quando:

- o PR mexe na pasta de mais de uma squad;
- o PR mexe em `vault/tribo/`, `vault/_meta/`, `skills/` ou `.github/` sem os guardiões;
- falta campo obrigatório, o `id` já existe ou uma aresta aponta para `id` inexistente;
- há link por caminho entre documentos;
- o título não segue `docs(<squad>): <o que mudou>` (o release depende disso);
- um arquivo passa do tamanho máximo (imagem pesada, binário). Diagramas em Mermaid ou SVG leve.

O merge exige aprovação do time dono da pasta (CODEOWNERS).

## Quem altera o quê

| Caminho | Quem aprova o PR |
| --- | --- |
| `vault/squads/<squad>/` | Time da squad |
| `vault/tribo/` | Guardiões |
| `vault/_meta/` | Guardiões |
| `skills/`, `plugin.json`, `.github/`, configuração do release | Guardiões |
| `vault/index.md`, `vault/_meta/grafo/` | Ninguém: são gerados no release |

Ler é livre para quem instala o plugin. Alterar segue a tabela.

## Grafo e índice

- `vault/_meta/grafo/grafo.json` (nós e arestas) e `vault/index.md` (lista das squads e seus índices) são
  **gerados no release** por `skills/reabilitai-vault/scripts/grafo.mjs`. Não edite à mão.
- Cada squad mantém o próprio `index.md`.
- Para ver um documento e seus vizinhos, peça à skill de consulta no chat ou rode no Git Bash:

```bash
node skills/reabilitai-vault/scripts/consultar.mjs vizinhos alfa-motor-de-acordo --saltos 2
node skills/reabilitai-vault/scripts/consultar.mjs listar --tipo regra --dono squad-beta
node skills/reabilitai-vault/scripts/consultar.mjs fontes --tipo confluence --mais-velhas-que 90d
```

## Versões

- O merge na `main` **não chega** à máquina do dev. Chega quando sai uma versão.
- O release-please abre o PR de versão a partir dos títulos dos commits. Os guardiões aprovam e publicam no marketplace.
- Cadência: `<diária | semanal | por demanda>`.
- O que entrou em cada versão fica no `CHANGELOG.md`.

## Uso pelo b.IA Credit Hive

- **Consulta:** no discovery e no plano, o Hive lê o grafo da versão instalada e os documentos vizinhos do sistema
  do ticket, com limite de tamanho.
- **Geração:** o Hive propõe documentos a partir do código da mudança, só na pasta da squad do dev, e abre o PR com
  a identidade do dev. O merge é aprovação humana; o agente nunca aprova.
- Um não depende do outro para instalar: o Hive funciona sem o Vault, só sem esse contexto.

## Guardiões e contato

| Papel | Time | Contato |
| --- | --- | --- |
| Guardiões da tribo | `@org/reabilitai-vault-guardioes` | `<canal no Teams>` |
| Dúvidas de uma squad | Time da squad (tabela [Squads e donos](#squads-e-donos)) | `_squad.md` da squad |
