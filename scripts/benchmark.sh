#!/usr/bin/env bash
# Envoltorio de Linux para scripts/benchmark.mjs (docs/pruebas.md §17.3). Toda la lógica está en el .mjs.
# Uso: bash scripts/benchmark.sh [--dry-run] [--skip-install] [--quick-e2e]
#      (también acepta -DryRun, -SkipInstall y -QuickE2E, como la plantilla)
set -euo pipefail
cd "$(dirname "$0")/.."

argumentos=()
for arg in "$@"; do
  case "$arg" in
    -DryRun) argumentos+=("--dry-run") ;;
    -SkipInstall) argumentos+=("--skip-install") ;;
    -QuickE2E) argumentos+=("--quick-e2e") ;;
    *) argumentos+=("$arg") ;;
  esac
done

exec node scripts/benchmark.mjs "${argumentos[@]}"
