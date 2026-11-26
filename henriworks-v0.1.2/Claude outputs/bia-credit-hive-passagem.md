# b.IA Credit Hive · documento de passagem

Atualizado em 26/11/2026 (checklist na seção 6; problemas de adoção em P3 e P4). Ponto de partida de qualquer chat novo sobre o Hive: o que existe, onde está, como gerar,
as regras que não mudam e o que está em aberto.

## 1. O que é

Plugin do GitHub Copilot (`bia-credit-hive`) que leva uma demanda do ticket do Jira até a PR com Spec-Driven
Development: discovery, plano em fatias, implementação por fatia (inclusive com agentes da stack do time), revisão
isolada em três eixos, portões humanos, OK do QA antes de fechar, lições de uso e relatório de uso só com
contagens e tokens. Melhor uso hoje: VS Code com o chat no harness Copilot, ou GitHub Copilot app.

**Escopo do projeto Hive no claude.ai:** tudo o que é do Hive ou se liga a ele: o plugin (agentes, skills, hooks, scripts),
a documentação (Hive e Fundamentos de IA) e o README, as métricas e a telemetria de uso, a geração de documentos para o
Vault (OKF 0.2) e o consumo do Vault pelo Hive, a adoção nas squads (onboarding, problemas de instalação) e o Hive em
outras ferramentas. Fica fora: design-to-code Liquid, setup de MFE web component e o harness de acessibilidade da
Mobile PF, a não ser que algum deles vire executor de fatia do Hive.

## 2. Estado em 25/11/2026

| Item | Situação |
| --- | --- |
| Plugin completo | Merge feito no repositório `bia-credit-hive-plugin` (organização Bradesco-Automation); publicado no `bradesco-marketplace-unstable` (1.0.1-dev.4) e instalado na máquina do Henrique |
| Release estável | Pendente: aprovar o PR de release do release-please e rodar o canário no Windows com a versão publicada |
| Correção do init | Pendente de PR (`fix/init-bloqueado`): o agente `bchive` recusava rodar o `init.mjs` por causa do limite de edição; zip `bia-credit-hive-correcao-init.zip` com 3 arquivos |
| Documentação | Site único (Fundamentos de IA + b.IA Credit Hive), `montar-docs.mjs`; sem lugar para publicar (sem SharePoint próprio, sem repositório novo, nada no repositório do plugin, OneDrive não renderiza): distribuição por zip no Teams; pacote `.aspx` pronto para quem tiver permissão no SharePoint |
| Teste de fumaça | 47/47 no núcleo e no pacote da marca |

## 3. Estrutura da fonte (este zip)

| Pasta | O que é |
| --- | --- |
| `plugin/` | Núcleo com nomes internos (`hwk`, `.henriworks/`, `/henriworks:`). Nunca vai direto para o banco |
| `plugin/scripts/core/` | Scripts Node sem dependência: `hwk.mjs` (CLI), `hook.mjs`, `licoes.mjs`, `uso.mjs`, `auditar.mjs`, `henrimap.mjs`, `verificar.mjs`, `configurar.mjs`, `mapear-padroes.mjs`, `lib/` |
| `plugin/com.github.copilot/` | 9 agentes e `hooks/hooks.json` (6 eventos) |
| `plugin/skills/` | 18 skills; `init/` traz o script de preparação, os moldes e as referências (`contrato.md`, `executores.md`…) |
| `plugin/testes/smoke.mjs` | Teste de fumaça (sem rede) |
| `marcas/gerar.mjs` + `marcas/bia-credit-hive/perfil.json` | Gera o pacote da marca: `hwk`→`bchive`, `.henriworks`→`.bchive`, `henriworks:`→`bia-credit-hive:`; falha se sobrar termo proibido |
| `marcas/bia-credit-hive/pacote/` | Arquivos sobrepostos no pacote (logos e SVGs do README em `docs/assets/`) |
| `marcas/bia-credit-hive/readme/` | `README-final.md` do plugin (composto à mão), `spec.json` e a skin `hive` da readme-skins |
| `marcas/bia-credit-hive/site/` | Documentação do Hive (páginas, diagramas, painel de uso de exemplo) |
| `marcas/bia-credit-hive/fundamentos/` | Fundamentos de IA (tokenizador real, calculadora, janela de contexto, carro do harness) |
| `marcas/bia-credit-hive/montar-docs.mjs` | Junta as duas documentações num site só, com entrada `ABRIR-AQUI.html` |
| `ferramentas/` | `anonimizar-uso.mjs`, `limpar-henriworks.sh`, `atualizar-plugin-json.mjs` |

