O erro não é o Node: é uma contradição nas instruções do próprio Hive, e o defeito é meu. O agente `bchive` tem a regra "edite só dentro de `.bchive/estado/`", e o `init` precisa gravar em `.bchive/bin/`, no `.git/info/exclude` e nos hooks locais do Git. O modelo leu a regra ao pé da letra e se recusou a rodar o script. O teste de fumaça não pega isso porque roda os scripts direto, sem modelo.

**Para usar agora, sem esperar a correção**
1. Copie o comando que o agente mostrou e rode no terminal do VS Code, na raiz do repositório. É o mesmo script; rodado por você, não há bloqueio.
2. Cole a saída no chat. O agente continua dali: canário e relatório final. Essa parte grava só em `.bchive/estado/`, então ele não recusa.

**A correção**
- **Agente `bchive`:** a regra passa a valer só para as edições que o próprio agente faz. Os scripts do fluxo (`init.mjs` e tudo em `.bchive/bin/`) gravam onde precisam, por design. O agente deve rodá-los e nunca recusar nem devolver para o dev por causa dessa regra.
- **Skill `init`:** diz explicitamente que rodar o script é o objetivo do comando, e que o limite de edição do agente não vale para ele.
- **README:** aproveitei e troquei "Node 20 ou mais" por "Node LTS atual (22 ou 24)", com a orientação para quem não tem.

Conferi os outros agentes: nenhum tem o mesmo conflito.

**Para subir**, no Git Bash, na raiz do clone do plugin:

```bash
git switch main && git pull
git switch -c fix/init-bloqueado
unzip -o ~/Downloads/bia-credit-hive-correcao-init.zip -d .
node testes/smoke.mjs        # esperado: 47/47
git add -A && git commit -m "fix: agente bchive roda o init em vez de recusar pelo limite de edição"
git push -u origin fix/init-bloqueado
```

Abra a PR para a `main`. Depois do merge e da publicação, atualize o plugin e rode o `/bia-credit-hive:init` de novo num chat novo.

Arquivos que te enviei:
- bia-credit-hive-correcao-init.zip — os 3 arquivos alterados
- bia-credit-hive-plugin-pr.zip — o plugin completo atualizado