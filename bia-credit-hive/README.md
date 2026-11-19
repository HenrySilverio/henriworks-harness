<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/bia-credit-logo-escuro.svg">
    <img src="docs/assets/bia-credit-logo.svg" height="64" alt="b.IA Credit">
  </picture>
</p>

# bia-credit-hive

b.IA Credit Hive: orquestrador de agentes para Spec-Driven Development no Copilot do VS Code e no GitHub Copilot app, organizado como uma colmeia — a rainha conduz a mudança e cada operária tem um papel (discovery, plano em fatias, implementação por fatia com os agentes da sua stack, revisão por um subagente que não viu a conversa, arquivamento e OK do QA) — do ticket do Jira até a PR, com portões humanos, relatório de uso só com contagens e tokens e o conhecimento de cada entrega guardado no repositório. Comandos /bia-credit-hive:*. Use em front-end, BFF, backend ou legado (COBOL, mainframe) da b.IA Credit para planejar, implementar, revisar ou fechar uma mudança.

<p align="center"><img src="docs/assets/banner.svg" width="900" alt="b.IA Credit Hive, plugin do GitHub Copilot: do ticket do Jira à PR com plano em fatias, revisor sem contexto e OK do QA antes de fechar. 9 agentes, 18 comandos, 5 portões humanos."></p>

## Onde usar

O melhor uso hoje é no **VS Code**, com o chat no harness Copilot, ou no **GitHub Copilot app**. O harness Local
não é suportado (nele o revisor recebe ferramentas que não deveria, e o canário reprova), e as outras
superfícies, como o Copilot CLI, ainda não foram validadas com o fluxo.

## Requisitos

- VS Code com o GitHub Copilot (chat no harness Copilot) ou o GitHub Copilot app.
- Node 20 ou mais no PATH do VS Code.
- Repositório Git aberto pela raiz.

## Como usar

