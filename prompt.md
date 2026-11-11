Rode o instalador da versão nova **a partir da pasta do projeto onde o HenriWorks está instalado**, apontando para o `instalar.mjs` da pasta extraída do zip. O repositório do pacote é só a origem dos arquivos. Os comandos do dia a dia (`uso.mjs`, `hwk.mjs`) rodam no projeto, que tem a própria cópia em `.henriworks\bin`.

No Windows, com o zip novo extraído em `C:\ferramentas\henriworks-v0.1.2` (troque pelo seu caminho):

```powershell
# 1. vá para o projeto onde o HenriWorks está instalado
cd C:\caminho\recr-fed-agc-jrnd-reneg

# 2. veja o que vai mudar, sem escrever nada
node C:\ferramentas\henriworks-v0.1.2\instalar.mjs repo . --dry-run

# 3. atualize
node C:\ferramentas\henriworks-v0.1.2\instalar.mjs repo .

# 4. confira a instalação
node .henriworks\bin\hwk.mjs init
```

O instalador:

- **Atualiza** os arquivos do HenriWorks que você não alterou (`.henriworks\bin`, agentes e skills), mesmo com o número de versão igual.
- **Não toca** no que é seu: `verificacao.json`, `padroes.md`, mudanças, specs e conhecimento.
- **Para com CONFLITO** se você editou algum arquivo do toolkit, sem sobrescrever. Nesse caso, me mande a lista antes de usar `--forcar`, porque ele descarta a sua edição.
- **Não faz commit nem usa rede.** Só escreve no `.git\info\exclude`, como na primeira instalação.

Depois de atualizar, ainda dentro do projeto:

```powershell
# relê os dois arquivos OTel com o importador novo e gera o painel
node .henriworks\bin\uso.mjs importar --refazer
node .henriworks\bin\uso.mjs painel

# diagnóstico do arquivo do settings.json (roda de qualquer pasta; gera diagnostico-uso.md onde você está)
node C:\caminho\do\diagnostico-uso.mjs --otel settings
```

No VS Code, abra um chat novo para carregar agentes, skills e hooks atualizados. Se você mudar o `github.copilot.chat.otel.outfile` no `settings.json`, feche e abra o VS Code: o exportador só lê essa configuração quando inicia.

Para testar o pacote antes de instalar, rode o teste de fumaça **na pasta do pacote**: `node testes\smoke.mjs`. Ele cria um repositório temporário e o apaga no final, sem mexer no seu projeto. O resultado esperado é `27/27 passos ok`.