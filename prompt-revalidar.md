O diff mostra que eu estava errado: **o texto da tarefa não mudou**. A linha da 3.5 é a mesma, só passou de `[ ]` para `[x]`. O agente só acrescentou a evidência, e a escreveu **sem recuo**: começa na coluna 0, em vez de dois espaços abaixo da tarefa. Os "+" sem número no diff são só a mesma linha longa quebrada na tela.

A versão anterior do pacote só reconhecia a evidência recuada. Sem recuo, a linha contou como texto da spec, e por isso o estado pediu revisão. Corrigi isso no zip novo: a evidência é reconhecida com ou sem recuo e fica fora do hash. O teste de fumaça agora inclui exatamente o caso do Windows e passa (36 de 36).

## Caminho certo

**1. Ajuste a evidência você mesmo**, para ficar em uma linha, apontando para a PR em vez do chat:

```markdown
- [x] 3.5 Conferência visual do calendário com o mock local (manual)
  Evidência: conferido por Henrique Silvério em 13/11/2026 no localhost com o mock do frontend; dias e meses fora do intervalo desabilitados (outubro e novembro/2026); capturas na PR
```

O recuo agora é opcional, mas deixe os dois espaços para manter o padrão. Tire o "anexadas neste chat": foi isso que o revisor marcou, e o chat não guarda nada.

**2. Instale o pacote e confira:**

```powershell
node C:\caminho\henriworks-v0.1.2\instalar.mjs repo .
node .henriworks\bin\hwk.mjs estado
```

- **O estado mostra `implement` com a fatia 04:** a revisão de spec que deu REPROVADO perde o efeito. A aprovação original volta a valer e a spec continua sendo a aprovada. Siga para a fatia 04 no `hwk-implement` e, no fim, rode a revisão de código.
- **Ainda mostra `revisao-spec`:** a fatia 01 provavelmente tem uma evidência em formato antigo. Aprove uma vez, registrando o motivo:
  ```powershell
  node .henriworks\bin\hwk.mjs aprovar-spec GPCNLS-10019-limitar-vencimento-intervalo --por "Henrique Silvério" --apesar "só a evidência da 3.5 mudou o hash (pacote antigo); texto das tarefas igual ao aprovado"
  ```

**3. Na PR**, anexe as capturas na seção "Evidências manuais" do `resumo.md` que o `hwk-archive` vai gerar.

Fica de pé a outra proposta, que ainda não fiz: guardar uma cópia da spec na aprovação, para o `hwk estado` mostrar **o que** mudou e não só "spec alterada". Nesse caso ela teria mostrado na hora que a diferença era só a evidência.