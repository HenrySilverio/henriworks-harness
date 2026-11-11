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

O `init` caiu na hora de apagar uma pasta temporária, e o erro era do HenriWorks. Ele criava essa pasta dentro do projeto, em `.henriworks\estado\init-uso-teste`, para testar o hook. No Windows, quando o comando tentou apagá-la, algum programa ainda estava com ela aberta, e o `init` inteiro parou.

**Causa provável:** a pasta acabou de ser criada dentro do projeto, e no Windows isso faz algum programa abri-la por instantes. Não confirmei qual foi. Os suspeitos mais prováveis são:

- a extensão Jest-WS que aparece na sua barra de status, que vigia o projeto;
- o vigia de arquivos do próprio VS Code;
- o antivírus;
- o OneDrive, se a pasta Documentos estiver sincronizada.

**Correção no pacote novo:**

- A pasta de teste agora fica na pasta temporária do sistema, fora do repositório. Nenhum vigia do projeto a enxerga mais.
- A limpeza tenta 5 vezes e, se não conseguir, segue sem derrubar o comando. Fiz o mesmo na limpeza do `verificar.mjs`.
- O `init` também tenta apagar a sobra da versão anterior, `estado\init-uso-teste`.
- O teste de fumaça continua 27/27 aqui. Ele não roda no Windows, então não reproduz esse travamento: a prova é o `init` passar na sua máquina.

**O que fazer, de dentro do projeto:**

```powershell
cd "C:\Users\i459249\Documents\Projetos\Cockpit Agências\recr-fed-agc-jrnd-reneg"

node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .
node .henriworks\bin\hwk.mjs init
```

O `hwk.mjs` do projeto não foi alterado por você, então o instalador o atualiza sem conflito.

Se depois disso a pasta `.henriworks\estado\init-uso-teste` continuar existindo, ela não atrapalha mais nada, porque está fora do Git pelo exclude. Para tirá-la, feche o VS Code e rode:

```powershell
Remove-Item -Recurse -Force ".henriworks\estado\init-uso-teste"
```

Se nem com o VS Code fechado o Windows deixar apagar, o culpado é o antivírus ou o OneDrive. Nesse caso, vale tirar a pasta `Projetos` da sincronização do OneDrive, porque a mesma trava atinge `node_modules` e builds do Angular.

No Mac, o zip novo chegou na pasta `henriworks-harness/henriworks-v0.1.2`, mas não consegui extrair por cima: o Mac bloqueou a leitura e a gravação dos arquivos existentes. Lá a pasta ainda tem a versão de ontem; se for usar o Mac, extraia o zip manualmente.