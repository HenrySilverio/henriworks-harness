Não apague tudo de uma vez. Dentro de `.henriworks/` está a base viva que você construiu: `specs/`, `decisoes/`, `glossario.md`, o `verificacao.json` e o `padroes.md` configurados, e o histórico das mudanças arquivadas. Leve isso para o Atlas antes, e só depois remova o HenriWorks.

Os comandos abaixo são para o Git Bash, rodando na raiz de cada repositório que tem o HenriWorks.

**1. Confira que não há mudança aberta**

```bash
node .henriworks/bin/hwk.mjs estado
```

**2. Leve a base viva e as suas configurações**

Faça isso antes de instalar o Atlas. Assim o instalador encontra os arquivos já no lugar e os mantém como seus, em vez de criar os modelos vazios.

```bash
mkdir -p .bcatlas
for f in specs decisoes changes briefings glossario.md padroes.md verificacao.json executores.json; do
  [ -e ".henriworks/$f" ] && cp -r ".henriworks/$f" .bcatlas/
done
cp .henriworks/henriworks.json .bcatlas/bcatlas.json
```

**3. Remova o HenriWorks do repositório**

```bash
rm -rf .henriworks .github/skills/henriworks-fluxo .github/skills/hwk-* .github/agents/hwk*.agent.md .github/hooks/henriworks.json
sed -i '/<!-- henriworks:inicio -->/,/<!-- henriworks:fim -->/d' AGENTS.md
sed -i '/# >>> henriworks/,/# <<< henriworks/d' .git/info/exclude
for h in post-checkout post-merge post-commit; do
  [ -f ".git/hooks/$h" ] && sed -i '/# >>> henriworks/,/# <<< henriworks/d' ".git/hooks/$h"
done
```

**4. Instale o Atlas e prove de novo**

```bash
node /c/Users/i459249/Documents/Projetos/<pasta>/bia-credit-atlas-v0.1.2/instalar.mjs repo .
```

Depois:

1. Rode **Developer: Reload Window**.
2. Num chat novo com o agente `bcatlas`, rode `/bcatlas-init`.
3. Rode `/bcatlas-canario`. O canário precisa passar de novo, porque o subagente revisor agora se chama `bcatlas-gf` e a prova anterior valia para o `hwk-gf`.

O mapa é refeito na pós-instalação.

**Uma vez só, fora dos repositórios**

1. Histórico de uso e custo, se quiser manter:
   ```bash
   mkdir -p ~/.bcatlas && mv ~/.henriworks/uso ~/.bcatlas/uso
   node .bcatlas/bin/uso.mjs configurar --aplicar
   ```
   O `configurar --aplicar` aponta as variáveis de OTel para a pasta nova. Feche e abra o VS Code depois.
2. Se você fez instalação global em algum momento, remova os arquivos do HenriWorks dela:
   ```bash
   rm -rf ~/.copilot/agents/hwk*.agent.md ~/.copilot/skills/hwk-* ~/.copilot/skills/henriworks-fluxo ~/.copilot/henriworks.lock.json
   ```
3. Por último:
   ```bash
   rm -rf ~/.henriworks
   ```
   Apague também a pasta do pacote `recr-cmn-henrispec2/henriworks-v0.1.2`. O HenriWorks público não é usado na máquina do banco.

**O que fica**

- Os `conhecimento/*.md` já commitados nos repositórios de produto: são documentação do produto.
- O `.sdd/` do HenriSpec.
- As suas `.github/instructions/*.instructions.md`.

A configuração gerenciada de telemetria (opção A) também não muda, porque o caminho dela não depende do HenriWorks.

Se forem muitos repositórios, posso juntar os passos 1 a 4 num script que mostra o que vai fazer antes de aplicar.

> node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-corrigir-valor-acordo --por "Henrique Silvério" --apesar "regra da API: sempre que há oferta parcelada, uma delas tem o desconto máximo (<fonte: contrato/BFF>); cenário do plantão não ocorre"