> Ainda não instalou? Comece pela [Instalação](#instalação) e volte aqui.

<p align="center"><img src="docs/assets/flow.svg" width="900" alt="Fluxo: 1 Instalar pelo marketplace, 2 Preparar com :init, 3 Planejar com :plan, 4 Fatias com :implement, 5 Revisar com :review, 6 Fechar depois do OK do QA."></p>

### 1. Preparar o repositório (uma vez por repositório, e depois de cada atualização do plugin)

Num chat novo, selecione o agente **bchive** e envie:

```
/bia-credit-hive:init
```

Ele copia o núcleo para `.bchive/bin/`, cria os arquivos do time que faltam, põe `.bchive/` no
`.git/info/exclude`, constrói o mapa do código e roda o canário (a prova de que o revisor não recebe a
conversa). Pode rodar de novo quando quiser.

### 2. O fluxo

Uma fase por chat. Cada fase tem o seu agente; o comando só funciona com o agente certo selecionado.
Na dúvida, `/bia-credit-hive:start <o que você quer fazer>` diz o próximo passo.

| Fase | Agente | Comando |
| --- | --- | --- |
| Entender a dor ou o ticket | `bchive-discovery` | `/bia-credit-hive:grill <a necessidade>` ou `/bia-credit-hive:triagem <ticket>` |
| Decidir vendo funcionar | `bchive-prototipo` | `/bia-credit-hive:prototipo <a pergunta>` |
| Planejar | `bchive-plan` | `/bia-credit-hive:plan <caminho do briefing.md>` |
| Revisar a spec | `bchive-review` | `/bia-credit-hive:review spec <change-id>` |
| Aprovar a spec | você, no terminal | `node .bchive/bin/bchive.mjs aprovar-spec <change-id> --por "<seu nome>"` |
| Implementar (uma fatia por sessão) | `bchive-implement` | `/bia-credit-hive:implement <change-id>` |
| Revisar o código | `bchive-review` | `/bia-credit-hive:review <change-id>` |
| Arquivar e escrever a descrição da PR | `bchive-archive` | `/bia-credit-hive:archive <change-id>` |
| OK de quem testou | QA ou você, no terminal | `node .bchive/bin/bchive.mjs qa-ok <pasta arquivada> --por "<nome>" --ambiente "<ambiente>" --resultado "<o que passou>"` |
| Registro de conhecimento | `bchive-archive` | `/bia-credit-hive:fechar <pasta arquivada> <número da PR>` |

Comandos de terminal funcionam no Git Bash. Os agentes nunca rodam os portões humanos (aprovar a spec,
aceitar revisão reprovada, liberar rodada extra, OK do QA, descartar): o hook nega.

### 3. Se o QA achar erro depois do archive

Não reabra a mudança arquivada. Abra uma mudança nova e pequena na mesma branch e na mesma PR
(`/bia-credit-hive:start` com o erro), siga o fluxo dela, e quando o teste passar o `qa-ok` cobre as duas pastas
arquivadas de uma vez. Depois, `/bia-credit-hive:fechar` em cada uma.

### 4. Agentes de outros plugins

Se a sua máquina tem agentes de outras iniciativas (Java, Liberty, observabilidade, Angular, React, Swift…),
o plano lista os que encontrar, propõe um executor por fatia pela stack e só usa com o seu sim. Sem
confirmação, a fatia fica com o executor padrão do fluxo. Os portões (arquivos permitidos, verificação e
revisão isolada) continuam do fluxo para qualquer executor. `node .bchive/bin/bchive.mjs executores` mostra
os registrados e os descobertos.

### Personalização que você já tem (AGENTS.md, `.github/`)

O fluxo convive com o que já existe no repositório e na sua máquina: `AGENTS.md`, `.github/instructions/`,
`.github/copilot-instructions.md`, agentes, skills, prompts e hooks seus. Nada disso é exigido, nada disso é
criado ou editado pelo plugin, e nada disso trava o fluxo:

- arquivo não versionado em `.github/`, `.vscode/` e qualquer `AGENTS.md`/`CLAUDE.md` não versionado nunca
  conta como "alteração não commitada" (`node .bchive/bin/bchive.mjs arvore` mostra o que conta);
- em processo (fases, portões, Git, onde escrever, idioma dos artefatos) o fluxo vence; no jeito de escrever o
  código, valem as suas instruções;
- na revisão de padrões, só bloqueia regra declarada do time: `.bchive/padroes.md` ou os arquivos listados
  em `"instrucoes": { "doTime": [".github/instructions/time-*.instructions.md"] }` no
  `.bchive/bchive.json`. O resto pode ser preferência sua e vira no máximo `[importante]`.

### Auditoria do seu harness

No agente `bchive`, `/bia-credit-hive:squad-audit` lê a sua personalização (repositório, `~/.copilot/` e plugins
instalados), estima o custo fixo em tokens por pedido e aponta verbosidade, ambiguidade, conflitos entre
arquivos, o que falta para um resultado melhor e riscos (hooks, agentes, executores). Grava o relatório em
`.bchive/estado/auditoria/<data>/relatorio.md` com o texto `Antes`/`Depois` de cada sugestão. Só lê:
quem aplica é você.

### Preparar um agente seu para executar fatias (ex.: codificador Java)

`node .bchive/bin/bchive.mjs executores conferir` diz se cada agente está pronto. O que ele precisa:

1. Estar onde o harness Copilot enxerga: num plugin, em `~/.copilot/agents/` ou em `.github/agents/` do
   repositório. A pasta de prompts do perfil do VS Code só serve ao harness Local.
2. Poder ser chamado como subagente: `disable-model-invocation: false` (ou sem a chave).
3. `description` dizendo a stack e a camada, por exemplo `"Implementa BFF em Java 21 / Spring Boot com testes JUnit"`:
   é por ela que o plano propõe o agente para a fatia.
4. Ferramentas de leitura, edição e terminal (`tools: ["read", "search", "edit", "execute"]`).
5. Sem `agents`, `handoffs` ou `argument-hint` no frontmatter (o harness Copilot recusa).
6. No corpo, o bloco abaixo, para que as regras dele não passem na frente da fatia:

```markdown
## When called with a slice file
If the message points to a slice file (`.bchive/changes/<id>/tarefas/NN-*.md`), read it and only the
files in its `## Ponteiros`. Change only the paths in `Toca:`. Run the tests of what you changed. Do not
commit, push or create branches, and do not edit anything in `.bchive/`. End with: files changed;
whether the `Demonstra:` behavior happens; what you could not do or verify.
```

Para o time inteiro receber a proposta do mesmo agente, registre-o em `.bchive/executores.json`.

### Lições de uso: o que o time aprende fica

O que o uso ensina (o achado de revisão que se repete, o defeito que o QA pegou, a causa de um replanejamento,
a correção que você fez no agente) vira uma **lição**, nunca sozinho:

1. **Proposta.** No `/bia-credit-hive:fechar` o agente lê os sinais da mudança e propõe até três lições; a qualquer
   momento, `/bia-credit-hive:lembrar <o que lembrar>` propõe uma.
2. **Aprovação humana**, no terminal: `node .bchive/bin/bchive.mjs licoes aprovar P-1 --por "<nome>"`. O agente
   não consegue rodar.
3. **Versionada** em `conhecimento/licoes/`, um arquivo por lição, com tipo, escopo (pastas), origem, quem aprovou
   e data de revisão. Entra na PR como o registro de conhecimento.
4. **Lida só onde vale:** o plano e o executor consultam `licoes para <pastas da tarefa>`, com teto de tokens; na
   revisão de padrões, a lição do tipo regra é regra do time.
5. **Revisada:** `licoes revisar` e o `/bia-credit-hive:squad-audit` mostram lição vencida ou de pasta que não existe mais.

Preferência pessoal não é lição: fica nas suas instruções ou no Copilot Memory.

### Legado: COBOL, mainframe e outros

O fluxo não depende da linguagem. Em COBOL, JCL, PL/I, Natural, RPG, Delphi ou VB, o mapa do projeto não lê os
arquivos, então:

- as fatias dessas stacks vão para o agente que o time já usa para elas (prepare-o como na seção acima e confira
  com `node .bchive/bin/bchive.mjs executores conferir`);
- a verificação roda os comandos do time (compilação e teste, inclusive remotos) configurados no `verificacao.json`;
- o init avisa quantos arquivos de legado o mapa não cobre e, quando eles são maioria, desliga o "mapa antes de
  busca" naquele repositório.

O código precisa estar num repositório Git aberto no VS Code ou no Copilot app.

### Utilitários (qualquer agente com terminal)

| Comando | Para quê |
| --- | --- |
| `/bia-credit-hive:mapa <termos>` | onde fica, quem chama, o que quebra |
| `/bia-credit-hive:configurar` | ajusta `verificacao.json` e `padroes.md` ao repositório |
| `/bia-credit-hive:uso` | relatório de uso e adoção |
| `/bia-credit-hive:ticket` | mostra ou fixa o ticket do Jira da sessão |
| `/bia-credit-hive:canario` | repete a prova de isolamento do revisor |
| `/bia-credit-hive:adotar` | copia specs e decisões do `.sdd/` do HenriSpec |
| `/bia-credit-hive:squad-audit` (agente `bchive`) | qualidade e custo da sua personalização do Copilot |
| `/bia-credit-hive:lembrar <a lição>` | propõe uma lição de uso para o time aprovar |

## Uso e privacidade

Os hooks do plugin rodam em todo chat do harness Copilot, com ou sem o fluxo no repositório, e gravam em
`~/.bchive/uso/` (fora de qualquer repositório):

- sessão, turnos do agente principal e de subagentes, tempo total e ativo;
- nome de comando, skill, agente, subagente e ferramenta, e se é do plugin, de outro plugin, do dev ou chat
  solto;
- repositório, branch e ticket (pelo nome da branch), inclusive `main`;
- versões da spec revisadas por mudança (replanejamentos);
- tokens por sessão, só quando a telemetria do Agent Host estiver ligada pela TI.

Nunca grava prompt, resposta, código, argumento de ferramenta nem comando de terminal. Nenhum valor em
dinheiro, crédito ou preço de modelo. Os dias fechados são selados numa cadeia de hash
(`uso.mjs verificar-selos` acusa evento alterado). `uso.mjs exportar` gera o JSON agregado do período; o
envio para outro sistema ainda não existe.

Para tirar um repositório do relatório: `"uso": { "coletar": false }` em `.bchive/bchive.json`.

## Atualizar e remover

- Atualizou o plugin: rode `/bia-credit-hive:init` em cada repositório (o chat avisa quando o núcleo copiado
  está atrás da versão instalada).
- Remover de um repositório: apague `.bchive/`, o bloco `# >>> bchive` do `.git/info/exclude` e o mesmo bloco
  em `.git/hooks/post-checkout`, `post-merge` e `post-commit`. O que já foi commitado em `conhecimento/` fica.
- Desinstalar da máquina: remova o plugin na lista de plugins do Copilot (VS Code ou Copilot app). O relatório
  de uso local fica em `~/.bchive/uso/`; apague a pasta se não quiser guardá-lo.

## Estrutura do plugin

| Pasta | Conteúdo |
| --- | --- |
| `com.github.copilot/agents/` | os 9 agentes (`bchive-gf` e `bchive-implementador` só como subagentes) |
| `com.github.copilot/hooks/hooks.json` | 6 eventos, todos para `scripts/core/hook.mjs` |
| `skills/` | os 18 comandos; `init` traz o script de preparação, os moldes do time e as referências do fluxo |
| `scripts/core/` | o núcleo determinístico, copiado para `.bchive/bin/` pelo init |
| `testes/smoke.mjs` | teste de fumaça: `node testes/smoke.mjs` (sem rede, numa pasta temporária) |

Instruções para os agentes estão em inglês; artefatos, respostas e esta documentação, em português.

## Instalação

[![Instalar o plugin no GitHub Copilot app][badge-install-app]][install-app] [![Instalar o plugin no VS Code][badge-install-vscode]][install-vscode]

Antes da primeira release, o plugin só está no `bradesco-marketplace-unstable`: veja como testá-lo em [Teste antes da release](CONTRIBUTING.md#teste-antes-da-release).

Depois de instalar:

1. **Abra a pasta raiz do repositório** no VS Code (ou no Copilot app) e um **chat novo** no harness Copilot.
2. **Confira se o plugin carregou:** o seletor de agentes mostra `bchive`, `bchive-discovery`, `bchive-plan`,
   `bchive-review`, `bchive-implement`, `bchive-archive` e `bchive-prototipo`, e ao digitar `/bia-credit-hive:` aparecem
   os 18 comandos. Se não aparecerem, recarregue a janela do VS Code.
3. **Prepare o repositório**, com o agente **bchive** selecionado:

   ```
   /bia-credit-hive:init
   ```

   Ele copia o núcleo para `.bchive/bin/`, cria os arquivos do time que faltam, põe `.bchive/` no
   `.git/info/exclude`, monta o mapa do projeto e roda o canário. Termina com a lista de verificações; item
   **GRAVE** vem com o que fazer. Rode de novo depois de cada atualização do plugin.
4. **(Recomendado) Audite a sua personalização**, no mesmo agente:

   ```
   /bia-credit-hive:squad-audit
   ```

   Mostra quanto as suas instruções, agentes e hooks custam em tokens por pedido e o que conflita com o fluxo.
5. **Primeiro pedido:** `/bia-credit-hive:start <o que você quer fazer>` diz por onde começar.

Nada disso exige `npm install`, rede ou permissão de administrador, e nada vai para o Git do produto além de
`conhecimento/`.

<details>
<summary>Copilot CLI e Claude Code</summary>

No Copilot CLI:

```sh
copilot plugin install bia-credit-hive@bradesco-marketplace
```

O Claude Code não recebe o `bradesco-marketplace` da empresa, então adicione-o antes:

```text
/plugin marketplace add Bradesco-Automation/bradesco-marketplace
/plugin install bia-credit-hive@bradesco-marketplace
```

</details>

## Feedback

Se o plugin não funcionar ou faltar algo nele, conte ao [Reusable AI Creator](https://github.com/Bradesco-Automation/reusable-ai/tree/main/tech/reusable-ai) em uma conversa: ele leva o seu feedback aos responsáveis pelo plugin.

## Como contribuir

Está criando ou alterando este plugin? Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

[badge-install-app]: https://img.shields.io/badge/GitHub_Copilot_app-Instalar_o_plugin-8250DF?style=flat-square&logo=githubcopilot&logoColor=white&labelColor=24292F
[badge-install-vscode]: https://img.shields.io/badge/VS_Code-Instalar_o_plugin-0098FF?style=flat-square&logo=githubcopilot&logoColor=white&labelColor=24292F
[install-app]: https://github.com/copilot/app/launch?open=ghapp%3A%2F%2Fplugins%2Finstall%3Fsource%3Dbia-credit-hive%2540bradesco-marketplace
[install-vscode]: https://vscode.dev/redirect?url=vscode%3A%2F%2Fchat-plugin%2Finstall%3Fsource%3DBradesco-Automation%252Fbradesco-marketplace%2526plugin%253Dbia-credit-hive
