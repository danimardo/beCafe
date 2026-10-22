// Benchmark de verificación (docs/pruebas.md §17.3). Ejecuta la verificación completa en serie, mide cada paso y
// cada prueba, y guarda un informe en .local/benchmark/ (ignorado por Git). Los scripts .sh y .ps1 solo llaman a este archivo.
// Uso: node scripts/benchmark.mjs [--dry-run] [--skip-install] [--quick-e2e]
//   --dry-run      comprueba requisitos e informa; no ejecuta pruebas.
//   --skip-install no instala nada: este script nunca instala. Se acepta por compatibilidad con la plantilla.
//   --quick-e2e    Playwright solo en chromium-movil. No sustituye la puerta completa.
import { spawnSync } from 'node:child_process';
import { cpus, hostname, release, totalmem, type } from 'node:os';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OPCIONES = ['--dry-run', '--skip-install', '--quick-e2e'];
const argumentos = process.argv.slice(2);
const desconocidos = argumentos.filter((a) => !OPCIONES.includes(a));
if (desconocidos.length > 0) {
	console.error(`Argumento desconocido: ${desconocidos.join(' ')}`);
	process.exit(1);
}
const simulacion = argumentos.includes('--dry-run');
const rapido = argumentos.includes('--quick-e2e');
const esWindows = process.platform === 'win32';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaInformes = join(raiz, '.local', 'benchmark');
const carpetaTemporal = join(carpetaInformes, 'tmp');
mkdirSync(carpetaTemporal, { recursive: true });
const sello = new Date().toISOString().replace(/[:.]/g, '-');
const equipo = hostname();

/** Ejecuta un comando con `shell` solo en Windows (npm es npm.cmd allí). Nunca se pasa una lista vacía como «todo». */
function ejecutar(orden, argumentosComando, extra = {}) {
	return spawnSync(orden, argumentosComando, { cwd: raiz, encoding: 'utf8', shell: esWindows, ...extra });
}

// ---------------------------------------------------------------- 1. Requisitos
const requisitos = [];
const requisito = (nombre, cumple, detalle) => requisitos.push({ nombre, estado: cumple ? 'OK' : 'FALTA', detalle });

const mayorNode = Number(process.versions.node.split('.')[0]);
requisito('Node.js 24', mayorNode === 24, process.versions.node);
const npm = ejecutar('npm', ['-v']);
const versionNpm = npm.stdout.trim();
requisito('npm 11', versionNpm.split('.')[0] === '11', versionNpm || 'no disponible');
requisito('Dependencias instaladas', existsSync(join(raiz, 'node_modules', '.package-lock.json')), 'npm ci');

// Playwright informa de la ruta de cada navegador con --dry-run; si la carpeta existe, el navegador está instalado.
const navegadores = rapido ? ['chromium'] : ['chromium', 'webkit'];
for (const navegador of navegadores) {
	const salida = ejecutar('npx', ['playwright', 'install', '--dry-run', navegador]).stdout;
	const rutas = [...salida.matchAll(/Install location:\s+(.+)/g)].map((m) => m[1].trim()).filter((r) => !r.includes('ffmpeg'));
	const instalado = rutas.length > 0 && rutas.every((r) => existsSync(r));
	requisito(`Navegador ${navegador} (Playwright)`, instalado, instalado ? 'instalado' : 'npx playwright install ' + navegador);
}

for (const r of requisitos) console.log(`  ${r.nombre.padEnd(34)} ${r.estado.padEnd(7)} ${r.detalle}`);
const faltan = requisitos.filter((r) => r.estado === 'FALTA').length;

if (simulacion) {
	console.log(`\nSimulación: no se ha ejecutado ninguna verificación. Requisitos que faltan: ${faltan}.`);
	process.exit(faltan === 0 ? 0 : 2);
}
if (faltan > 0) {
	console.error('\nFaltan requisitos. El benchmark se cancela sin ejecutar nada.');
	process.exit(2);
}

// ---------------------------------------------------------------- 2. Verificaciones medidas, en serie
const pasos = [];
function paso(nombre, npmScript, extraArgs = [], entorno = {}) {
	const inicio = performance.now();
	const resultado = ejecutar('npm', ['run', npmScript, ...(extraArgs.length ? ['--', ...extraArgs] : [])], {
		stdio: 'inherit',
		env: { ...process.env, ...entorno },
	});
	const milisegundos = Math.round(performance.now() - inicio);
	const codigo = resultado.status ?? 1;
	pasos.push({ nombre, milisegundos, codigo });
	console.log(`  ${nombre.padEnd(44)} ${(milisegundos / 1000).toFixed(2).padStart(9)} s  (código ${codigo})`);
	if (codigo !== 0) {
		escribirInforme(`El paso «${nombre}» ha fallado con código ${codigo}`);
		process.exit(codigo);
	}
}

