O limite de rodadas funcionou como foi feito para funcionar, mas está contando reprovações antigas. As 6 reprovações do eixo `spec` são de antes da nova régua de severidade e de commits anteriores. O código mudou desde então e a régua também. Nenhuma revisão foi feita ainda com as regras novas, então não faz sentido aceitar às cegas. Libere uma rodada.

**Agora, no Git Bash, na raiz do repo**

```bash
node .henriworks/bin/hwk.mjs rodada-extra GPCNLS-10019-limitar-vencimento-intervalo spec --por "Henrique Silvério"
```

Depois rode `/hwk-review GPCNLS-10019-limitar-vencimento-intervalo` de novo num chat novo do `hwk-review`. Ele revisa os três eixos com a régua nova: `padroes` e `plantao` ainda não têm veredito nesse commit, por isso não foram revisados.

**Depois da revisão**

- **Três aprovados:** siga para o `/hwk-archive`.
- **`spec` reprovado de novo:** leia o `[bloqueante]`.
  - Se for um bug que o diff introduziu, corrija pelo `hwk-plan` com `replanejar:`.
  - Se for fora da régua (outra camada, render do Liquid, pedido de mais evidência, algo que já existia), aceite:
    ```bash
    node .henriworks/bin/hwk.mjs aceitar-revisao GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "<motivo>"
    ```

O `aceitar-revisao` só funciona depois dessa rodada. Ele exige veredito de `padroes` e `plantao` no commit atual, e hoje não existe nenhum.

**Duas falhas do harness que esse caso mostrou**

1. **O limite conta veredito da régua antiga.** Ao trocar de régua, a contagem deveria recomeçar do zero. A correção é gravar a versão da régua no pacote e contar só as reprovações da versão atual.
2. **Um eixo no limite parou os outros dois.** O agente deveria revisar `padroes` e `plantao` mesmo com o `spec` travado. Assim você decide já com os três vereditos na mão.

Quer que eu corrija os dois no pacote? Para esta mudança não faz diferença: a liberação da rodada extra já resolve.