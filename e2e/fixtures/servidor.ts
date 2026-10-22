import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { test as base } from '@playwright/test';

export interface ServidorDePrueba {
	/** Origen HTTP del servidor de este worker. */
	url: string;
	/** Directorio de datos temporal de este worker (SQLite y registros). */
	directorioDatos: string;
	/** Enlace de invitación del primer administrador, tal como lo escribe el arranque en la salida estándar (CA-139). */
	enlaceAdmin: string;
}

// Debe coincidir con el ORIGIN con el que se compila la build: `ORIGIN=http://127.0.0.1:4300 DIRECTORIO_DATOS=… npm run build`.
const PUERTO_BASE = 4300;
const CRONOMETRO_ARRANQUE_MS = 60_000;

/**
 * Un servidor por worker: `node build` con su puerto y su directorio de datos (docs/pruebas.md §12.1).
 * El arranque se detecta por la línea que escribe el adaptador de Node; no hay bucles de espera.
 */
export const test = base.extend<object, { servidor: ServidorDePrueba }>({
	servidor: [
		async ({}, use, workerInfo) => {
			const puerto = PUERTO_BASE + workerInfo.parallelIndex;
			const url = `http://127.0.0.1:${puerto}`;
			await mkdir(join(process.cwd(), '.local'), { recursive: true });
			const directorioDatos = await mkdtemp(join(process.cwd(), '.local', 'e2e-datos-'));

			const proceso: ChildProcess = spawn(process.execPath, ['build'], {
				cwd: process.cwd(),
				env: {
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
				},
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
				await use({ url, directorioDatos, enlaceAdmin: await enlaceAdmin });
			} finally {
				proceso.kill();
				await rm(directorioDatos, { recursive: true, force: true });
			}
		},
		{ scope: 'worker' },
	],
});
