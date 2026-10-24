#!/usr/bin/env bash
# Arranca beCafé en modo desarrollo en el puerto 4837, escuchando en todas las interfaces.
# Antes cierra la instancia anterior de este proyecto si ocupa el puerto. Si lo ocupa otro programa, no arranca.
# No toca el cortafuegos: para llegar desde Internet, abre el puerto 4837 en tu router o cortafuegos.
set -euo pipefail

PUERTO=4837
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"

# Sin .env ni variables en el entorno, la aplicación responde 500 (env_invalid).
if [[ ! -f .env && -z "${DIRECTORIO_DATOS:-}" ]]; then
	echo "Falta el archivo .env. Créalo con: cp .env.example .env  y revisa sus valores." >&2
	exit 1
fi

# Identificadores de los procesos que escuchan en el puerto.
pids_en_puerto() {
	if command -v ss >/dev/null 2>&1; then
		ss -ltnpH "sport = :$PUERTO" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true
	elif command -v lsof >/dev/null 2>&1; then
		lsof -ti "tcp:$PUERTO" -sTCP:LISTEN 2>/dev/null | sort -u || true
	else
		echo "No encuentro ss ni lsof para comprobar el puerto $PUERTO. Instala uno de los dos." >&2
		exit 1
	fi
}

# Un proceso es de este proyecto si su directorio de trabajo está dentro de la raíz.
es_de_este_proyecto() {
	local directorio
	directorio="$(readlink "/proc/$1/cwd" 2>/dev/null || true)"
	[[ "$directorio" == "$RAIZ" || "$directorio" == "$RAIZ"/* ]]
}

pids="$(pids_en_puerto)"
if [[ -n "$pids" ]]; then
	for pid in $pids; do
		if ! es_de_este_proyecto "$pid"; then
			echo "El puerto $PUERTO lo ocupa otro programa (PID $pid). No lo cierro ni arranco." >&2
			echo "Ciérralo tú o libera el puerto y vuelve a ejecutar este script." >&2
			exit 1
		fi
	done
	echo "Cierro la instancia anterior de beCafé en el puerto $PUERTO (PID: $(echo $pids | tr '\n' ' '))."
	# shellcheck disable=SC2086
	kill $pids 2>/dev/null || true
	for _ in $(seq 1 50); do
		[[ -z "$(pids_en_puerto)" ]] && break
		sleep 0.2
	done
	if [[ -n "$(pids_en_puerto)" ]]; then
		# shellcheck disable=SC2086
		kill -9 $pids 2>/dev/null || true
		sleep 0.5
	fi
	if [[ -n "$(pids_en_puerto)" ]]; then
		echo "El puerto $PUERTO sigue ocupado tras cerrar la instancia anterior." >&2
		exit 1
	fi
fi

# ORIGIN: la variable del entorno manda; después, la de .env; si no, localhost.
# Para abrir la aplicación desde otra máquina, pon en .env la IP o el dominio (por ejemplo ORIGIN=http://203.0.113.5:4837).
if [[ -z "${ORIGIN:-}" ]] && ! grep -qE '^[[:space:]]*ORIGIN=' .env 2>/dev/null; then
	export ORIGIN="http://localhost:$PUERTO"
fi
echo "ORIGIN efectivo: ${ORIGIN:-$(grep -E '^[[:space:]]*ORIGIN=' .env | tail -n1 | cut -d= -f2-)}"
echo "Arrancando beCafé en 0.0.0.0:$PUERTO (Ctrl+C para parar)."

exec npm run dev -- --host 0.0.0.0 --port "$PUERTO" --strictPort
