import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { test as base } from '@playwright/test';

const ejecutar = promisify(execFile);

export interface ServidorDePrueba {
	/** Origen HTTP del servidor de este worker. */
	url: string;
	/** Directorio de datos temporal de este worker (SQLite y registros). */
	directorioDatos: string;
	/** Enlace de invitación del primer administrador, tal como lo escribe el arranque en la salida estándar (CA-139). */
	enlaceAdmin: string;
	/** Datos de prueba que siembra `sembrar-e2e.js` (T057): correos por rol, contraseña común y el enlace de Pedro. */
	siembra: Siembra;
}

// Forma del fichero que escribe `scripts/servidor/sembrar-e2e.ts`. Se valida al leerlo (constitución VI).
const esquemaSiembra = z.strictObject({
	correos: z.strictObject({ administrador: z.string(), miembro: z.string(), invitada: z.string(), pendiente: z.string() }),
	contrasena: z.string(),
	enlacePedro: z.string(),
});
export type Siembra = z.infer<typeof esquemaSiembra>;

// Debe coincidir con el ORIGIN con el que se compila la build: `ORIGIN=http://127.0.0.1:4300 DIRECTORIO_DATOS=… npm run build`.
const PUERTO_BASE = 4300;
const CRONOMETRO_ARRANQUE_MS = 60_000;

/**
 * Un servidor por worker: `node build` con su puerto y su directorio de datos (docs/pruebas.md §12.1).
 * El arranque se detecta por la línea que escribe el adaptador de Node; no hay bucles de espera.
 */
export const test = base.extend<object, { servidor: ServidorDePrueba }>({
	// La bienvenida de antes de entrar (RF-195) taparía el formulario de `/login` en cada prueba. Las pruebas que la
	// comprueban abren su propio contexto con `browser.newContext()`, que no pasa por este valor.
	context: async ({ context }, use) => {
		await context.addInitScript(() => {
			try {
				// Solo la primera vez de cada pestaña: una prueba puede borrar la marca y recargar para ver la bienvenida.
				if (sessionStorage.getItem('becafe-e2e-inicio') === null) {
					localStorage.setItem('becafe-bienvenida', 'vista');
					sessionStorage.setItem('becafe-e2e-inicio', '1');
				}
			} catch {
				// Sin almacenamiento disponible.
			}
		});
		await use(context);
	},
	servidor: [
		async ({}, use, workerInfo) => {
			const puerto = PUERTO_BASE + workerInfo.parallelIndex;
			const url = `http://127.0.0.1:${puerto}`;
			await mkdir(join(process.cwd(), '.local'), { recursive: true });
			const directorioDatos = await mkdtemp(join(process.cwd(), '.local', 'e2e-datos-'));

			const entorno = {
				PATH: process.env.PATH ?? '',
				HOST: '127.0.0.1',
				PORT: String(puerto),
				ORIGIN: url,
				DIRECTORIO_DATOS: directorioDatos,
				// Base nueva por worker: el arranque crea el primer administrador con estos datos de prueba (no reales).
				ADMIN_INICIAL_EMAIL: 'admin.prueba@ejemplo.es',
				ADMIN_INICIAL_NOMBRE: 'Administración de prueba',
				LOG_LEVEL: process.env.E2E_LOG_LEVEL ?? 'warn',
				TZ: 'Europe/Madrid',
			};
			const proceso: ChildProcess = spawn(process.execPath, ['build'], {
				cwd: process.cwd(),
				env: entorno,
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			let salida = '';
			const enlaceAdmin = new Promise<string>((resolver) => {
				proceso.stdout?.on('data', (chunk: Buffer) => {
					salida += chunk.toString();
					const coincidencia = /"enlace":"([^"]+\/acceso\/[^"]+)"/.exec(salida);
					if (coincidencia?.[1]) resolver(coincidencia[1]);
				});
			});

			const arrancado = new Promise<void>((resolver, rechazar) => {
				const timer = setTimeout(
					() => rechazar(new Error(`El servidor del worker ${workerInfo.parallelIndex} no arrancó en ${CRONOMETRO_ARRANQUE_MS} ms`)),
					CRONOMETRO_ARRANQUE_MS,
				);
				proceso.stdout?.on('data', (chunk: Buffer) => {
					if (chunk.toString().includes('Listening on')) {
						clearTimeout(timer);
						resolver();
					}
				});
				proceso.once('exit', (codigo) => {
					clearTimeout(timer);
					rechazar(new Error(`El servidor terminó antes de arrancar (código ${codigo ?? 'desconocido'})`));
				});
			});

			try {
				await arrancado;
				// La siembra usa la misma base que el servidor, con las mismas variables: sus datos son los del worker.
				await ejecutar(process.execPath, [join(process.cwd(), 'build-scripts', 'sembrar-e2e.js')], { cwd: process.cwd(), env: entorno });
				const siembra = esquemaSiembra.parse(JSON.parse(await readFile(join(directorioDatos, 'siembra-e2e.json'), 'utf8')));
				await use({ url, directorioDatos, enlaceAdmin: await enlaceAdmin, siembra });
			} finally {
				proceso.kill();
				await rm(directorioDatos, { recursive: true, force: true });
			}
		},
		{ scope: 'worker' },
	],
});
