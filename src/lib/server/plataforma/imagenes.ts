import sharp from 'sharp';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorDeNegocio } from './errores';
import { registrar } from './registro';
import type { Encuadre } from '#lib/shared/contratos/encuadre';

// Único archivo que importa `sharp` y único que escribe las fotos en disco (ARCHITECTURE.md §11, RF-005).
// La foto se valida por su contenido, no por su extensión. Se vuelve a codificar para quitar los metadatos (incluido el GPS).

const FORMATOS_ADMITIDOS = new Set(['jpeg', 'png', 'webp']);
const LADO_MAXIMO = 512;
const PIXELES_MAXIMOS = 40_000_000;

export type Recorte = 'ninguno' | 'centro' | Encuadre;

/**
 * Devuelve la foto en WebP y sin metadatos. Lanza `FOTO_NO_VALIDA` si el contenido no es una imagen admitida.
 * `recorte`: `'ninguno'` conserva toda la foto (ticket de compra); `'centro'` la recorta a un cuadrado central; un `Encuadre`
 * recorta la zona elegida de la foto ya orientada y lanza `FOTO_ENCUADRE_NO_VALIDO` si no cabe en ella (RF-273).
 */
export async function procesarFoto(original: Uint8Array, recorte: Recorte): Promise<Buffer> {
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
	const salida = recorte === 'ninguno' ? await reducir(original, opciones) : await recortar(original, opciones, recorte);
	registrar('foto.procesada', { bytes: salida.length });
	return salida;
}

async function reducir(original: Uint8Array, opciones: { limitInputPixels: number }): Promise<Buffer> {
	return sharp(original, opciones)
		.rotate()
		.resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();
}

async function recortar(original: Uint8Array, opciones: { limitInputPixels: number }, recorte: 'centro' | Encuadre): Promise<Buffer> {
	// La foto se orienta primero: el encuadre se mide sobre lo que la persona ve, no sobre los píxeles sin girar.
	const { data: orientada, info } = await sharp(original, opciones).rotate().toBuffer({ resolveWithObject: true });
	const lado = Math.min(info.width, info.height);
	let zona = { left: Math.floor((info.width - lado) / 2), top: Math.floor((info.height - lado) / 2), width: lado, height: lado };
	if (recorte !== 'centro') {
		const ladoPx = Math.round(recorte.lado * lado);
		const izquierda = Math.round(recorte.x * info.width);
		const arriba = Math.round(recorte.y * info.height);
		// Tolerancia de 1 px por redondeo; el resto se ajusta a la foto.
		if (ladoPx < 1 || izquierda + ladoPx > info.width + 1 || arriba + ladoPx > info.height + 1) {
			registrar('foto.rechazada', { motivo: 'encuadre' });
			throw new ErrorDeNegocio('FOTO_ENCUADRE_NO_VALIDO');
		}
		const ancho = Math.min(ladoPx, info.width - izquierda);
		const alto = Math.min(ladoPx, info.height - arriba);
		zona = { left: izquierda, top: arriba, width: ancho, height: alto };
	}
	const salida = await sharp(orientada)
		.extract(zona)
		.resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'cover', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();
	registrar('foto.recortada', { modo: recorte === 'centro' ? 'centro' : 'encuadre', bytes: salida.length });
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