## 4. Comandos

```bash
# pacote da marca (a partir da raiz da fonte)
node marcas/gerar.mjs pacote plugin marcas/bia-credit-hive/perfil.json dist/bia-credit-hive-plugin
cp marcas/bia-credit-hive/readme/README-final.md dist/bia-credit-hive-plugin/README.md   # o gerador sobrescreve o README
(cd dist/bia-credit-hive-plugin && node testes/smoke.mjs)                                  # esperado 47/47
grep -rniE "hwk|henriworks|henrimap" dist/bia-credit-hive-plugin                          # esperado: nada

# documentação (site único)
node marcas/bia-credit-hive/montar-docs.mjs saida-html --ext html --plugin dist/bia-credit-hive-plugin
node marcas/bia-credit-hive/montar-docs.mjs saida-sp   --ext aspx --plugin dist/bia-credit-hive-plugin
```

O motor de animação (`marcas/bia-credit-hive/motion-lite.js`, da skill html-motion) vem junto; `--motion <caminho>` troca.
Validação das páginas: `validate_page.py --mode split --run` da skill html-motion.

## 5. Regras que não mudam

- Idioma: o plugin é escrito em inglês (agentes, skills, hooks, código). README, documentação HTML e respostas no chat em português. Nos textos ao usuário, só nomes b.IA (`bchive`, `/bia-credit-hive:*`, `.bchive/`), nunca `hwk` ou HenriWorks.
- Comandos de terminal para o dev: Git Bash.
- No repositório do produto só sobe `conhecimento/`. `.github/` nunca é versionado; personalização do dev nunca trava o fluxo.
- **Uma fonte, vários leitores**: o banco abre espaço para Claude, Kiro, Copilot 365 e Antigravity. Não depender nem recomendar instructions de uma ferramenta; conhecimento em Markdown neutro (Vault e `conhecimento/`), lido por comando do Hive.
- O agente nunca roda portão humano (`aprovar-spec`, `aceitar-revisao`, `rodada-extra`, `qa-ok`, `licoes aprovar`, `descartar --aplicar`); o hook nega.
- Evidência manual é declaração (sem print, vídeo ou link).
- Uso: nunca prompt, resposta ou código; nada de dinheiro no relatório do Hive (valores com o FinOps); destino do relatório central em definição (não é o Jira).
- Harness Local não é suportado.
- Material com a marca do banco não vai para artifact do claude.ai: só arquivo.
- Sem permissão para: criar repositório na organização, publicar no SharePoint, colocar documentação no repositório do plugin.

## 6. Checklist de evolução

Marque `[x]` ao concluir e anote a data. Cada item diz o que destrava. A ordem das ondas é a sugestão de por onde partir:
primeiro o que já está pronto, depois o que depende só de você, por último o que depende de outro time.

### Onda 0 · pronto, só aplicar
- [ ] **E1** PR `fix/init-bloqueado` (zip `bia-credit-hive-correcao-init.zip`): agente roda o `init.mjs` sem recusar. Rodar o teste de fumaça e um `init` real antes do merge.
- [ ] **F10** Versão estável no marketplace: aprovar o PR de release do release-please, publicar e rodar o canário no Windows com a versão publicada.

### Onda 1 · depende só de você
- [ ] **P3** *Em debate (26/11). Bloqueia a adoção.* Preparação quebra em repositórios fora do padrão:
  - sem `package.json`, sem lint ou sem teste: `init`, `configurar` e canário falham;
  - workspace com mais de 50 pastas de log usadas para gerar mocks para FICO: canário e `configurar` dão erro sempre;
  - monolitos: o `init` falha sem mostrar o erro real, o chat só pede para repetir.
