# Telemetria do Agent Host para o painel de uso do Copilot

Nov 11, 2026 · @Henrique Silvério

## Em uma frase

Pedimos à TI um arquivo de configuração do Copilot (`managed-settings.json`) nas máquinas dos devs, para o VS Code gravar localmente quanto cada conversa do chat usou de modelo e de tokens. Não grava prompt, código nem identidade. Hoje esse dado não existe em nenhum lugar da máquina, e sem ele não dá para medir custo por ticket nem comparar modelos.

## Por que precisamos disso

O chat do Copilot roda num processo chamado Agent Host, e a configuração pessoal de telemetria não chega até ele. A documentação do VS Code só prevê gravação em arquivo para o Agent Host por configuração gerenciada.

&#91;embedded content: onde cada parte do Copilot grava telemetria · hoje e com o pedido\]

Comprovamos na máquina do piloto. Com a telemetria pessoal ligada, o arquivo de hoje recebeu sugestões no editor, títulos e mensagens de commit, mas nenhuma conversa do chat. Enquanto isso, o próprio chat mostrava modelo, tokens e créditos de cada resposta.

## O pedido à TI

Um arquivo, gravado por administrador, com seis linhas de conteúdo. Ele não existe hoje nas nossas máquinas: conferido no Windows com `Test-Path`, que deu `False`.

| Sistema | Onde fica o arquivo |
| --- | --- |
| Windows | `%ProgramFiles%\GitHubCopilot\managed-settings.json` |
| macOS | `/Library/Application Support/GitHubCopilot/managed-settings.json` |
| Linux | `/etc/github-copilot/managed-settings.json` |

Conteúdo exato:

```json
{
  "telemetry": {
    "filePath": "~/copilot-telemetry/agent-host-otel.jsonl",
    "captureContent": false,
    "capture": {
      "identity": false
    }
  }
}
```

| Campo | Valor | Por quê |
| --- | --- | --- |
| `filePath` | `~/copilot-telemetry/agent-host-otel.jsonl` | Liga a gravação sozinho. O `~/` vira a pasta de cada usuário, então o mesmo arquivo serve para a máquina inteira. `%USERPROFILE%` e `$HOME` são rejeitados. A pasta é criada se faltar. |
| `captureContent` | `false` | Não grava prompt, resposta, código nem argumento de ferramenta. |
| `capture.identity` | `false` | Não grava nome de usuário nem de máquina. |

Já existe configuração gerenciada pelo servidor do GitHub na organização, mas sem bloco `telemetry`. Por isso o arquivo local vale hoje. O cache dela fica em `%LOCALAPPDATA%\Copilot\managed-settings.json`; é só cache, não é este arquivo, e não deve ser editado.

Requisitos:

- VS Code 1.143 ou mais novo. A máquina do piloto tem 1.146.0.
- Permissão de administrador para gravar em `Program Files`. Usuário comum só lê, e assim ninguém liga a captura de conteúdo por conta própria.
- Para o time inteiro, o mesmo arquivo distribuído pela ferramenta que a TI já usa nas estações. O piloto pode ser uma cópia manual numa máquina.

## O que é gravado e o que nunca é

Só metadados técnicos, num arquivo dentro da pasta do próprio dev. Nada sai da máquina: não há coletor, servidor nem envio pela rede.

| Gravado | Nunca gravado com esta configuração |
| --- | --- |
| Modelo que respondeu, inclusive quando o Copilot Fusion escolhe | Prompt, resposta e código |
| Tokens de entrada, de saída e lidos de cache | Argumentos e resultados de ferramentas, comandos, caminhos de arquivo |
| Duração da conversa e nome do agente | Nome de usuário, nome da máquina |
| Id técnico da conversa, repositório e branch | Conteúdo de arquivos abertos |

O painel do HenriWorks lê esse arquivo na mesma máquina e mostra tendência de uso, não ranking de pessoas. Juntar números de vários devs num lugar só é outro passo, que depende de aval de LGPD e não faz parte deste pedido.

## Piloto em uma máquina

O piloto passa quando o modelo e os tokens de uma conversa aparecem no arquivo, batendo com o "Response details" do chat, e nenhum prompt aparece.

1. A TI grava o `managed-settings.json` da seção anterior na máquina do piloto.
2. No VS Code, o dev roda **Developer: Policy Diagnostics** e confere que `telemetry` aparece com origem no arquivo gerenciado.
3. O VS Code reinicia o Agent Host sozinho. Se não reiniciar, o dev fecha todas as janelas e abre de novo.
4. O dev abre um chat novo, no harness Copilot, que é o padrão, e faz um pedido pequeno.
5. O dev confere que o arquivo existe e tem a conversa: `Select-String -Path "$HOME\copilot-telemetry\agent-host-otel.jsonl" -Pattern 'invoke_agent' | Measure-Object`
6. O dev confere que não há conteúdo. O resultado esperado é 0: `Select-String -Path "$HOME\copilot-telemetry\agent-host-otel.jsonl" -Pattern 'gen_ai.input.messages|gen_ai.output.messages' | Measure-Object`
7. O dev roda o diagnóstico do HenriWorks nesse arquivo, que só lista nomes de campo e contagens: `node diagnostico-uso.mjs --otel "$HOME\copilot-telemetry\agent-host-otel.jsonl"`
8. O dev compara modelo e tokens do diagnóstico com o "Response details" da mesma conversa.

