Configure o Windows para usar o **harness Copilot no dia a dia** e deixe o **Local só para diagnóstico** até fevereiro de 2027. O Copilot é o que fica. Ele também é o único em que as regras de sandbox e permissão gerenciadas pelo banco são de fato aplicadas, porque, segundo a documentação, o Local não as aplica.

## O que você viu, e por quê

| Harness | Onde roda | Agent Debug Logs | Seu OTel atual |
| --- | --- | --- | --- |
| Copilot | Agent Host | lista a sessão, mas veio zerada mesmo com `chat.agentHost.agentDebugLog.enabled` ligado (não está documentado; o painel é Preview) | não recebe nada; só pelo `managed-settings.json` (o documento da opção A) |
| Local | extensão | funciona, como você viu | funciona: `invoke_agent`, `chat` e tokens vão para o `copilot-otel.jsonl` |

## Configuração recomendada

**1. Harness padrão.** Não mexa em `chat.defaultToCopilotHarness` nem em `chat.editor.preferCopilotHarness`; o padrão já é o Copilot. Use o Local pelo seletor só quando precisar investigar algo, sabendo que ele se comporta diferente.

**2. `settings.json`.** Mantenha o que já está configurado:

```jsonc
"chat.agentHost.agentDebugLog.enabled": true,
"github.copilot.chat.otel.enabled": true,
"github.copilot.chat.otel.exporterType": "file",
"github.copilot.chat.otel.outfile": "C:\\Users\\i459249\\.henriworks\\uso\\otel\\copilot-otel.jsonl",
"github.copilot.chat.otel.captureContent": false
```

Dois cuidados:

- **Não ligue o `captureIdentity`.**
- **Não ligue o `chat.agent.sandbox.enabled` por conta própria.** Ele é experimental, e os pré-requisitos no Windows estão numa página que não li. Isso é conversa com a TI.

**3. Telemetria do chat.** Só pela opção A. Até lá, o arquivo da extensão mede o fundo e as sessões que você rodar no Local. Esse arquivo cresceu para cerca de 97 MB em dois dias, quase tudo linhas de métrica. Pode apagá-lo com o VS Code fechado; o importador recomeça do zero sem duplicar.

## HenriWorks no harness Copilot

| Item | Situação |
| --- | --- |
| Hooks em `.github/hooks/henriworks.json` | funcionam. O Copilot aceita os campos `bash` e `powershell`, e o `hook.mjs` lê os dois formatos de evento (`toolName`/`toolArgs` e `tool_name`/`tool_input`). |
| Canário e revisão isolada | validados com a ferramenta `task`. Rode o fluxo de revisão do HenriWorks **só no Copilot**: no Local, a delegação usa outra ferramenta e a trava do pacote pode não se aplicar. |
| Hooks no frontmatter dos agentes | a documentação diz que são preservados na conversão para o Copilot. |
| Skills `/hwk-*` | funcionam. Os comandos são `node …` e rodam no PowerShell. |
| Prompt files (`.prompt.md`) | só funcionam no Local. O HenriWorks não usa. Se você tiver prompt files próprios, eles precisam virar skills. |
| `.instructions.md` com `applyTo` e `AGENTS.md` | **falta conferir no Copilot**: a documentação diz que a descoberta de instruções muda por harness. |

## Checagens, nesta ordem

1. **Migrações:** **Chat: Open Customizations** → **Migrations**. Mostra o que o VS Code detectou que não roda no Copilot, como prompt files e agentes ou instruções guardados no seu perfil.
2. **Instruções:** num chat Copilot com um arquivo de `src/app/...` aberto, abra o menu de contexto do Chat → **Diagnostics** e confira se o `AGENTS.md` e as `.instructions.md` aparecem como carregados.
3. **Política efetiva:** **Developer: Policy Diagnostics**, para ver se já existe alguma política do Copilot aplicada na máquina.
4. **Sandbox e permissões:** `/sandbox policy` num chat Copilot.

Me mande o resultado de 1 e 2 (só nomes de arquivo, sem conteúdo). Se algo não migrar, eu ajusto o pacote. Também posso fazer o `/hwk-init` avisar quando a máquina estiver configurada para preferir o Local.