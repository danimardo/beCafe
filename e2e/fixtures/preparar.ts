import { execFileSync } from 'node:child_process';

// Empaqueta los comandos de servidor (`sembrar-e2e.js`) una vez antes de los E2E (T057). Usa el binario de Vite con Node,
// así funciona igual en Windows y en Linux (AGENTS.md §7).
export default function preparar(): void {
	execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.comandos.config.ts'], { stdio: 'inherit' });
}
