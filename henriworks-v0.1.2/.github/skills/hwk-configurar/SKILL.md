---
name: hwk-configurar
description: "Ajusta .henriworks/verificacao.json e .henriworks/padroes.md ao que o repositório tem. Roda em qualquer agente com terminal, inclusive o padrão do Copilot."
argument-hint: "[verificacao | padroes]"
disable-model-invocation: true
---
# /hwk-configurar

Ajustar `.henriworks/verificacao.json` (o que o verificador roda em cada camada) e `.henriworks/padroes.md`
(o que a revisão audita) ao que este repositório tem. Roda em qualquer agente com terminal e edição,
inclusive o agente padrão do Copilot.

**O que este comando autoriza editar:** só `.henriworks/estado/verificacao.proposta.json` (quando o dev
pedir um ajuste) e `.henriworks/estado/padroes.proposta.md` (o rascunho). Os arquivos de verdade são
gravados pelo script, e só depois de um "ok" explícito do dev neste chat. Não edite
`.henriworks/verificacao.json` nem `.henriworks/padroes.md` à mão.

Sem argumento: verificação, depois padrões. Com `verificacao` ou `padroes`: só aquele.

## Verificação

1. Rode `node .henriworks/bin/configurar.mjs verificacao` e mostre a saída inteira: o que o repositório
   tem, as camadas propostas, o código fora delas e o diff para o arquivo atual.
2. Se houver "Código fora das camadas", pergunte, numa mensagem só, se alguma daquelas pastas deve
   entrar (mock e script de build normalmente ficam fora).
3. Rode `node .henriworks/bin/configurar.mjs verificacao --provar` e mostre a saída. Pode levar
   minutos: `tsc` e testes rodam de verdade.
   - `FALHOU`: diga a causa provável em uma linha, tirada da mensagem (tsconfig com outro nome, ESLint
     sem config, runner diferente), e proponha o ajuste.
   - `SEM ARQUIVO`: a camada não tem arquivo rastreado; proponha tirar a camada.
   - Ajuste aceito pelo dev: edite só `.henriworks/estado/verificacao.proposta.json`, mantendo `formato`,
     `classificacao` e os marcadores `{arquivos}`, `{arquivo}`, `{saida}` e `{raizes}`, que o
     `verificar.mjs` lê. Rode o `--provar` de novo.
4. Tudo `ok`: pergunte "Posso gravar o verificacao.json?". Só com sim, rode
   `node .henriworks/bin/configurar.mjs verificacao --gravar`.

"Achado" no `--provar` não é problema: prova que o comando roda e que a saída é lida.

## Padrões

1. Rode `node .henriworks/bin/configurar.mjs padroes`. Leia só as fontes que ele listar.
2. Escreva o rascunho em `.henriworks/estado/padroes.proposta.md`:
   - Título `# Padrões de código auditáveis`, seções por assunto, uma regra por linha, no imperativo.
   - Só regra que dá para conferir lendo um diff, sem julgar intenção.
   - Nada que o lint já pega (confira o `eslint.config`): formatação, ordem de import e estilo ficam fora.
   - Divergência do mapa (dois jeitos em uso na mesma camada): não escolha. Pergunte ao dev o padrão
     alvo de cada uma, todas numa mensagem.
   - Não marque `[grave]`. Liste as candidatas e pergunte.
   - Até cerca de 40 regras: o arquivo entra em toda revisão de código.
3. Mostre o rascunho e aplique o que o dev pedir. Só com "ok", rode
   `node .henriworks/bin/configurar.mjs padroes --gravar`.

O rascunho é proposta: regra que o time não combinou vira reprovação que ninguém aceita.

## Saída

Até cinco linhas: o que foi gravado, onde ficou o backup, o que ficou pendente e com quem.
