# Executores

Referência do `hwk-plan` e do `hwk-implement`. Leia quando uma fatia tiver executor diferente de
`hwk-implementador`.

## O contrato

O HenriWorks não precisa saber como um agente externo trabalha. Precisa de um contrato: o que entregar e o
que receber. Ele vive em `.henriworks/executores.json`:

```json
"design-to-code": {
  "tipo": "agente-externo",
  "quando": "tela nova ou alterada a partir de um frame do Figma",
  "entrada": ["caminho da fatia", "link do frame do Figma, na seção Ponteiros da fatia"],
  "saida": "arquivos alterados e a confirmação da linha Demonstra",
  "exige": ["agente design-to-code instalado", "MCP do Figma"],
  "revisao": "tres-eixos"
}
```

Incluir um agente é editar este JSON. Nenhum prompt muda.

## Regras

1. **No plano**, `Executor:` só recebe nome registrado, e a fatia traz em `## Ponteiros` tudo que o campo
   `entrada` pede. Fatia de executor externo segue as mesmas regras de qualquer fatia: vertical, `Toca:`
   declarado, critério observável.
2. **A entrada é a fatia.** O coordenador delega ao agente externo com o caminho da fatia e a instrução
   de ler os ponteiros dela. Nada da conversa do coordenador.
3. **A saída não é confiável por padrão.** Depois da sessão, `hwk conferir-toca` confere os arquivos
   alterados contra o `Toca:`, e a revisão de código julga a fatia como qualquer outra.
4. **Ausente não vira substituto.** Se o agente não existe na máquina, ou não aceita ser chamado como
   subagente (`disable-model-invocation: true`), o coordenador para e diz qual falta. Trocar em silêncio
   pelo `hwk-implementador` entrega algo que o plano não previu.
5. **Marcar `[x]` é do coordenador**, depois de conferir que a linha `Demonstra:` acontece. O agente
   externo não conhece o checklist.
