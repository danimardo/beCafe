import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, cp, mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as tar from 'tar';
import { ErrorCopia } from './errores';

// Único archivo que importa `tar` (plan F8 D1, paso 3). El contenido es `becafe.db` y `fotos/`: nunca `logs/`, `tmp/` ni los `-wal`/`-shm`.

export type Empaquetado = { tamano: number; sha256: string };

/** Crea `destino` (`.tar.gz`) con la instantánea y las fotos, y devuelve su tamaño y su SHA-256. */
export async function empaquetar({
	instantanea,
	directorioFotos,
	destino,
}: {
	instantanea: string;
	directorioFotos: string;
	destino: string;
}): Promise<Empaquetado> {
	const preparacion = `${destino}.d`;
	try {
		await mkdir(preparacion, { recursive: true });
		await copyFile(instantanea, join(preparacion, 'becafe.db'));
		await cp(directorioFotos, join(preparacion, 'fotos'), { recursive: true, force: true }).catch(() => mkdir(join(preparacion, 'fotos')));
		await tar.c({ gzip: true, file: destino, cwd: preparacion }, ['becafe.db', 'fotos']);
	} catch {
		throw new ErrorCopia('DISCO');
	} finally {
		await rm(preparacion, { recursive: true, force: true });
	}
	const { size } = await stat(destino);
	return { tamano: size, sha256: await sha256De(destino) };
}

/** SHA-256 de un archivo en streaming. */
export function sha256De(ruta: string): Promise<string> {
	return new Promise((resolver, rechazar) => {
		const hash = createHash('sha256');
		createReadStream(ruta)
			.on('data', (trozo) => hash.update(trozo))
			.on('error', rechazar)
			.on('end', () => resolver(hash.digest('hex')));
	});
}

/** Extrae un `.tar.gz` de copia en `destino` (creado si no existe). Solo para verificar copias (plan F8 D11). */
export async function desempaquetar(archivo: string, destino: string): Promise<void> {
	await mkdir(destino, { recursive: true });
	await tar.x({ file: archivo, cwd: destino });
}
