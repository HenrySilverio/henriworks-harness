---
name: hwk-uso
description: "Painel de uso e custo, orçamento por mudança e configuração do OpenTelemetry."
argument-hint: "[painel | orcamento <change-id> <créditos> | configurar]"
disable-model-invocation: true
---
# /hwk-uso

Utilitário: roda em qualquer agente com terminal.

- Sem argumento, ou `painel`: rode `node .henriworks/bin/uso.mjs painel` e diga o caminho do HTML gerado.
- `orcamento <change-id> <créditos>`: rode `node .henriworks/bin/uso.mjs orcamento` com os argumentos.
- `configurar`: rode `node .henriworks/bin/uso.mjs configurar` e mostre a saída. Não use `--aplicar` sem
  o dev pedir: grava variável no usuário (Windows) ou um bloco marcado no ~/.zshrc ou ~/.bashrc (macOS, Linux).

Não interprete os números além do que a saída mostra. Nenhum valor de token ou custo vem de você.
