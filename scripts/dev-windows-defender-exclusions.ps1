# Añade o quita exclusiones de Microsoft Defender para la carpeta del proyecto y las cachés de npm y Playwright
# (docs/pruebas.md §17.5). Lo ejecuta una persona con permisos de administrador. El agente no lo ejecuta.
# Uso: .\scripts\dev-windows-defender-exclusions.ps1           (añade)
#      .\scripts\dev-windows-defender-exclusions.ps1 -Remove   (quita)
param([switch]$Remove)

$ErrorActionPreference = 'Stop'
$administrador = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $administrador.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
	throw 'Ejecuta este script en una consola de PowerShell como administrador.'
}

$rutas = @(
	(Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
	(Join-Path $env:LOCALAPPDATA 'npm-cache'),
	(Join-Path $env:LOCALAPPDATA 'ms-playwright')
)

foreach ($ruta in $rutas) {
	if ($Remove) {
		Remove-MpPreference -ExclusionPath $ruta
		Write-Host "Exclusión quitada: $ruta"
	} else {
		Add-MpPreference -ExclusionPath $ruta
		Write-Host "Exclusión añadida: $ruta"
	}
}