- [ ] **P5** Idioma dos scripts: hoje comentários, nomes de função, mensagens e subcomandos (`aprovar-spec`, `licoes`, `uso relatorio`) estão em português. Decidir: só código novo em inglês, ou migrar. Trocar subcomando quebra a documentação e o hábito de quem já usa; mensagens ao dev podem seguir em português.
- [ ] **P4** *Em debate (26/11).* No VS Code com o chat no harness Copilot, às vezes o chat não reconhece o Hive mesmo com o agente selecionado e visível na lista.
- Para o debate de P3 e P4, trazer: a saída de `init`, `configurar` e canário rodados à mão no Git Bash; a primeira camada do workspace (`command ls -1`) e se as pastas de log estão no `.gitignore`; a stack do monolito; versões do VS Code, da extensão Copilot Chat e do Hive; o log do painel Output → GitHub Copilot Chat no momento em que o agente não responde; se o problema some depois de "Developer: Reload Window".
- Hipóteses a testar (não confirmadas): o `init` e o `configurar` assumem projeto Node e varrem pastas grandes sem limite; o agente resume a falha em vez de repassar a saída do script; o agente do plugin carrega na abertura da janela, e instalar ou atualizar sem recarregar deixa o chat com a lista antiga.
- [ ] **F7** Refino das métricas de uso. Precisa de: arquivos de `~/.bchive/uso/` passados pelo `anonimizar-uso.mjs` (ver seção 9).
- [ ] **X1** Progresso das fatias na lista de tarefas do chat (fatia atual, feitas, faltando), atualizado pelo implementador.
- [ ] **X2** Bloco "Próximo passo" igual em toda fase: o que terminou, o comando seguinte e se é do dev ou do agente.
- [ ] **P1** Fundamentos sem ensinar instructions: card em `pecas`, boa prática em `contexto`; em `estudar`, a linha da tabela, o card 8, a trilha sênior e a fonte do Copilot. Trocar por "conhecimento em Markdown neutro, lido por comando".
- [ ] **P2** Node LTS 22 ou 24 também nas páginas de instalação da documentação (o README já tem).

### Onda 2 · precisa de uma confirmação ou de dados de uso
- [ ] **F11** Perfil do projeto em `conhecimento/projeto/` + comando `contexto <pastas>` + cópia no Vault. Precisa de: confirmar que `conhecimento/projeto/*.md` passa na regra do banco.
- [ ] **O1** Evals do revisor: repositório de exemplo com bugs plantados por eixo; mede quantos o revisor acha a cada mudança nos agentes.
- [ ] **O2** Modelo por fase (discovery e revisão num modelo mais forte, implementação no padrão). Precisa de: dados da F7 para provar ganho, e confirmar quais modelos a política libera.
- [ ] **X3** `/bia-credit-hive:tour`: passeio guiado numa mudança de exemplo, sem tocar no repositório real, para onboarding.

### Onda 3 · depende de material de outro time
- [ ] **F1** Documentos do Vault a partir do código, OKF 0.2, no formato do validador da esteira (teste, pipeline e configuração não sobem; teste pode ser lido como fonte de regra). Precisa de: padrão OKF 0.2, fluxo e regras do validador.
- [ ] **F2** Atualizar o Vault sob demanda (mudança que não passou pelo Hive). Depende da F1.
- [ ] **F3** Projetos conectados ao Vault; grafo Vault + mapa do código no discovery e no plano. Precisa de: como o Vault expõe o conteúdo e quem publica.
- [ ] **F4** Fluxo de aprovação por mudança (QA, PM, os dois…), perguntado no discovery ou no plano. Precisa de: 2 ou 3 exemplos reais.
- [ ] **F5** Agente de segurança: revisão de código e dependências; pentest só com autorização. Precisa de: checklist com o time de Segurança.
- [ ] **F9** Tokens por sessão. Precisa de: TI ligar a telemetria (OTel) do Copilot na configuração gerenciada.

