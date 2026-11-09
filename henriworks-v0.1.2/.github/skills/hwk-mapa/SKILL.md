---
name: hwk-mapa
description: "Consulta o mapa do projeto antes de varrer arquivos."
argument-hint: "<query \"termos\" | explain <símbolo> | affected <arquivos> | path <A> <B> | resumo | status>"
disable-model-invocation: true
---
# /hwk-mapa

Utilitário: roda em qualquer agente com terminal.

Rode `node .henriworks/bin/henrimap.mjs` com o argumento recebido. Sem subcomando reconhecido, use
`query` com o texto inteiro. Mostre a saída sem resumir. Leia
`.github/skills/henriworks-fluxo/references/mapa.md` para interpretar EXTRACTED, INFERRED e AMBÍGUO.
