Antes não estava em checklist. A passagem trazia as 12 frentes numa tabela, e as melhorias de agentes, orquestração e experiência do dev cabiam numa linha solta. Agora a seção 6 é um checklist com 21 itens em cinco ondas, já atualizado no projeto e no zip da fonte:

| Onda | Itens | Por que nessa ordem |
| --- | --- | --- |
| 0 · pronto, só aplicar | PR da correção do init, versão estável no marketplace | Já está feito, só falta o merge |
| 1 · depende só de você | Métricas, progresso das fatias no chat, bloco "Próximo passo" padrão, tirar o ensino de instructions dos Fundamentos, Node LTS nas páginas | Não espera nenhum outro time |
| 2 · precisa de confirmação ou de dados | Perfil compartilhado do projeto, evals do revisor, modelo por fase, `/bia-credit-hive:tour` | O modelo por fase só se justifica com os números das métricas |
| 3 · depende de outro time | Vault com OKF (três frentes), fluxo de aprovação, agente de segurança, tokens por sessão | Espera material do Vault, do QA e PM, da Segurança e da TI |
| 4 · visão e alcance | Painel pessoal do dev, visão central, linha do tempo dos agentes, Hive em outras ferramentas | Usa o que as ondas anteriores entregam |

Das melhorias que sugeri antes, o histórico desta sessão só guardou seis: progresso das fatias, "Próximo passo" padrão, evals, modelo por fase, tour e painel pessoal. Se você lembra de mais alguma daquela resposta, me diga e eu incluo.

## Arquivos de uso para as métricas

Ficam em `~/.bchive/uso/`.

| Mandar | Arquivo |
| --- | --- |
| Sim, o principal | `eventos/AAAA-MM.jsonl` do mês |
| Sim, até 5 | `sessoes/<id>.json` |
| Sim, o mais recente | `exportar/<de>_<ate>.json` (gere antes com `node .bchive/bin/uso.mjs exportar`) |
| Sim, se existir | `consumo/AAAA-MM.jsonl` (tokens por chamada) |
| Não | `otel/copilot-otel.jsonl` (telemetria bruta), `selos/`, `cache/` |

O anonimizador já junta exatamente os quatro primeiros e troca repositório, branch, ticket, usuário e sessão por apelidos:

```bash
node anonimizar-uso.mjs --mes 2026-11
```

A saída vai para `~/Downloads/uso-anonimo/`. Abra os arquivos antes de mandar e confira que não sobrou nenhum nome. Confirme também se a política do banco permite enviar esse material para fora.

## Telemetria (tokens por sessão)

Da telemetria não preciso do conteúdo, só de saber se ela existe e quais campos ela tem. Este comando mostra a quantidade de linhas, o tamanho e os nomes dos campos, sem nenhum valor:

```bash
node -e '
const fs=require("fs"),p=require("os").homedir()+"/.bchive/uso/otel/copilot-otel.jsonl";
if(!fs.existsSync(p)){console.log("sem telemetria em "+p);process.exit()}
const l=fs.readFileSync(p,"utf8").split("\n").filter(Boolean),ks=new Set();
const w=(o,pre)=>{if(Array.isArray(o)){o.forEach(i=>i&&typeof i==="object"&&("key" in i?ks.add(pre+"["+i.key+"]"):w(i,pre+"[]")));return}
for(const k in o){const v=o[k],n=pre?pre+"."+k:k;v&&typeof v==="object"?w(v,n):ks.add(n)}};
l.slice(0,300).forEach(x=>{try{w(JSON.parse(x),"")}catch{}});
console.log(l.length+" linhas, "+(fs.statSync(p).size/1e6).toFixed(1)+" MB\n"+[...ks].sort().join("\n"))'
```

Se aparecer "sem telemetria", a TI ainda não ligou a telemetria na configuração gerenciada do Copilot. Nesse caso, a frente de tokens por sessão continua esperando a TI, e as métricas seguem só com contagens.
