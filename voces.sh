#!/usr/bin/env bash
# Menú interactivo para generar las locuciones de Capsulito con ElevenLabs.
# Muestra el estado de cada locución, pide confirmación con los caracteres que se enviarán y guarda una copia de lo que sustituye.
# Necesita ELEVENLABS_API_KEY en .env o en el entorno. La lógica está en scripts/voces-interactivo.mjs.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"

if ! command -v node >/dev/null 2>&1; then
	echo "No encuentro node. Instala Node 24 (ver .nvmrc) y vuelve a lanzar este script." >&2
	exit 1
fi

exec node scripts/voces-interactivo.mjs "$@"