### Onda 4 · visão e alcance
- [ ] **X4** Painel pessoal do dev (o próprio uso, sem comparação com outros). Usa a F7.
- [ ] **F8** Visão central do uso por squad. Precisa de: destino definido (não é o Jira).
- [ ] **F6** Linha do tempo visual do caminho dos agentes numa mudança.
- [ ] **F12** Hive em outras ferramentas (Claude, Kiro, Antigravity). Precisa de: canário de isolamento do revisor em cada uma.

Legenda: **E** entrega pronta · **F** frente de evolução · **O** agentes e orquestração · **X** experiência do dev · **P** pendência pequena.

## 7. Lições de uso (já implementado)

Sinais → proposta (`/bia-credit-hive:lembrar` ou no `fechar`, até 3) → aprovação humana (`licoes aprovar P-n --por`) →
`conhecimento/licoes/L-<data>-<assunto>.md` → leitura por escopo com teto de 1.200 tokens (`licoes para`) → regra do time na
revisão de padrões → `licoes revisar` e `squad-audit` apontam vencidas.

## 8. Como retomar

Abra o chat com: este documento, o zip da fonte e o material da frente (por exemplo, o padrão OKF ou os arquivos de uso).
Peça para descompactar a fonte, rodar o teste de fumaça e só então mexer. Uma frente por chat.

## 9. Métricas e telemetria que existem hoje no Hive

Esta é a base da F7 e da F9. Documentos de métricas anteriores ao Hive não valem aqui.

- **Coleta:** o hook (`hook.mjs`) roda em todo chat do harness Copilot onde o plugin está instalado, com ou sem fluxo no repositório. Grava só nomes, contagens e carimbos: sessão, turno do agente ou do subagente, comando e skill (só o nome), ferramenta (nome e categoria: leitura, busca, escrita, terminal, mapa, comando do Hive, skill, subagente, MCP, outra), repositório, branch e ticket. Nunca grava prompt, resposta, argumento de ferramenta, resultado nem texto de comando. Se o hook falhar, a sessão segue sem decisão.
- **Configuração:** `uso.coletar` (padrão ligado) e `uso.inativoMin` (5 minutos sem atividade encerram o tempo ativo).
- **Tokens:** só existem se a TI ligar a telemetria (OTel) do Copilot na configuração gerenciada. `uso.mjs importar` lê o arquivo OTel e grava tokens por chamada (entrada, saída, cache lido e gravado, raciocínio), separando chamadas de fundo (autocomplete, mensagem de commit, embeddings). Sem telemetria, o relatório sai sem tokens e diz isso.
- **Comandos** (`node .bchive/bin/uso.mjs …`): `relatorio [--de] [--ate] [--json]` (sessões, turnos, dentro e fora do fluxo, tempo, tokens); `resumo <change>` (seção "Uso" do resumo e do registro de conhecimento); `exportar` (JSON agregado do período, base do envio futuro); `selar` e `verificar-selos` (cadeia de hash por dia fechado, para provar que o histórico não foi alterado).
- **Sem dinheiro:** nenhum valor em reais, crédito ou preço de modelo. Isso fica com o FinOps.

## 10. Arquivos de uso (para a F7 e a F9)

Ficam em `~/.bchive/uso/` (ou na variável `BCHIVE_USO`), fora de qualquer repositório.

| Arquivo | O que tem | Mandar? |
| --- | --- | --- |
| `eventos/AAAA-MM.jsonl` | Um evento por linha gravado pelo hook: sessão, turno, agente, ferramenta, fase, portão, carimbo | Sim, o principal |
| `sessoes/<id>.json` | Estado agregado de cada sessão | Sim, até 5 |
| `exportar/<de>_<ate>.json` | Agregado do período (`uso.mjs exportar`) | Sim, o mais recente |
| `consumo/AAAA-MM.jsonl` | Tokens por chamada, importados da telemetria | Sim, se existir |
| `otel/copilot-otel.jsonl` | Telemetria bruta do Copilot | Não. Só a lista de campos, sem valores |
| `selos/`, `cache/` | Integridade e controle interno | Não |

Gerar o pacote: `node anonimizar-uso.mjs --mes AAAA-MM` → `~/Downloads/uso-anonimo/`. Conferir antes de mandar.
