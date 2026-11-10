# Atualização de 09/11/2026: preços e modelos liberados

Para quem já tem o **HenriWorks 0.1.2 instalado** num repositório. Esta atualização não reinstala nada
nem muda código: coloca a tabela de preços nova e a lista de modelos que o seu Copilot mostra.

Fonte dos números: VS Code > **Language Models**, coluna "Cost (Credits per 1M Tokens)", em 09/11/2026.

## O que tem nesta pasta

| Arquivo | Para quê |
|---|---|
| `precos.json` | Tabela de preços dos 15 modelos com preço na tela, em US$ por 1M tokens (créditos ÷ 100) |
| `modelos-liberados.json` | Os 17 modelos que aparecem no seletor (inclui Copilot Fusion e HydraFusion) |
| `aplicar.mjs` | Copia tudo para o lugar certo, com backup, e mostra o resultado |
| `LEIA-ME.md` | Este arquivo |

Também foi colocado `testes/semear-uso.mjs` no pacote, para gerar um painel de teste (seção 5).

## Onde cada arquivo vai

| Arquivo | Destino no Windows | Destino no macOS |
|---|---|---|
| `precos.json` | `C:\Users\<você>\.henriworks\uso\precos.json` | `/Users/<você>/.henriworks/uso/precos.json` |
| `modelos-liberados.json` | `<repositório>\.henriworks\modelos-liberados.json` | `<repositório>/.henriworks/modelos-liberados.json` |
| chave `"modelos"` | dentro de `<repositório>\.henriworks\henriworks.json` | dentro de `<repositório>/.henriworks/henriworks.json` |

- A **tabela de preços** fica no seu usuário, não no repositório. Ela vale para todos os repositórios
  da máquina e não é sobrescrita quando o harness for atualizado. Quando existe, substitui a tabela que
  vem no pacote.
- A **lista de modelos** fica dentro de `.henriworks/` do repositório, que já está no
  `.git/info/exclude`. Não vai para o Git.
- `<repositório>` é a pasta onde você rodou o instalador, por exemplo `recr-fed-agc-posvenda`.

> O repositório está em outra máquina (a do banco)? Leve esta pasta `atualizacao-2026-11-09` para lá
> junto com o pacote, ou só ela: o `aplicar.mjs` não depende de mais nada.

## 1. Jeito rápido: um comando

Abra o terminal **na raiz do repositório** e rode primeiro com `--dry-run`, que mostra o que vai mudar
sem escrever nada:

**Git Bash (Windows)**
```bash
node "/c/caminho/henriworks-v0.1.2/atualizacao-2026-11-09/aplicar.mjs" --dry-run
node "/c/caminho/henriworks-v0.1.2/atualizacao-2026-11-09/aplicar.mjs"
```

**PowerShell (Windows)**
```powershell
node C:\caminho\henriworks-v0.1.2\atualizacao-2026-11-09\aplicar.mjs --dry-run
node C:\caminho\henriworks-v0.1.2\atualizacao-2026-11-09\aplicar.mjs
```

**macOS (nesta máquina)**
```bash
node ~/Desktop/henriworks-harness/henriworks-v0.1.2/atualizacao-2026-11-09/aplicar.mjs --dry-run
node ~/Desktop/henriworks-harness/henriworks-v0.1.2/atualizacao-2026-11-09/aplicar.mjs
```

Fora da raiz do repositório, passe o caminho dele como primeiro argumento:
`node .../aplicar.mjs C:\src\recr-fed-agc-posvenda`.

O script:
1. confere os dois JSON e se o repositório tem o HenriWorks 0.1.2;
2. copia `precos.json` para a pasta de uso;
3. copia `modelos-liberados.json` para `.henriworks/`;
4. grava `"modelos": { "fonte": ".henriworks/modelos-liberados.json", "validadeDias": 30 }` no
   `henriworks.json`, sem mexer nas outras chaves;
5. roda `modelos atualizar` e mostra a lista cruzada.

Arquivo que já existia e muda ganha uma cópia `.bak-<data-hora>` ao lado. Rodar duas vezes não muda
nada na segunda.

## 2. Jeito manual (se preferir copiar você mesmo)

**PowerShell**
```powershell
$PACOTE = "C:\caminho\henriworks-v0.1.2\atualizacao-2026-11-09"
New-Item -ItemType Directory -Force "$env:USERPROFILE\.henriworks\uso" | Out-Null
Copy-Item "$PACOTE\precos.json" "$env:USERPROFILE\.henriworks\uso\precos.json"
Copy-Item "$PACOTE\modelos-liberados.json" ".henriworks\modelos-liberados.json"
```