const vitestServidor = join(carpetaTemporal, 'vitest-servidor.json');
const vitestComponentes = join(carpetaTemporal, 'vitest-componentes.json');
const playwrightJson = join(carpetaTemporal, 'playwright.json');

console.log('\n== Verificaciones');
paso('Formato (prettier)', 'format:check');
paso('Lint (eslint)', 'lint');
paso('Tipos (svelte-check)', 'check');
paso('Arquitectura (dependency-cruiser)', 'arch');
paso('Build (vite)', 'build');
paso('Pruebas servidor con cobertura', 'test', ['--reporter=default', '--reporter=json', `--outputFile.json=${vitestServidor}`]);
paso('Pruebas componentes', 'test:componentes', ['--reporter=default', '--reporter=json', `--outputFile.json=${vitestComponentes}`]);
paso(rapido ? 'E2E (chromium-movil)' : 'E2E (todos los proyectos)', rapido ? 'test:e2e:quick' : 'test:e2e', ['--reporter=list,json'], {
	PLAYWRIGHT_JSON_OUTPUT_NAME: playwrightJson,
});

// ---------------------------------------------------------------- 3. Informe
function leerJson(ruta) {
	return existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : null;
}

function pruebasDeVitest(informe, suite) {
	if (!informe) return [];
	return informe.testResults.flatMap((archivo) =>
		archivo.assertionResults.map((prueba) => ({
			suite,
			archivo: archivo.name.replace(raiz, '').replace(/\\/g, '/'),
			prueba: prueba.fullName,
			milisegundos: Math.round(prueba.duration ?? 0),
			estado: prueba.status,
		})),
	);
}

function pruebasDePlaywright(informe) {
	if (!informe) return [];
	const recorrer = (suite, archivo) => {
		const nombre = suite.file ?? archivo;
		const specs = (suite.specs ?? []).flatMap((spec) =>
			(spec.tests ?? []).map((prueba) => {
				const ultimo = prueba.results?.at(-1);
				return {
					suite: `playwright:${prueba.projectName}`,
					archivo: nombre,
					prueba: spec.title,
					milisegundos: Math.round(ultimo?.duration ?? 0),
					estado: ultimo?.status,
				};
			}),
		);
		return [...specs, ...(suite.suites ?? []).flatMap((hijo) => recorrer(hijo, nombre))];
	};
	return (informe.suites ?? []).flatMap((suite) => recorrer(suite, ''));
}

function escribirInforme(motivo) {
	const pruebas = [
		...pruebasDeVitest(leerJson(vitestServidor), 'vitest:servidor'),
		...pruebasDeVitest(leerJson(vitestComponentes), 'vitest:componentes'),
		...pruebasDePlaywright(leerJson(playwrightJson)),
	];
	const totalMs = pasos.reduce((suma, p) => suma + p.milisegundos, 0);
	const base = join(carpetaInformes, `${sello}-${equipo}`);
	const informe = {
		fecha: new Date().toISOString(),
		resultado: motivo ?? 'TODO_PASA',
		equipo: {
			nombre: equipo,
			procesador: cpus()[0]?.model ?? 'desconocido',
			hilos: cpus().length,
			memoriaGb: Math.round(totalmem() / 1024 ** 3),
			sistema: `${type()} ${release()}`,
		},
		requisitos,
		pasos,
		totalMs,
		pruebas,
	};
	writeFileSync(`${base}.json`, JSON.stringify(informe, null, 2), 'utf8');
	const sec = (ms) => (ms / 1000).toFixed(2);
	const lineas = [
		`Benchmark de verificación - ${equipo} - ${sello}`,
		`Resultado: ${informe.resultado}`,
		`Sistema: ${informe.equipo.sistema}, ${informe.equipo.procesador} (${informe.equipo.hilos} hilos), ${informe.equipo.memoriaGb} GB`,
		'',
		'Pasos:',
		...pasos.map((p) => `  ${p.nombre.padEnd(44)} ${sec(p.milisegundos).padStart(9)} s  (código ${p.codigo})`),
		`  ${'TOTAL'.padEnd(44)} ${sec(totalMs).padStart(9)} s`,
		'',
		'Pruebas más lentas (10):',
		...[...pruebas]
			.sort((a, b) => b.milisegundos - a.milisegundos)
			.slice(0, 10)
			.map((p) => `  ${sec(p.milisegundos).padStart(8)} s  [${p.suite}] ${p.prueba}`),
	];
	writeFileSync(`${base}.txt`, lineas.join('\n') + '\n', 'utf8');
	console.log(`\nInforme: ${base}.json y ${base}.txt`);
}

escribirInforme(null);
