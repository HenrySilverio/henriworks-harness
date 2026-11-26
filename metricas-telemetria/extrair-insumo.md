Os comandos estão abaixo, todos em Git Bash. Antes de rodar, uma coisa: li o `anonimizar-uso.mjs` e o hook e achei três falhas no anonimizador que afetam esta coleta.

- **Ignora `BCHIVE_USO`:** ele só lê `~/.bchive/uso/`. Se você usa essa variável, ele não vai achar seus dados.
- **Apelido muda a cada execução:** em execuções separadas, `repo-1` de outubro pode ser outro repositório que o `repo-1` de novembro. Para tendência entre meses, isso estraga a comparação.
- **Nome de MCP passa intacto:** o hook grava o nome da ferramenta, então nomes de servidor MCP internos saem como estão. O passo 4 confere isso.

Arrumo os três na F7. Para esta coleta, os comandos já contornam.

**1. Inventário (só tamanho, data e caminho relativo)**
```bash
node -v
find ~/.bchive/uso -type f -printf '%10s  %TY-%Tm-%Td  %P\n' | sort -k3
```
Cole a saída aqui. Assim eu sei quais meses existem e se há consumo ou OTel.

**2. Gerar o agregado e os tokens** (na raiz de um repositório onde o `init` já rodou)
```bash
cd /c/caminho/do/repositorio
ls ~/.bchive/uso/otel/ 2>/dev/null && node .bchive/bin/uso.mjs importar   # só faz algo se houver OTel
node .bchive/bin/uso.mjs exportar --de 2026-11-01 --ate 2026-11-26
```

**3. Anonimizar** (com o `anonimizar-uso.mjs` em `~/Downloads`)
```bash
cd ~/Downloads
node anonimizar-uso.mjs --mes 2026-11 --saida ~/Downloads/uso-anonimo
```
Se o inventário mostrar outubro, mande só novembro por enquanto, por causa dos apelidos.

**4. Só os nomes de campo do OTel** (sem nenhum valor; pule se não houver a pasta `otel/`)
```bash
node -e '
const fs=require("fs"),os=require("os"),d=os.homedir()+"/.bchive/uso/otel";const ks=new Set();
const w=(o,p)=>{if(Array.isArray(o))o.slice(0,5).forEach(x=>w(x,p+"[]"));else if(o&&typeof o==="object"){if(typeof o.key==="string"){ks.add(p+"{"+o.key+"}");return}for(const k in o)w(o[k],p?p+"."+k:k)}else ks.add(p)};
for(const f of fs.readdirSync(d).filter(n=>n.endsWith(".jsonl")))for(const l of fs.readFileSync(d+"/"+f,"utf8").split("\n").slice(0,3000)){try{w(JSON.parse(l),"")}catch{}}
console.log([...ks].sort().join("\n"))' > ~/Downloads/uso-anonimo/otel-campos.txt
```

**5. Conferir antes de mandar**
```bash
cd ~/Downloads/uso-anonimo
grep -rnoE '\b[A-Z][A-Z0-9]+-[0-9]+\b' . | grep -v TICKET- | sort -u | head   # esperado: nada
grep -rnoi "$USERNAME" . | head                                                # esperado: nada
grep -rnoE '[A-Za-z]:[\\/]+Users[^"]*|/c/Users[^"]*' . | head                 # esperado: nada
grep -rhoE '"ferramenta":"[^"]*"' . | sort | uniq -c | sort -rn | head -40     # confira os nomes de MCP
```
Se aparecer nome de repositório, branch ou servidor MCP interno, troque à mão antes de zipar.

**6. Zipar** (o Git Bash não tem `zip`, então use o tar do Windows)
```bash
cd ~/Downloads && /c/Windows/System32/tar.exe -a -cf uso-anonimo.zip uso-anonimo
```

Junto com o zip e a saída do passo 1, me diga três coisas para eu montar a F7 em cima da sua decisão:
- **Quem lê:** o dev (X4), a gerência ou a visão por squad (F8).
- **A pergunta:** qual pergunta a métrica tem que responder. Por exemplo: adoção, tempo dentro e fora do fluxo, onde o agente trava, ou ganho comparado a trabalhar sem IA.
- **A telemetria:** se a TI já ligou o OTel do Copilot. Sem isso, a F9 continua bloqueada e o relatório sai sem tokens.

Não mexi na passagem: ainda não fechamos nenhuma decisão.