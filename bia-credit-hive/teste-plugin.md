O erro "não foi encontrado" é esperado. O `bradesco-marketplace-unstable` só recebe o plugin depois do primeiro merge na `main`, e até agora a `main` só tem o template. A ordem fica assim: PR, merge, uns 20 minutos de espera e aí a instalação pelo `-unstable`.

O clone do seu Mac aponta para o mesmo repositório (`Bradesco-Automation/bia-credit-hive-plugin`), mas se a sua conta só tem acesso pela máquina do banco, a PR sai de lá. Mandei um zip com os 9 arquivos da sondagem já nos caminhos certos, incluindo o README com o "Como usar" preenchido.

**No Windows do banco, no Git Bash**

1. Leve o `bia-credit-hive-sondagem-pr.zip` para a máquina do banco e extraia na raiz do clone:
   ```bash
   cd /c/Users/i459249/Documents/Projetos/bia-credit-hive-plugin   # ajuste para onde está o seu clone
   git checkout main && git pull
   git checkout -b chore/sondagem-formato
   unzip -o /c/Users/i459249/Downloads/bia-credit-hive-sondagem-pr.zip
   ```
2. Marque os scripts como executáveis. O CONTRIBUTING pede isso para os scripts que hooks rodam, e o Windows não grava essa marca sozinho:
   ```bash
   git add -A
   git update-index --chmod=+x scripts/probe-hook.mjs skills/bchive-init/scripts/init.mjs skills/bchive-init/assets/bin/bchive.mjs
   git status --short
   ```
   O `git status --short` deve listar o README alterado e os 8 arquivos novos.
3. Commit e push:
   ```bash
   git commit -m "chore: add plugin format probe"
   git push -u origin chore/sondagem-formato
   ```
4. Abra a PR para a `main` com o título **`chore: add plugin format probe`**.
   - O merge é squash, e o título vira o commit.
   - Com `chore:` não sai release, mas o plugin chega ao `-unstable`.
   - A aprovação precisa ser de outro code owner do time `reusable-ai-contributors`, não sua.
   - O merge acontece sozinho quando o CI passa.

**Se o CI reclamar de algo**, me mande o log. O `_plugin-ci` é do Reusable AI e eu não vi as regras dele. Os candidatos mais prováveis a dar problema:

- a pasta `com.github.copilot/`, que é onde o VS Code lê agentes e hooks;
- os scripts sem a marca de executável.

**Depois do merge, uns 20 minutos**

1. Instale pelo badge do VS Code do CONTRIBUTING, em "Teste antes da release". Se o plugin estiver instalado pelo `bradesco-marketplace`, desinstale antes.
2. No repositório `recr-fed-agc-jrnd-reneg`, num chat novo com o agente `bchive`, rode `/bchive-init`.
3. Num outro chat novo, de novo com o agente `bchive`, rode `/bchive-probe`.
4. Me mande o `.bchive-probe/relatorio.md`. Se for por foto, tudo bem.

Esse zip tem o mesmo conteúdo que já deixei no clone do Mac. Se a sua conta conseguir fazer push pelo Mac, dá para abrir a PR por lá e pular a parte de levar o zip.