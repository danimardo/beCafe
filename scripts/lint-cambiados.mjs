// Selecciona los archivos cambiados respecto a HEAD y los sin seguimiento (docs/pruebas.md §17.2).
// Uso: node scripts/lint-cambiados.mjs lint | test
// - lint: si cambian la configuración de ESLint o de TypeScript, lintea todo el proyecto.
// - test: lanza solo las pruebas relacionadas con los archivos cambiados.
// Una selección vacía no se pasa nunca a la herramienta como «todo»: termina con código 2.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const modo = process.argv[2];
if (modo !== 'lint' && modo !== 'test') {
	console.error('Uso: node scripts/lint-cambiados.mjs lint | test');
	process.exit(2);
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
const cambiados = [...new Set([...git(['diff', '--name-only', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard'])])].filter(
	(archivo) => existsSync(archivo),
);

const CONFIGURACION = ['eslint.config.js', 'tsconfig.json', '.prettierrc', 'vite.config.ts', 'package.json'];
const ejecutar = (orden, args) => {
	const resultado = spawnSync(orden, args, { stdio: 'inherit', shell: process.platform === 'win32' });
	process.exit(resultado.status ?? 1);
};

if (modo === 'lint') {
	if (cambiados.some((archivo) => CONFIGURACION.includes(archivo))) {
		console.log('Cambió la configuración de ESLint o de TypeScript: se lintea todo el proyecto.');
		ejecutar('npx', ['eslint', '.']);
	}
	const lintables = cambiados.filter((archivo) => /\.(ts|js|mjs|cjs|svelte)$/.test(archivo));
	if (lintables.length === 0) {
		console.log('Ningún archivo lintable cambiado: no hay nada que lintar.');
		process.exit(0);
	}
	console.log(`Lint de ${lintables.length} archivo(s) cambiado(s).`);
	ejecutar('npx', ['eslint', ...lintables]);
}

const probables = cambiados.filter((archivo) => /\.(ts|svelte)$/.test(archivo));
if (probables.length === 0) {
	console.error('Ninguna prueba seleccionada: no hay archivos cambiados de código. Esto no cuenta como superada.');
	process.exit(2);
}
console.log(`Pruebas relacionadas con ${probables.length} archivo(s) cambiado(s).`);
ejecutar('npx', ['vitest', 'related', '--run', ...probables]);
