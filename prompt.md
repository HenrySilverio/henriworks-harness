O erro era do pacote: eu tinha gerado o revisor `hwk-gf` com `disable-model-invocation: true`. O VS Code tira da lista de subagentes todo agente marcado assim, e por isso o chat respondeu `Unknown agent_type: hwk-gf`. O `hwk-implementador`, que tem `false`, aparece na lista da sua tela.

O canário fez o certo ao parar. Ele não aceitou simular o revisor com o `general-purpose`, porque isso daria uma prova falsa de isolamento.

**Correção no zip novo:**

- **`hwk-gf`:** agora é `user-invocable: false` (continua fora do seletor) com `disable-model-invocation: false`, ou seja, pode ser chamado como subagente.
- **`/hwk-init`:** acusa GRAVE (`subagentes`) se o `hwk-gf` ou o `hwk-implementador` estiverem travados.
- **Teste de fumaça:** passou a conferir esse frontmatter e está em 28/28.

**Trade-off:** com o revisor chamável, o agente padrão poderia, em tese, delegar ao `hwk-gf` por conta própria. Há duas proteções:

- O `hwk-gf` responde "Sem pacote…" e para diante de qualquer mensagem que não seja a linha do pacote.
- Depois que o canário passa, o `conferirPacote: "negar"` faz o hook bloquear qualquer prompt diferente do gerado pelo script.

**O que fazer no Windows, a partir da raiz do projeto:**

```powershell
cd "C:\Users\i459249\Documents\Projetos\Cockpit Agências\recr-fed-agc-jrnd-reneg"

node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .
node .henriworks\bin\hwk.mjs init
```

Você não mexeu no `hwk-gf.agent.md`, então o instalador troca sem conflito. Depois:

1. Rode "Developer: Reload Window" ou reabra o VS Code. A lista de agentes é lida quando o chat inicia.
2. Abra um chat **novo** com o agente `hwk` e rode `/hwk-canario`. A isca do chat anterior não vale, porque o canário precisa ser preparado e conferido no mesmo chat.
3. Se aparecer "Allow" para o subagente ou o terminal, aprove.

**Resultado esperado:** "canário passou", e o `hwk init` seguinte troca o canário de PENDENTE para ok. Se ainda aparecer `Unknown agent_type`, abra `.github\agents\hwk-gf.agent.md` e confira a linha `disable-model-invocation: false`. Se estiver certa e o erro continuar, me mande a lista de tipos que o chat mostrar.

**Para o painel:** esse chat do canário vale como o pedido real que faltava (Claude Haiku 5.5, 0,5 crédito na tela). Depois dele, rode `node diagnostico-uso.mjs` e `node .henriworks\bin\uso.mjs painel`. O painel deve mostrar esse 0,5 crédito, e esse número serve de conferência do valor que o Copilot cobrou.

A documentação HTML também foi atualizada.