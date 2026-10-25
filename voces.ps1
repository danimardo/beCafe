# Menú interactivo para generar las locuciones de Capsulito con ElevenLabs.
# Muestra el estado de cada locución, pide confirmación con los caracteres que se enviarán y guarda una copia de lo que sustituye.
# Necesita ELEVENLABS_API_KEY en .env o en el entorno. La lógica está en scripts/voces-interactivo.mjs.
$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
	[Console]::Error.WriteLine('No encuentro node. Instala Node 24 (ver .nvmrc) y vuelve a lanzar este script.')
	exit 1
}

& node scripts/voces-interactivo.mjs @args
exit $LASTEXITCODE
