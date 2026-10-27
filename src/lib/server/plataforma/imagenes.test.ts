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
			const salida = await procesarFoto(await imagenCon(formato), 'ninguno');
			const metadatos = await sharp(salida).metadata();
			expect(metadatos.format).toBe('webp');
			expect(metadatos.width).toBeLessThanOrEqual(512);
		}
	});

	it('CA-005: rechaza un formato que no es JPEG, PNG ni WebP aunque sea una imagen válida', async () => {
		await expect(procesarFoto(await imagenCon('tiff'), 'ninguno')).rejects.toMatchObject({ codigo: 'FOTO_NO_VALIDA' });
	});

	it('CA-005: rechaza un contenido que no se puede leer como imagen', async () => {
		await expect(procesarFoto(new TextEncoder().encode('contenido no legible'), 'ninguno')).rejects.toBeInstanceOf(ErrorDeNegocio);
	});

	async function dosMitades(orientacion?: number): Promise<Uint8Array> {
		// 400 × 200: mitad izquierda roja y mitad derecha azul. Con orientación 6 se ve girada 90° (200 × 400).
		const izquierda = await sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
		const base = sharp({ create: { width: 400, height: 200, channels: 3, background: { r: 0, g: 0, b: 255 } } }).composite([{ input: izquierda, left: 0, top: 0 }]);
		return new Uint8Array(await (orientacion ? base.jpeg().withMetadata({ orientation: orientacion }) : base.jpeg()).toBuffer());
	}

	async function colorEn(foto: Buffer, xFraccion: number, yFraccion: number) {
		const { data, info } = await sharp(foto).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		const desplazamiento = (Math.floor(yFraccion * info.height) * info.width + Math.floor(xFraccion * info.width)) * info.channels;
		return { r: data[desplazamiento] ?? 0, b: data[desplazamiento + 2] ?? 0 };
	}

	it('CA-274: con encuadre recorta la zona elegida a un cuadrado', async () => {
		const salida = await procesarFoto(await dosMitades(), { x: 0.5, y: 0, lado: 1 });
		const { width, height } = await sharp(salida).metadata();
		expect([width, height]).toEqual([200, 200]);
		expect((await colorEn(salida, 0.5, 0.5)).b).toBeGreaterThan(200);
	});

	it('CA-274: sin encuadre, el recorte central deja un cuadrado con las dos mitades', async () => {
		const salida = await procesarFoto(await dosMitades(), 'centro');
		const { width, height } = await sharp(salida).metadata();
		expect([width, height]).toEqual([200, 200]);
		expect((await colorEn(salida, 0.1, 0.5)).r).toBeGreaterThan(200);
		expect((await colorEn(salida, 0.9, 0.5)).b).toBeGreaterThan(200);
	});

	it('CA-274: una zona que se sale de la foto se rechaza con FOTO_ENCUADRE_NO_VALIDO', async () => {
		await expect(procesarFoto(await dosMitades(), { x: 0.9, y: 0, lado: 1 })).rejects.toMatchObject({ codigo: 'FOTO_ENCUADRE_NO_VALIDO' });
		await expect(procesarFoto(await dosMitades(), { x: 0, y: 0.5, lado: 1 })).rejects.toMatchObject({ codigo: 'FOTO_ENCUADRE_NO_VALIDO' });
	});

	it('CA-274: el encuadre se mide sobre la foto orientada (JPEG con orientación 6)', async () => {
		// Girada 90° en sentido horario, la mitad roja queda arriba: la zona superior es roja y la inferior, azul.
		const foto = await dosMitades(6);
		const arriba = await procesarFoto(foto, { x: 0, y: 0, lado: 1 });
		const abajo = await procesarFoto(foto, { x: 0, y: 0.5, lado: 1 });
		expect((await colorEn(arriba, 0.5, 0.5)).r).toBeGreaterThan(200);
		expect((await colorEn(abajo, 0.5, 0.5)).b).toBeGreaterThan(200);
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
