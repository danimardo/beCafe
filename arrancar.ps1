# Arranca beCafé en modo desarrollo en el puerto 4837, escuchando en todas las interfaces.
# Antes cierra la instancia anterior de este proyecto si ocupa el puerto. Si lo ocupa otro programa, no arranca.
# No toca el cortafuegos: para llegar desde Internet, abre el puerto 4837 en tu router o cortafuegos.
$ErrorActionPreference = 'Stop'

$Puerto = 4837
$Raiz = $PSScriptRoot
Set-Location $Raiz

# Sin .env ni variables en el entorno, la aplicación responde 500 (env_invalid).
if (-not (Test-Path .env) -and -not $env:DIRECTORIO_DATOS) {
	[Console]::Error.WriteLine('Falta el archivo .env. Créalo con: Copy-Item .env.example .env  y revisa sus valores.')
	exit 1
}

function Get-PidsEnPuerto {
	@(Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue |
		Select-Object -ExpandProperty OwningProcess -Unique)
}

# Un proceso es de este proyecto si su línea de comandos contiene la raíz (node_modules\vite\... lo incluye).
function Test-EsDeEsteProyecto([int]$ProcesoId) {
	$proceso = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcesoId" -ErrorAction SilentlyContinue
	return ($null -ne $proceso -and $null -ne $proceso.CommandLine -and $proceso.CommandLine.Contains($Raiz))
}

$pids = Get-PidsEnPuerto
if ($pids.Count -gt 0) {
	foreach ($id in $pids) {
		if (-not (Test-EsDeEsteProyecto $id)) {
			[Console]::Error.WriteLine("El puerto $Puerto lo ocupa otro programa (PID $id). No lo cierro ni arranco.")
			[Console]::Error.WriteLine('Ciérralo tú o libera el puerto y vuelve a ejecutar este script.')
			exit 1
		}
	}
	Write-Host "Cierro la instancia anterior de beCafé en el puerto $Puerto (PID: $($pids -join ' '))."
	foreach ($id in $pids) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
	for ($i = 0; $i -lt 50 -and (Get-PidsEnPuerto).Count -gt 0; $i++) { Start-Sleep -Milliseconds 200 }
	if ((Get-PidsEnPuerto).Count -gt 0) {
		[Console]::Error.WriteLine("El puerto $Puerto sigue ocupado tras cerrar la instancia anterior.")
		exit 1
	}
}

# ORIGIN: la variable del entorno manda; después, la de .env; si no, localhost.
# Para abrir la aplicación desde otra máquina, pon en .env la IP o el dominio (por ejemplo ORIGIN=http://203.0.113.5:4837).
$origenEnv = $null
if (Test-Path .env) { $origenEnv = Select-String -Path .env -Pattern '^\s*ORIGIN=(.*)$' | Select-Object -Last 1 }
if (-not $env:ORIGIN -and -not $origenEnv) { $env:ORIGIN = "http://localhost:$Puerto" }
$efectivo = if ($env:ORIGIN) { $env:ORIGIN } else { $origenEnv.Matches[0].Groups[1].Value }
Write-Host "ORIGIN efectivo: $efectivo"
Write-Host "Arrancando beCafé en 0.0.0.0:$Puerto (Ctrl+C para parar)."

npm run dev -- --host 0.0.0.0 --port $Puerto --strictPort
exit $LASTEXITCODE