**Git Bash ou macOS**
```bash
PACOTE="/c/caminho/henriworks-v0.1.2/atualizacao-2026-11-09"   # no macOS: ~/Desktop/henriworks-harness/henriworks-v0.1.2/atualizacao-2026-11-09
mkdir -p ~/.henriworks/uso
cp "$PACOTE/precos.json" ~/.henriworks/uso/precos.json
cp "$PACOTE/modelos-liberados.json" .henriworks/modelos-liberados.json
```

Depois abra `.henriworks/henriworks.json` e acrescente esta chave, com vírgula na linha anterior:

```json
"modelos": { "fonte": ".henriworks/modelos-liberados.json", "validadeDias": 30 }
```

E carregue a lista:

```bash
node .henriworks/bin/modelos.mjs atualizar
```

## 3. Conferir

Na raiz do repositório:

```bash
node .henriworks/bin/modelos.mjs            # lista: política × uso × preço
node .henriworks/bin/modelos.mjs conferir   # "nada grave" é o esperado
node .henriworks/bin/uso.mjs painel         # o bloco "Modelos" do painel já mostra os 17
```

O esperado na primeira listagem:
- **15 modelos com preço** e **Copilot Fusion e HydraFusion com "liberado sem preço"**. É o correto:
  a tela não mostra preço para os dois, e o harness não inventa.
- Todos com "liberado, sem uso no período" até você usar cada um.

## 4. Quando a tela de modelos mudar

Modelo novo, modelo que sumiu ou preço novo em **VS Code > Language Models**:
1. edite `precos.json` e/ou `modelos-liberados.json` desta pasta (em `precos.json`, créditos ÷ 100);
2. rode o `aplicar.mjs` de novo.

Se você não fizer nada em 30 dias, o `modelos conferir` avisa que a lista venceu.

Os `id` da lista são o nome que o OpenTelemetry costuma gravar. Se, depois de usar um modelo, ele
aparecer como **"usado, mas fora da lista"**, troque o `id` dele no `modelos-liberados.json` pelo nome
que o painel mostrar e rode o `aplicar.mjs` de novo.

## 5. Painel de teste, sem dados reais

Para ver o painel completo antes de existir uso real. Usa uma pasta separada e não mistura com os seus
dados.

**PowerShell**
```powershell
node C:\caminho\henriworks-v0.1.2\testes\semear-uso.mjs "$env:TEMP\hwk-uso-teste"
$env:HENRIWORKS_USO = "$env:TEMP\hwk-uso-teste"
Remove-Item Env:COPILOT_OTEL_FILE_EXPORTER_PATH -ErrorAction SilentlyContinue
node .henriworks/bin/uso.mjs painel
start "$env:TEMP\hwk-uso-teste\painel\index.html"
```

**Git Bash ou macOS**
```bash
node /c/caminho/henriworks-v0.1.2/testes/semear-uso.mjs /tmp/hwk-uso-teste
export HENRIWORKS_USO=/tmp/hwk-uso-teste; unset COPILOT_OTEL_FILE_EXPORTER_PATH
node .henriworks/bin/uso.mjs painel
# abra /tmp/hwk-uso-teste/painel/index.html no navegador
```

Feche esse terminal ao terminar: as variáveis valem só para ele.

## 6. Desfazer

Os backups ficam ao lado de cada arquivo, com o sufixo `.bak-<data-hora>`. Para voltar:
- **tabela de preços:** apague `~/.henriworks/uso/precos.json`. O harness volta a usar a tabela do pacote;
- **lista:** apague `.henriworks/modelos-liberados.json` e tire a chave `"modelos"` do `henriworks.json`,
  ou restaure o `henriworks.json.bak-*`.

## Limites que continuam

- **Copilot Fusion e HydraFusion** ficam sem preço até vermos como o OpenTelemetry grava uma chamada
  deles, e como entra o desconto de 30% do Fusion. Mande 2 ou 3 linhas do `copilot-otel.jsonl` de uma
  chamada com o Fusion para fechar isso.
- **Esta lista é a sua**, tirada do seu seletor. Para o time inteiro, a fonte oficial continua sendo a API
  de política de modelos, que pede permissão de admin: o papel `read_enterprise_ai_controls` ou o job
  do time de plataforma (README, seção 9).
- O **⚠** ao lado de alguns modelos na tela é aviso de instabilidade do serviço, não de política: não
  muda nada aqui.
