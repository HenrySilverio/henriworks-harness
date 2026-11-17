O repositório veio do template do banco, com a estrutura dele: `plugin.json`, `CONTRIBUTING.md`, release-please e a pasta `.github/`. Antes de converter, preciso ver o template inteiro, porque é ele que define três coisas que não dá para adivinhar:

- onde cada tipo de arquivo fica: agentes, skills e hooks;
- o que a validação automática da pasta `.github/` aceita ou recusa, por exemplo script Node, hook que executa comando ou tamanho de skill;
- como a versão é controlada pelo release-please.

**1. Os arquivos do template, num arquivo só**

No Git Bash:

```bash
git clone <url-do-bia-credit-hive-plugin>
cd bia-credit-hive-plugin
for f in $(git ls-files); do echo "===== $f"; cat "$f"; echo; done > ../template-hive.txt
```

Anexe aqui o `template-hive.txt`. São poucos arquivos, então o texto é pequeno. O que mais importa ali:

| Arquivo | Por quê |
| --- | --- |
| `plugin.json` | Os campos e caminhos de agentes, skills e hooks: é o formato que vou seguir |
| `CONTRIBUTING.md` | As regras do marketplace para estrutura, nomes e o que o Reusable AI Companion confere |
| `.github/` (workflows) | A validação que roda em cada PR: o plugin precisa passar nela |
| `release-please-config.json` e o manifesto | Como a versão sobe: decide se começamos em 0.1.2 ou deixamos o release-please numerar |

**2. Três respostas que só você consegue ver**

1. **Como os comandos aparecem.** Abra o plugin que você já tem instalado (o "Plugins 1"), digite `/` no chat e veja se as skills dele aparecem como `/nome-do-plugin:skill` ou só como `/skill`. Se vier com o prefixo, `/bia-credit-hive:bchive-plan` fica redundante, e eu ajusto o nome das skills para `/bia-credit-hive:plan`.
2. **Onde vai rodar.** O README do template cita VS Code, Copilot CLI e Claude Code. O harness depende do subagente `task` e dos hooks do VS Code, e foi provado lá pelo canário. Minha proposta é publicar só para o VS Code nesta primeira versão, e você confirma.
3. **Node na máquina dos devs.** O núcleo é feito de scripts Node 20+. Confirme que todo mundo do time tem Node no PATH. Se alguém não tiver, o `/bchive-init` precisa detectar isso e explicar como instalar.

**Com isso em mãos, faço:**

- a conversão do pacote para o formato do template;
- o `/bchive-init` como bootstrap: copia para o repositório o `bin/`, os arquivos iniciais, o bloco do `exclude` e a referência de eixos do revisor;
- a marca Hive no gerador, para tudo sair com o nome novo;
- o "Como usar" do README, que o template pede;
- o teste de fumaça adaptado para o formato do plugin.

A ordem de publicação fica primeiro no `-unstable`, depois o canário, depois a release estável.