$f = $env:COPILOT_OTEL_FILE_EXPORTER_PATH
(Select-String -Path $f -Pattern 'invoke_agent' -SimpleMatch).Count
# mande UMA mensagem no chat, com o modelo fixo em Claude Sonnet 5.5, espere 30 s
(Select-String -Path $f -Pattern 'invoke_agent' -SimpleMatch).Count