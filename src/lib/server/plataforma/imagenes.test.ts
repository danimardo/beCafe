import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { borrarFoto, guardarFoto, procesarFoto, rutaFoto } from './imagenes';
import { ErrorDeNegocio } from './errores';
import { crearRegistroFalso } from './pruebas/registro-falso';
import { usarRegistro } from './registro';

async function imagenCon(formato: 'jpeg' | 'png' | 'tiff' | 'webp'): Promise<Uint8Array> {
	const base = sharp({ create: { width: 900, height: 300, channels: 3, background: { r: 10, g: 20, b: 30 } } });
	const buffer = await (
		formato === 'jpeg' ? base.jpeg() : formato === 'png' ? base.png() : formato === 'tiff' ? base.tiff() : base.webp()
	).toBuffer();
	return new Uint8Array(buffer);
}

describe('fotos de los tipos de cápsula (RF-005, CA-005)', () => {
	let directorio: string;

	beforeEach(() => {
		directorio = mkdtempSync(join(tmpdir(), 'becafe-imagenes-'));
		usarRegistro(crearRegistroFalso());
	});

	afterEach(() => {
		rmSync(directorio, { recursive: true, force: true });
	});

	it('CA-005: admite JPEG, PNG y WebP y los devuelve como WebP redimensionado', async () => {
		for (const formato of ['jpeg', 'png', 'webp'] as const) {
			const salida = await procesarFoto(await imagenCon(formato));
			const metadatos = await sharp(salida).metadata();
			expect(metadatos.format).toBe('webp');
			expect(metadatos.width).toBeLessThanOrEqual(512);
		}
	});

	it('CA-005: rechaza un formato que no es JPEG, PNG ni WebP aunque sea una imagen válida', async () => {
		await expect(procesarFoto(await imagenCon('tiff'))).rejects.toMatchObject({ codigo: 'FOTO_NO_VALIDA' });
	});

	it('CA-005: rechaza un contenido que no se puede leer como imagen', async () => {
		await expect(procesarFoto(new TextEncoder().encode('contenido no legible'))).rejects.toBeInstanceOf(ErrorDeNegocio);
	});

	it('guarda la foto con un nombre nuevo, la lee de disco y la borra', () => {
		guardarFoto(directorio, 'prueba.webp', Buffer.from('contenido'));
		expect(readFileSync(rutaFoto(directorio, 'prueba.webp'), 'utf8')).toBe('contenido');
		expect(() => guardarFoto(directorio, 'prueba.webp', Buffer.from('otro'))).toThrow();
		borrarFoto(directorio, 'prueba.webp');
		expect(existsSync(rutaFoto(directorio, 'prueba.webp'))).toBe(false);
	});

	it('borrar una foto que no existe no falla', () => {
		expect(() => borrarFoto(directorio, 'no-existe.webp')).not.toThrow();
	});
});
