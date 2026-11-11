# Mapa do projeto

Referência de consulta. Leia antes da primeira consulta da sessão.

## Para que serve

Três perguntas, antes de abrir arquivo: o que já existe para reusar, onde fica, e o que quebra se eu
mexer aqui. Busca textual responde a primeira mal e as outras duas não responde.

## Como consultar

```
node .henriworks/bin/henrimap.mjs query "<termos>"          nós que casam e seus vizinhos
node .henriworks/bin/henrimap.mjs explain <símbolo|arquivo> onde está, o que usa, quem usa
node .henriworks/bin/henrimap.mjs affected <arquivos...>    quem depende do que vai mudar
node .henriworks/bin/henrimap.mjs path <A> <B>              como A chega em B
node .henriworks/bin/henrimap.mjs resumo                    o que existe, por pasta
```

Toda saída é cortada em 2.000 caracteres (`--budget <n>` para mais). Antes de responder, o mapa confere
o hash dos arquivos e reextrai só o que mudou: ele está sempre em dia com o working tree.

## Como ler a resposta

- `EXTRACTED`: lido direto do código ou do compilador. Confie.
- `INFERRED`: resolvido por nome, por padrão de framework ou por caminho de endpoint. Confira no código
  antes de afirmar.
- `AMBÍGUO`: o arquivo tem ligação que nenhuma análise estática resolve (token de DI por string, reflexão,
  evento, chamada dinâmica). Ali, leia o código.
- Sem resultado: o mapa não sabe. Aí sim, busca textual.

Camadas: L1 regex em qualquer linguagem; L2 compilador TypeScript do projeto e `jdeps` do JDK, quando
existem; L3 rotas lazy, remotes do Native Federation, endpoints Spring e OpenAPI, chamadas HTTP do front.
`henrimap.mjs status` diz quais estão ativas. Se o repositório tem `graphify-out/graph.json`, o mapa usa
o grafo do Graphify como está.

## Uso por fase

- **Plano**: `resumo` e `query` para escrever `Toca:` e `## Ponteiros` com caminho real; `affected` para
  dimensionar a fatia e achar chamador que o briefing não listou.
- **Implementador**: `explain` antes de criar qualquer coisa nova: o primeiro degrau é reusar.
- **Plantão**: `affected` vem no pacote.
- **Archive**: `affected` sobre os arquivos do diff para o Raio de impacto do `resumo.md`.

Nunca leia `.henriworks/mapa/graph.json` ou `cache.json`: é entrada de script, e custa o repositório
inteiro em token.
