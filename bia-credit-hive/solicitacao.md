Você tem razão: plugin, produto e comandos precisam ter o mesmo nome. Se alguém instala `bia-credit-spec-driven-delivery` e depois tem que digitar `/bchive-init`, não vai ligar uma coisa à outra. Segue o pedido com tudo em Hive.

**Título**
```
Pedido de plugin: bia-credit-hive
```

**Tipo:** Plugin: ferramentas e habilidades para agentes

**Nome do plugin**
```
bia-credit-hive
```

**Descrição**
```
Bia Credit Hive: orquestrador completo de agentes para Spec-Driven Development no Copilot do VS Code, organizado como uma colmeia — a rainha conduz a mudança e cada operária tem um papel (discovery, plano em fatias, implementação em paralelo, revisão por um subagente que não viu a conversa e arquivamento) — do ticket do Jira até a PR, com portões humanos e o conhecimento de cada entrega guardado como base viva de specs e decisões no repositório. Comandos /bchive-*. Use em front-end, BFF ou backend da Bia Credit para planejar, implementar, revisar ou fechar uma mudança.
```

Coloquei "Comandos /bchive-*" na própria descrição. Quem acha o plugin no marketplace já sabe o que digitar, e o agente associa o comando ao plugin.

**Como fica o nome em cada lugar**

| Onde | Nome |
| --- | --- |
| Plugin no marketplace | `bia-credit-hive` |
| Produto, documentação e marca | Bia Credit Hive (lockup BIA CREDIT \| Hive) |
| Comandos | `/bchive-init`, `/bchive-plan`, `/bchive-review`… |
| Agentes | `bchive`, `bchive-plan`, `bchive-gf`… |
| Pasta, CLI e mapa | `.bchive/`, `bchive.mjs`, `bchivemap` |

**Risco no nome do plugin:** a regra do formulário pede, depois do assunto, o que o plugin faz em inglês. `hive` é um nome de produto, não uma descrição, e a curadoria pode pedir ajuste. Se pedirem, a saída é `bia-credit-hive-delivery`, que mantém "hive" logo depois do assunto e não quebra a ligação com os comandos. Eu tentaria `bia-credit-hive` primeiro, porque é o mais simples para quem vai usar.

Não gerei nada ainda. Quando o repositório do plugin chegar, eu atualizo o perfil para Hive e gero o pacote, a documentação e o README no formato do template.