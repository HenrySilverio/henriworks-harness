Na ordem abaixo. Os comandos de terminal são no Git Bash.

**1. Confirme que a versão nova foi publicada**

O merge dispara a publicação no `bradesco-marketplace-unstable`. O marketplace estável só recebe depois que o PR de release do release-please for aprovado. Espere a versão nova aparecer no unstable antes de seguir.

**2. Limpe os restos dos testes, antes de instalar**

```bash
bash ~/Downloads/limpar-henriworks.sh --procurar ~/projetos            # só mostra
bash ~/Downloads/limpar-henriworks.sh --procurar ~/projetos --aplicar  # apaga
```

Troque `~/projetos` pela pasta onde ficam seus clones. O script tira o HenriWorks, o Atlas e a sondagem (`.bchive-probe/`) da sua pasta de usuário e dos repositórios. Não mexe no plugin instalado nem em `.bchive/`, que o `init` substitui.

**3. Troque a sondagem pela versão completa**

A sondagem tem o mesmo nome, `bia-credit-hive`.
1. No VS Code, na lista de plugins do Copilot, desinstale o `bia-credit-hive`.
2. Instale de novo pelo botão do README ou procurando no `bradesco-marketplace-unstable`.
3. Recarregue a janela: `Ctrl+Shift+P` › **Developer: Reload Window**.

Desinstalar e instalar é mais seguro que só atualizar: garante que nenhum arquivo da sondagem fique para trás. Para conferir:

```bash
grep '"version"' ~/.copilot/installed-plugins/*/bia-credit-hive/plugin.json   # a versão nova, não 1.0.1-dev.3
ls ~/.copilot/installed-plugins/*/bia-credit-hive/skills | wc -l               # 18
```

Se aparecer mais de uma pasta `bia-credit-hive`, ficou instalação duplicada: remova a antiga pela lista de plugins.

**4. Prepare cada repositório**

Abra a raiz do repositório. Abra um chat novo com o modo **Copilot** selecionado, não o Local. Escolha o agente **bchive** e envie:

```
/bia-credit-hive:init
```

O resultado esperado:
- nenhum item **GRAVE**;
- canário aprovado;
- item `instalacao-antiga` ok.

Se algum vier com aviso, o próprio `init` diz o que fazer. Pode mandar a saída para mim, que ela não tem conteúdo do projeto.

**5. Primeiro uso (opcional)**

Ainda no agente **bchive**:
- `/bia-credit-hive:squad-audit` mostra o custo e os conflitos das suas instruções.
- `/bia-credit-hive:start <o que você quer fazer>` diz por onde começar.