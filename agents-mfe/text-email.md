Dá para usar com ajustes, mas tem três erros que precisam sair antes de enviar:

1. **Os comandos estão com o nome antigo.** `/bchive-init`, `/bchive-configurar` e `/bchive-start` não existem no plugin. O certo é `/bia-credit-hive:init`, `/bia-credit-hive:configurar` e `/bia-credit-hive:start`. Quem copiar do e-mail vai ver o comando falhar logo no hands-on.
2. **"Mede o uso e o custo de cada task" está errado e é arriscado.** O Hive conta uso e tokens, nunca custo; dinheiro fica com o FinOps. Para o dev, "medir custo por task" soa como vigilância, e é justamente o que a governança diz que não fazemos. Vale dizer o contrário: não registra conversa nem código.
3. **"Instalação no repositório" mistura duas coisas.** O plugin é instalado uma vez na máquina, pelo marketplace. O `init` só prepara cada repositório.

Outros pontos que melhoram o resultado:

- **"Funciona no VS Code" está incompleto.** Funciona também no GitHub Copilot app. E o chat precisa estar no harness Copilot, porque no Local o canário reprova. Se alguém chegar no Local, o hands-on trava.
- **"É o agente" não descreve bem.** É um plugin com 9 agentes. "É o padrão" evita confusão.
- **"Substitui o HenriSpec em um pacote único"** passa a ideia de zip. Melhor dizer que substitui o HenriSpec e que quem já usa traz specs e decisões com `/bia-credit-hive:adotar`.
- **Falta uma lista do que trazer.** É o que mais garante o objetivo de "sair com instalado e validado". Sem isso, metade da sessão vai embora instalando Node ou procurando repositório.
- **A expectativa do item 5.** Um ticket real não fecha numa sessão: o fluxo vai até a PR e o OK do QA. Prometa chegar ao plano revisado; frustra menos.
- **Faltou o QA** entre as fases, e é um diferencial para os tech leads.
- **Ponto de atenção:** o hands-on depende de o plugin já estar publicado no marketplace. Se a PR ainda estiver só no `-unstable`, inclua esse passo no item 3 ou mande o link antes.

Texto revisado:

---

Olá, pessoal!

Estamos começando o **Programa de Adoção do b.IA Credit Hive** nas nossas squads. Ele passa a ser o padrão de desenvolvimento com IA na BU Crédito.

**Contexto:** o b.IA Credit Hive é um plugin do GitHub Copilot, para usar no VS Code ou no GitHub Copilot app. Ele leva uma demanda do ticket do Jira até a PR, em frontend, BFF ou backend, seguindo fases definidas: descoberta, plano, implementação, revisão e arquivamento. Quem escreve o código não é quem revisa, e a entrega só fecha depois do OK do QA. O Hive mede a adoção com contagens e tokens, sem registrar conversa nem código. Ele substitui o HenriSpec, e quem já usa traz as specs e decisões para o Hive.

**Objetivo do encontro:** sair da sessão com o b.IA Credit Hive instalado na máquina, o repositório de cada squad preparado e validado, e o fluxo de trabalho entendido.

**Pauta:**

1. Abertura: objetivo do programa e expectativa de adoção nas squads
2. Visão geral do b.IA Credit Hive: o que muda no dia a dia e como funciona o fluxo
3. Hands-on de instalação: plugin pelo marketplace e preparação do repositório com `/bia-credit-hive:init`
4. Ajuste dos padrões da squad com `/bia-credit-hive:configurar`
5. Primeiro uso com um ticket real do Jira, até o plano revisado (`/bia-credit-hive:start`)
6. Dúvidas e próximos passos

**Para aproveitar o hands-on, venha com:**

- VS Code com o GitHub Copilot funcionando, com o chat no modo Copilot (não o Local)
- Node 20 ou mais instalado (confira com `node -v` no terminal)
- O repositório da sua squad clonado e abrindo pela raiz
- Um ticket do Jira que você vai pegar em breve

Contamos com a presença de todos. Nos vemos lá! 🐝

Abs,
Meire

---

Se a sessão tiver duração definida, ponha os minutos ao lado de cada item da pauta. Ajuda quem conduz a não perder o hands-on para a visão geral.