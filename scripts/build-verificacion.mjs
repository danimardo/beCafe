// Build de verificación (`npm run verify`). La build exige ORIGIN y DIRECTORIO_DATOS (src/env.ts): aquí se fijan valores de
// prueba, con el mismo origen que los E2E (e2e/fixtures/servidor.ts). Usa Node en vez de `VAR=valor`, que no funciona en Windows.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const datos = join(process.cwd(), '.local', 'build-verificacion');
mkdirSync(datos, { recursive: true });

const tokens = spawnSync(process.execPath, ['scripts/generate-tokens.mjs'], { stdio: 'inherit' });
if (tokens.status !== 0) process.exitCode = tokens.status ?? 1;
else {
	const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
		stdio: 'inherit',
		env: { ...process.env, ORIGIN: 'http://127.0.0.1:4300', DIRECTORIO_DATOS: datos, TZ: 'Europe/Madrid' },
	});
	process.exitCode = build.status ?? 1;
}
