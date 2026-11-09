#!/usr/bin/env bash
# HenriWorks - instalador para Git Bash, Linux e macOS. Toda a lógica está em instalar.mjs.
#
#   bash <pasta-do-pacote>/instalar.sh repo [caminho] [--dry-run] [--forcar] [--sem-github] [--sem-instrucoes]
#   bash <pasta-do-pacote>/instalar.sh global          [--dry-run] [--forcar]
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node 20+ não encontrado no PATH. Os scripts do HenriWorks também precisam dele." >&2
  exit 2
fi

MAIOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$MAIOR" -lt 20 ]; then
  echo "Node $MAIOR encontrado; o HenriWorks precisa de 20 ou mais (recomendado: 22)." >&2
  exit 2
fi

exec node "$AQUI/instalar.mjs" "$@"
