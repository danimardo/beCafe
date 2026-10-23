import sharp from 'sharp';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorDeNegocio } from './errores';
import { registrar } from './registro';

// Único archivo que importa `sharp` y único que escribe las fotos en disco (ARCHITECTURE.md §11, RF-005).
// La foto se valida por su contenido, no por su extensión. Se vuelve a codificar para quitar los metadatos (incluido el GPS).

const FORMATOS_ADMITIDOS = new Set(['jpeg', 'png', 'webp']);
const LADO_MAXIMO = 512;
const PIXELES_MAXIMOS = 40_000_000;

/** Devuelve la foto redimensionada en WebP y sin metadatos. Lanza `FOTO_NO_VALIDA` si el contenido no es una imagen admitida. */
export async function procesarFoto(original: Uint8Array): Promise<Buffer> {
	const opciones = { limitInputPixels: PIXELES_MAXIMOS };
	let formato: string | undefined;
	try {
		formato = (await sharp(original, opciones).metadata()).format;
	} catch {
		registrar('foto.rechazada', { motivo: 'no_legible' });
		throw new ErrorDeNegocio('FOTO_NO_VALIDA');
	}
	if (!formato || !FORMATOS_ADMITIDOS.has(formato)) {
		registrar('foto.rechazada', { motivo: 'formato' });
		throw new ErrorDeNegocio('FOTO_NO_VALIDA');
	}
	const salida = await sharp(original, opciones)
		.rotate()
		.resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();
	registrar('foto.procesada', { bytes: salida.length });
	return salida;
}

/** Escribe la foto nueva. No sobrescribe: el nombre lleva un identificador único. */
export function guardarFoto(directorioFotos: string, nombre: string, contenido: Buffer): void {
	mkdirSync(directorioFotos, { recursive: true });
	writeFileSync(join(directorioFotos, nombre), contenido, { flag: 'wx' });
}

export function rutaFoto(directorioFotos: string, nombre: string): string {
	return join(directorioFotos, nombre);
}

/** Borra una foto. Si no existe, no hace nada. */
export function borrarFoto(directorioFotos: string, nombre: string): void {
	rmSync(join(directorioFotos, nombre), { force: true });
}
