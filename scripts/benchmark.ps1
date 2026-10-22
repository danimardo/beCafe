# Envoltorio de Windows para scripts/benchmark.mjs (docs/pruebas.md §17.3). Toda la lógica está en el .mjs.
# Uso: .\scripts\benchmark.ps1 [-DryRun] [-SkipInstall] [-QuickE2E]
param(
	[switch]$DryRun,
	[switch]$SkipInstall,
	[switch]$QuickE2E
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$argumentos = @()
if ($DryRun) { $argumentos += '--dry-run' }
if ($SkipInstall) { $argumentos += '--skip-install' }
if ($QuickE2E) { $argumentos += '--quick-e2e' }

& node scripts/benchmark.mjs @argumentos
exit $LASTEXITCODE
