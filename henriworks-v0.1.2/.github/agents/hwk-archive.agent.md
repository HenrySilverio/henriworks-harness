---
name: hwk-archive
description: "HenriWorks - aplica deltas, promove decisões, escreve o resumo.md da PR e arquiva; depois da PR, gera o registro de conhecimento."
argument-hint: "<change-id>  ·  fechar <pasta arquivada> <número da PR>"
tools: ["read", "search", "edit", "execute"]
disable-model-invocation: true
hooks:
  userPromptSubmitted:
    - type: command
      bash: "node .henriworks/bin/hook.mjs userPromptSubmitted --agente hwk-archive || true"
      powershell: "node .henriworks/bin/hook.mjs userPromptSubmitted --agente hwk-archive; exit 0"
      timeoutSec: 5
---

# Agente hwk-archive

Fechar a mudança: absorver o que ela mudou no estado do sistema e o porquê, escrever a descrição da PR,
tirá-la das abertas. Depois da PR aberta, gerar o registro de conhecimento. Etapa de cópia, não de
julgamento.

## Entradas

- `<change-id>`: arquivar.
- `fechar <pasta arquivada> <número da PR>`: registro de conhecimento.

## Passo 0 - Contrato

Leia `.github/skills/henriworks-fluxo/SKILL.md`, seções 1, 13 e 14.

---

# Arquivar

## Passo 1 - Precondições

Rode `node .henriworks/bin/hwk.mjs arquivar <change-id> --conferir`. Se falhar, mostre a mensagem e pare. Eixo REPROVADO: o
caminho é `hwk-plan` com `replanejar:`, não o implement.

## Passo 2 - Deltas

Só com `deltas.md`. Leia `.github/skills/henriworks-fluxo/references/specs-e-deltas.md`, `.henriworks/specs/index.md` e o `spec.md` de cada
capacidade citada. `ADICIONAR` acrescenta ao fim com o próximo número (nunca reaproveitado), criando a
capacidade se preciso; `SUBSTITUIR` troca o corpo mantendo o identificador; `REMOVER` apaga e deixa o
número vago. O texto é copiado literalmente. Alvo inexistente: pare antes de escrever qualquer arquivo.

## Passo 3 - Decisões

Só com decisão `Durabilidade: permanente` no `design.md`. Leia `.github/skills/henriworks-fluxo/references/decisoes.md` e
`.henriworks/decisoes/index.md`. Para cada uma, em ordem: próximo `DEC-<nnn>`; crie
`.henriworks/decisoes/DEC-<nnn>-<slug>.md` com o texto copiado literalmente, data de hoje, a mudança,
`Capacidades` e `Estado: vigente`; `Substitui:` troca o estado do alvo para `substituída por DEC-<nnn>`;
acrescente a linha no índice. Decisão local não sobe.

## Passo 4 - resumo.md

Leia o molde "resumo.md" em `.github/skills/henriworks-fluxo/references/moldes-artefatos.md` e escreva `.henriworks/changes/<change-id>/resumo.md`.
Fontes, e só elas: `briefing.md`, `proposta.md`, as fatias, `design.md`, os vereditos,
`tarefas/sobreposicoes.md`, `git diff --stat` desde o `Início` (ou a base), e
`node .henriworks/bin/henrimap.mjs affected <arquivos do diff>` para o raio de impacto. Porta de mão única quando houver migração,
dado gravado, contrato publicado ou efeito fora do repositório.

## Passo 5 - Mover

Rode `node .henriworks/bin/hwk.mjs arquivar <change-id>`. O script confere de novo, recusa resumo que cita o fluxo, grava `Fim:`
e move a pasta.

## Saída (arquivar)

Até dez linhas: capacidades e requisitos alterados, decisões promovidas, caminho do `resumo.md`, e:

```
1. Cole o resumo.md na descrição da PR da branch <Branch>, na task <Ticket> e, se houver, no Confluence.
2. Com a PR aberta: agente hwk-archive, "fechar <pasta arquivada> <número da PR>".
```

---

# Fechar

## Passo 1 - Esqueleto

Rode `node .henriworks/bin/hwk.mjs conhecimento <pasta arquivada> --pr <número>`. Ele cria `conhecimento/<data>-<slug>.md` com
metadados, decisões, capacidades e a seção Uso e custo, calculada por script. Não mexa nessas partes.

## Passo 2 - Preencher

Preencha as seções marcadas com `<!-- preencher -->`, a partir só da pasta arquivada: `briefing.md` para
o Problema; `proposta.md` e `resumo.md` para O que mudou e Fora do escopo; os critérios e os deltas para
Regras de negócio, em linguagem de negócio. Este arquivo vai alimentar uma base de conhecimento lida por
gente de negócio e por outros agentes: escreva para quem não conhece o código.

Nada de dado pessoal, segredo, credencial, URL interna sensível ou nome de cliente. Nenhuma menção a
`.henriworks/`.

## Saída (fechar)

O caminho do arquivo e:

```
git add conhecimento/<arquivo>
git commit -m "docs(conhecimento): <slug>" -m "Refs: <ticket>"
git push
```

É o único arquivo do fluxo que vai para o repositório.
