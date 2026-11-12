Now writing the changes: validator first.Now the contract, briefing template and procedures (grill/triagem, plan, review).Ajustei o harness, e o pacote passa no teste de fumaça (35 de 35 passos). O código continua sendo decisão sua; o HenriWorks não mexe no Git.

## O que mudou

**1. Rigor Lite como padrão de fato.**
- **Full só com gatilho:** a proposta precisa declarar `Gatilho:` com um dos seis casos do contrato, senão o `hwk validar` recusa. O plano pergunta antes de gravar Full, e `rigor: lite` na invocação mantém Lite.
- **Regra nova no contrato:** usar um campo que o contrato já expõe não é mudança de contrato. No seu ticket, foi isso que levou a Full.

**2. Regra das rodadas.**
- **Só `[bloqueante]` reprova** e justifica replanejar. `[importante]` e `[sugestão]` ficam com você.
- **Revisão sem REPROVADO:** a revisão diz que a spec pode ser aprovada e não sugere replanejar.
- **Menor mudança:** o replanejamento faz a menor alteração que resolve o achado, sem critério novo. Foi o critério 3 novo que gerou o pingue-pongue.

**3. Grill e triagem pedem os insumos** (entendi "tipagem" como triagem).
- **Tabela de insumos:** o briefing ganhou a seção `## Insumos`, com oito linhas:
  - ticket e critérios do PO;
  - Figma com a análise;
  - contrato de API por camada;
  - regras e limites;
  - estados e erros;
  - configuração;
  - exemplos;
  - dependências.
- **Situação de cada um:** `ok` (com onde está), `não se aplica` (com o motivo) ou `pendente` (com quem fornece).
- **O que o discovery pede:**
  - **Figma:** a análise salva em `figma.md`; ele já entrega o pedido pronto para o `design-to-code`.
  - **Contrato:** um para o MFE e outro para o BFF, separados, com a grafia exata dos campos.
  - **Exemplos:** pelo menos um caso com valores reais.
- **`hwk briefing <caminho>`** confere a tabela. Com insumo pendente, ou só o link do Figma, o plano não começa: ele lista o que falta, você entrega no chat e ele grava na pasta do briefing.
- **Briefing do formato anterior:** `/hwk-triagem <caminho do briefing>` completa o mesmo arquivo.

**4. `hwk descartar`.** Apaga a mudança e o estado dela: pacotes, reivindicações, edições e, com `--com-briefing`, o briefing. Também lista os commits. Sem `--aplicar` é só prévia, e o hook impede o agente de rodar o `--aplicar`.

## Passo a passo para remover a mudança atual

Na raiz do projeto, no seu terminal:

```powershell
cd "C:\Users\i459249\Documents\Projetos\Cockpit Agências\recr-fed-agc-jrnd-reneg"

# 1. pacote novo
node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .

# 2. prévia: o que sai e quais commits pertencem à mudança
node .henriworks\bin\hwk.mjs descartar GPCNLS-10019-limitar-vencimento-primeira-parcela --com-briefing

# 3. apaga a mudança, o estado e o briefing antigo
node .henriworks\bin\hwk.mjs descartar GPCNLS-10019-limitar-vencimento-primeira-parcela --com-briefing --aplicar
```

O `--com-briefing` vale porque você vai refazer o discovery com insumos. Sem ele, o briefing fica, e o `/hwk-triagem` pode completá-lo.

**4. Código.** A prévia lista os commits desde o `Início:` da proposta, sem merges, e os que citam o id. Escolha uma opção:

| Situação | Comando |
| --- | --- |
| Quer manter o código feito | nada; o plano novo parte dele |
| Quer desfazer e a branch já foi publicada | `git revert --no-edit <hashes da lista>` |
| Quer apagar e **nunca** deu push | `git reset --hard <Início>` (apaga de vez) |

O `e1cd23f` (merge da branch) fica de fora da lista de propósito. Não reverta um merge que trouxe a `main`.

**5. Conferir:** `node .henriworks\bin\hwk.mjs estado` não deve listar a mudança, e `git status` deve estar limpo.

## Depois: o plano novo

1. **Discovery.** Abra um chat novo com o agente `hwk-discovery` e rode `/hwk-triagem <texto ou caminho do ticket>`.
   - Ele vai pedir cada insumo.
   - Rode antes o `design-to-code` para gerar o `figma.md`.
   - Tenha à mão o caminho do tipo do response no MFE e o do contrato do BFF.
2. **Conferência.** `node .henriworks\bin\hwk.mjs briefing .henriworks\briefings\GPCNLS-10019-<assunto>\briefing.md` deve sair sem erro.
3. **Plano.** Abra um chat novo com o agente `hwk-plan` e rode `/hwk-plan <caminho do briefing> rigor: lite`.
4. **Revisão e aprovação.** Abra um chat novo com o agente `hwk-review` e rode `/hwk-review spec <id>`. Aprove pelo terminal, mesmo com `[importante]` em aberto.

O README e a documentação HTML descrevem os insumos, o rigor e o `descartar`.