Com o piloto aprovado, o importador do HenriWorks passa a ler esse arquivo e o painel mostra modelo e custo por conversa.

## Quem faz o quê

| Quem | Faz | Entrega |
| --- | --- | --- |
| TI de estações | Grava o arquivo no piloto e depois distribui para o time; deixa só leitura para o usuário | Arquivo nas máquinas e um jeito de desfazer |
| Segurança e governança | Aprova o que é gravado e o prazo de guarda | Aval escrito, com LGPD |
| Dev do piloto | Segue os 8 passos e manda o diagnóstico, que não tem conteúdo | Diagnóstico e comparação com o chat |
| HenriWorks | Ensina o importador a ler o arquivo do Agent Host | Painel com modelo e custo por conversa |
| Liderança do time | Decide se o piloto vira padrão | Decisão de expandir ou não |

## Riscos, como desfazer e perguntas em aberto

O maior risco é efeito colateral da configuração gerenciada, por isso o piloto vem antes de qualquer distribuição.

| Risco | O que fazer |
| --- | --- |
| Com configuração gerenciada do Copilot ativa, as integrações Claude e Codex do chat do VS Code ficam desligadas, segundo a documentação | Perguntar quem usa esses harnesses antes de expandir |
| O bloco `telemetry` gerenciado vence as configurações pessoais de OTel; na extensão, a variável de ambiente ainda vence o gerenciado | No piloto, conferir se o arquivo OTel atual da extensão continua recebendo dados |
| A documentação não fala de rotação nem de tamanho máximo do arquivo | Medir o crescimento no piloto e definir limpeza periódica |
| A documentação não mostra campo de crédito no Agent Host | Se não vier, o custo sai da tabela de preços, que é valor de lista e não o valor cobrado |
| O Agent Host é recente e o formato pode mudar | O importador do HenriWorks ignora campo desconhecido e o diagnóstico mostra o que mudou |

**Como desfazer:** remover `telemetry.filePath` do arquivo, ou apagar o arquivo. Para desligar sem apagar, usar `"enabled": false` dentro de `telemetry`. O VS Code reinicia o Agent Host sozinho quando a configuração muda.

**Perguntas em aberto:**

- [ ] TI: a ferramenta que distribui configuração nas estações consegue gravar um arquivo em `Program Files`?
- [ ] Administradores do Copilot no GitHub: a organização já usa configuração gerenciada pelo servidor (cache conferido em 11/11 na máquina do piloto). Hoje ela define marketplaces de plugins, modelo padrão e permissões, mas não tem bloco `telemetry`. Se passar a ter, ela fica com o bloco inteiro e este arquivo deixa de valer: avisar antes, ou levar o `filePath` para lá se o servidor aceitar.
- [ ] Governança: qual é o prazo de guarda aceito para o arquivo local?
- [ ] Time: alguém usa os harnesses Claude ou Codex no chat do VS Code?

## Glossário

| Termo | O que é |
| --- | --- |
| Harness | O motor que executa o agente do chat. O VS Code oferece Copilot (padrão), Local, Claude e Codex. |
| Agent Host | Processo separado do VS Code onde roda o harness Copilot. É nele que o chat acontece hoje. |
| Harness Local | Harness antigo, que roda dentro da extensão. Está em descontinuação: sai em fevereiro de 2027. |
| OpenTelemetry (OTel) | Padrão aberto para registrar o que um programa fez: chamadas, duração, tokens. |
| Span | Um registro de OTel de uma etapa, como a resposta de um modelo ou o uso de uma ferramenta. |
| JSONL | Arquivo de texto com um registro JSON por linha. |
| `managed-settings.json` | Configuração do Copilot definida pela empresa, que vence a configuração pessoal. |
| `captureContent` | Chave que, ligada, gravaria prompts e respostas. Aqui fica desligada. |
| `capture.identity` | Chave que, ligada, gravaria usuário e máquina. Aqui fica desligada. |
| Crédito | Unidade de consumo do plano do Copilot. O chat mostra quantos créditos cada resposta usou. |
| Painel do HenriWorks | Página local que junta uso por sessão, ticket e modelo, a partir dos hooks e do OTel. |

## Fontes

- [Monitoring agents with OpenTelemetry](https://code.visualstudio.com/docs/agents/guides/monitoring-agents), seção "Export managed telemetry to a file"
- [Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host)
- [Agent harnesses](https://code.visualstudio.com/docs/agents/run/agent-harnesses)
- [Manage AI settings](https://code.visualstudio.com/docs/enterprise/manage-ai-settings)
- [Chat debug view](https://code.visualstudio.com/docs/agents/agent-troubleshooting/chat-debug-view)
