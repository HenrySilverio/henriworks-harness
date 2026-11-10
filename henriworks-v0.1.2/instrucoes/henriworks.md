## HenriWorks Engineering Harness

Pedido simples se resolve direto, sem briefing nem mudança: teste quebrado, documentação, configuração,
lint, texto, correção pequena em poucos arquivos.

Quando o pedido tiver comportamento novo visível para o usuário, mexer em mais de uma camada, mudar
contrato entre camadas, envolver requisito regulatório ou de segurança, ou tocar muitos arquivos,
sugira o HenriWorks **uma vez, sem bloquear**: `/hwk-start` com o pedido diz o próximo passo. Se o dev
pedir para fazer direto, faça.

Os agentes `hwk-*` só agem quando selecionados. Fora deles, `.henriworks/` é só consulta: não crie nem
edite arquivos ali. Se o repositório também tem o HenriSpec, `.sdd/` continua dele: o HenriWorks só lê
`.sdd/specs` e `.sdd/decisoes`, nunca escreve.

Antes de varrer arquivos para achar onde algo está, consulte o mapa:
`node .henriworks/bin/henrimap.mjs query "<termos>"`.

Marcador de teste do HenriWorks: hwk-sentinela-agents.
