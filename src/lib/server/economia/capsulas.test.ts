import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import type { Actor } from '#lib/server/auth';
import { ErrorDeNegocio, crearEntornoPrueba, enTransaccion, type EntornoPrueba } from '#lib/server/plataforma';
import { cambiarEstadoCapsula, borrarCapsula, darDeAltaCapsula, editarCapsula, type DatosCapsulaEntrada } from './capsulas';
import { leerAvisosStock, leerCapsulaAdmin, leerCatalogoAdmin, leerEstadoTipos } from './panel';
import { fijarStock } from './existencias';
import { registrarAportacion } from './aportaciones';
import { registrarCompra } from './compras';
import { registrarConsumo } from './consumos';
import { prepararConsumo, prepararMiembros, prepararTipo } from './pruebas/constructores';
import { nuevoId } from '#lib/server/plataforma';
import { existencia, entradaStockBajo } from './esquema';
import { listarTipos } from '#lib/server/catalogo';

const INSTANTE = '2026-10-21T09:00:00.000Z';
const ADMIN: Actor = { usuarioId: '01ADMIN0000000000000000000', rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'hash-admin' };
const MIEMBRO: Actor = { usuarioId: '01MIEMBRO000000000000000', rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'hash-miembro' };

function datosBase(extra: Partial<DatosCapsulaEntrada> = {}): DatosCapsulaEntrada {
	return { nombre: 'Ristretto', marca: 'Marca de prueba', intensidad: 9, color: 'cap-ristretto', umbralMinimo: 5, ...extra };
}

async function fotoJpeg(): Promise<Uint8Array> {
	const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 90, g: 50, b: 30 } } })
		.jpeg()
		.toBuffer();
	return new Uint8Array(buffer);
}

describe('catálogo de tipos de cápsula (CA-001 a CA-006)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-001: un administrador da de alta un tipo con foto; aparece activo y sin coste medio, y no tiene stock bajo si el umbral está cubierto por el stock 0', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: await fotoJpeg() }));
		const tipo = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id);
		expect(tipo?.estado).toBe('activo');
		expect(tipo?.fotoRuta).toMatch(/\.webp$/);
		const estado = leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora());
		expect(estado.costeMedio).toBeNull();
		expect(estado.stock).toBe(0);
		expect(existsSync(join(entorno.ambiente.directorioFotos, tipo?.fotoRuta ?? 'ausente'))).toBe(true);
	});

	it('CA-001: un tipo sin foto se da de alta igualmente', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Lungo' }));
		expect(listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta).toBeNull();
	});

	it('CA-002: rechaza un nombre igual a otro tipo activo, sin distinguir mayúsculas', async () => {
		await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Ristretto' }));
		await expect(darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'ristretto' }))).rejects.toMatchObject({
			codigo: 'NOMBRE_DUPLICADO',
		});
	});

	it('CA-002: reactivar un tipo retirado cuyo nombre ya usa otro activo se rechaza', async () => {
		const primero = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Decaf' }));
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, primero.id, 'retirado');
		await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'DECAF' }));
		expect(() => cambiarEstadoCapsula(entorno.ambiente, ADMIN, primero.id, 'activo')).toThrow(ErrorDeNegocio);
	});

	it('CA-003: cambiar el umbral de 5 a 25 con stock 20 deja el stock igual y pasa el tipo a stock bajo', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 5 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 20, INSTANTE));
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ umbralMinimo: 25 }));
		const estado = leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora());
		expect(estado.stock).toBe(20);
		expect(estado.umbralMinimo).toBe(25);
		expect(estado.enStockBajo).toBe(true);
	});

	it('CA-004: un tipo retirado no aparece en los avisos y conserva su historial; al reactivarlo vuelve', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 10 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 3, INSTANTE));
		expect(leerAvisosStock(entorno.ambiente.db, ADMIN, entorno.ambiente.reloj.ahora()).map((fila) => fila.id)).toContain(id);
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, id, 'retirado');
		expect(leerAvisosStock(entorno.ambiente.db, ADMIN, entorno.ambiente.reloj.ahora()).map((fila) => fila.id)).not.toContain(id);
		expect(leerCatalogoAdmin(entorno.ambiente.db, ADMIN, entorno.ambiente.reloj.ahora()).find((fila) => fila.id === id)?.estado).toBe(
			'retirado',
		);
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, id, 'activo');
		expect(leerAvisosStock(entorno.ambiente.db, ADMIN, entorno.ambiente.reloj.ahora()).map((fila) => fila.id)).toContain(id);
	});

	it('CA-005: un fichero cuyo contenido no es una imagen se rechaza aunque tenga extensión .jpg', async () => {
		const ejecutable = new TextEncoder().encode('MZ ejecutable no es una imagen');
		await expect(darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: ejecutable }))).rejects.toMatchObject({
			codigo: 'FOTO_NO_VALIDA',
		});
		expect(listarTipos(entorno.ambiente.db)).toHaveLength(0);
	});

	it('CA-005: la imagen guardada no conserva metadatos (incluido el GPS)', async () => {
		const conMetadatos = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 1, g: 2, b: 3 } } })
			.withMetadata({ exif: { IFD0: { Copyright: 'dato de localización de prueba' } } })
			.jpeg()
			.toBuffer();
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: new Uint8Array(conMetadatos) }));
		const ruta = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta ?? '';
		const metadatos = await sharp(join(entorno.ambiente.directorioFotos, ruta)).metadata();
		expect(metadatos.exif).toBeUndefined();
		expect(metadatos.format).toBe('webp');
	});

	it('CA-006: borra un tipo sin registros y elimina su foto', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: await fotoJpeg() }));
		const ruta = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta ?? '';
		borrarCapsula(entorno.ambiente, ADMIN, id);
		expect(listarTipos(entorno.ambiente.db)).toHaveLength(0);
		expect(existsSync(join(entorno.ambiente.directorioFotos, ruta))).toBe(false);
	});

	it('CA-006 con registro: un tipo con un consumo no se puede borrar y conserva su foto', async () => {
		const tipoId = await prepararTipo(entorno.ambiente);
		const [miembro] = prepararMiembros(entorno.ambiente.db, 1);
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: miembro,
			tipoCapsulaId: tipoId,
			precioAplicado: 35,
			costeMedioAplicado: 4000,
			horaRegistro: INSTANTE,
		});
		expect(() => borrarCapsula(entorno.ambiente, ADMIN, tipoId)).toThrow('TIENE_REGISTROS');
		expect(listarTipos(entorno.ambiente.db).map((fila) => fila.id)).toContain(tipoId);
	});

	it('EV-050: un miembro no puede dar de alta, editar, retirar ni borrar, y no ve el catálogo de administración', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase());
		await expect(darDeAltaCapsula(entorno.ambiente, MIEMBRO, datosBase({ nombre: 'Otro' }))).rejects.toMatchObject({
			codigo: 'SIN_PERMISO',
		});
		await expect(editarCapsula(entorno.ambiente, MIEMBRO, id, datosBase())).rejects.toMatchObject({ codigo: 'SIN_PERMISO' });
		expect(() => cambiarEstadoCapsula(entorno.ambiente, MIEMBRO, id, 'retirado')).toThrow(ErrorDeNegocio);
		expect(() => borrarCapsula(entorno.ambiente, MIEMBRO, id)).toThrow(ErrorDeNegocio);
		expect(() => leerCatalogoAdmin(entorno.ambiente.db, MIEMBRO, entorno.ambiente.reloj.ahora())).toThrow(ErrorDeNegocio);
	});

	it('EV-050: un usuario sin sesión no lee el estado de los tipos', () => {
		expect(() => leerEstadoTipos(entorno.ambiente.db, undefined, entorno.ambiente.reloj.ahora())).toThrow(ErrorDeNegocio);
	});
});

describe('stock bajo y entradas (RN-071, RN-072, INV-02; CA-020, CA-021, CA-023)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-020: con umbral 10, el stock 11 no entra en stock bajo; al bajar a 10, sí', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 10 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 11, INSTANTE));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(false);
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 10, INSTANTE));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(true);
	});

	it('CA-021: el panel de avisos muestra los tipos activos en stock bajo', async () => {
		const bajo = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Bajo', umbralMinimo: 10 }));
		const sano = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Sano', umbralMinimo: 2 }));
		enTransaccion(entorno.ambiente.db, (tx) => {
			fijarStock(tx, bajo.id, 4, INSTANTE);
			fijarStock(tx, sano.id, 9, INSTANTE);
		});
		expect(leerAvisosStock(entorno.ambiente.db, ADMIN, entorno.ambiente.reloj.ahora()).map((fila) => fila.id)).toEqual([bajo.id]);
	});

	it('CA-022: sin consumos registrados aún, la estimación es «sin datos» con stock positivo y 0 días sin stock', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 0 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 30, INSTANTE));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).estimacion).toEqual({ tipo: 'sin-datos' });
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 0, INSTANTE));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).estimacion).toEqual({ tipo: 'dias', dias: 0 });
	});

	it('CA-023: varias bajadas registran una sola entrada; salir y volver a entrar registra una nueva', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 10 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 11, INSTANTE));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 10, INSTANTE));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 9, INSTANTE));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 8, INSTANTE));
		expect(entradas(id)).toBe(1);
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 40, INSTANTE));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(false);
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 3, INSTANTE));
		expect(entradas(id)).toBe(2);
	});

	it('INV-02: el indicador de stock bajo coincide con el recálculo tras cada cambio de stock o umbral', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 5 }));
		for (const stock of [0, 5, 6, -1, 12]) {
			enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, stock, INSTANTE));
			const fila = leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora());
			expect(fila.enStockBajo).toBe(fila.stock <= fila.umbralMinimo);
		}
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ umbralMinimo: 20 }));
		const fila = leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora());
		expect(fila.enStockBajo).toBe(fila.stock <= fila.umbralMinimo);
	});

	it('un tipo recién dado de alta con stock 0 queda en stock bajo, pero no registra entrada (decisión del 22-10-2026)', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 5 }));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(true);
		expect(entradas(id)).toBe(0);
		expect(entorno.eventos().some((evento) => evento.codigo === 'capsula.alta')).toBe(true);
		expect(entorno.ambiente.db.select().from(existencia).all()).toHaveLength(1);
	});

	function entradas(tipoCapsulaId: string): number {
		return entorno.ambiente.db
			.select()
			.from(entradaStockBajo)
			.all()
			.filter((fila) => fila.tipoCapsulaId === tipoCapsulaId).length;
	}
});

describe('ramas de error y de reemplazo de foto (constitución VIII)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-005: editar con una foto que no es imagen se rechaza y no cambia el tipo', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase());
		const noEsImagen = new TextEncoder().encode('no es imagen');
		await expect(editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ foto: noEsImagen }))).rejects.toMatchObject({
			codigo: 'FOTO_NO_VALIDA',
		});
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).fotoRuta).toBeNull();
	});

	it('editar con un nombre duplicado borra la foto recién escrita y no deja huérfanos', async () => {
		await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Lungo' }));
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ nombre: 'Decaf' }));
		const antes = ficherosDe(entorno.ambiente.directorioFotos);
		await expect(editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ nombre: 'LUNGO', foto: await fotoJpeg() }))).rejects.toMatchObject({
			codigo: 'NOMBRE_DUPLICADO',
		});
		expect(ficherosDe(entorno.ambiente.directorioFotos)).toEqual(antes);
	});

	it('editar con una foto nueva reemplaza la anterior y borra el fichero viejo', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: await fotoJpeg() }));
		const anterior = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta ?? '';
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ foto: await fotoJpeg() }));
		const nueva = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta ?? '';
		expect(nueva).not.toBe(anterior);
		expect(existsSync(join(entorno.ambiente.directorioFotos, anterior))).toBe(false);
		expect(existsSync(join(entorno.ambiente.directorioFotos, nueva))).toBe(true);
	});

	it('editar sin foto nueva conserva la foto anterior', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ foto: await fotoJpeg() }));
		const anterior = listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta;
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ nombre: 'Nuevo nombre' }));
		expect(listarTipos(entorno.ambiente.db).find((fila) => fila.id === id)?.fotoRuta).toBe(anterior);
	});

	it('CA-003: bajar el umbral por debajo del stock no genera entrada; subirlo por encima sí la registra', async () => {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo: 5 }));
		enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, id, 20, INSTANTE));
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ umbralMinimo: 2 }));
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(false);
		await editarCapsula(entorno.ambiente, ADMIN, id, datosBase({ umbralMinimo: 25 }));
		expect(entradas(id)).toBe(1);
		expect(entorno.eventos().some((evento) => evento.codigo === 'stock.entrada_bajo_registrada')).toBe(true);
	});

	it('fijar el stock de un tipo inexistente se rechaza con recurso no encontrado', () => {
		expect(() => enTransaccion(entorno.ambiente.db, (tx) => fijarStock(tx, '01NOEXISTE00000000000000000', 1, INSTANTE))).toThrow(
			'RECURSO_NO_ENCONTRADO',
		);
	});

	it('borrar un tipo inexistente se rechaza con recurso no encontrado', () => {
		expect(() => borrarCapsula(entorno.ambiente, ADMIN, '01NOEXISTE00000000000000000')).toThrow('RECURSO_NO_ENCONTRADO');
	});

	it('leer el estado de un tipo inexistente da recurso no encontrado', () => {
		expect(() => leerCapsulaAdmin(entorno.ambiente.db, ADMIN, '01NOEXISTE00000000000000000', entorno.ambiente.reloj.ahora())).toThrow(
			'RECURSO_NO_ENCONTRADO',
		);
	});

	it('retirar un tipo inexistente da recurso no encontrado', () => {
		expect(() => cambiarEstadoCapsula(entorno.ambiente, ADMIN, '01NOEXISTE00000000000000000', 'retirado')).toThrow('RECURSO_NO_ENCONTRADO');
	});

	function entradas(tipoCapsulaId: string): number {
		return entorno.ambiente.db
			.select()
			.from(entradaStockBajo)
			.all()
			.filter((fila) => fila.tipoCapsulaId === tipoCapsulaId).length;
	}
});

function ficherosDe(directorio: string): string[] {
	return existsSync(directorio) ? readdirSync(directorio).sort() : [];
}

describe('stock bajo con consumos reales (CA-020, CA-023; T-F2-15, plan D13)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Un miembro activo que registra consumos. */
	function miembroActivo(): Actor {
		const [usuarioId] = prepararMiembros(entorno.ambiente.db, 1);
		return { usuarioId, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
	}

	/** Hucha con saldo, compra de `cantidad` cápsulas y registro de un consumo por cada cápsula que se quiera restar. */
	async function tipoConStock(cantidad: number, umbralMinimo: number): Promise<string> {
		const miembro = miembroActivo();
		registrarAportacion(entorno.ambiente, miembro, { clienteId: nuevoId(), importe: 50_000 });
		registrarAportacion(entorno.ambiente, miembro, { clienteId: nuevoId(), importe: 50_000 });
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN, datosBase({ umbralMinimo }));
		await registrarCompra(entorno.ambiente, miembro, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: id, cantidad, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
		return id;
	}

	function consumirUna(tipoCapsulaId: string, actor: Actor): void {
		registrarConsumo(entorno.ambiente, actor, {
			clienteId: nuevoId(),
			tipoCapsulaId,
			invitado: false,
			horaGesto: INSTANTE,
			via: 'directo',
		});
	}

	function entradasDe(tipoCapsulaId: string): number {
		return entorno.ambiente.db
			.select()
			.from(entradaStockBajo)
			.all()
			.filter((fila) => fila.tipoCapsulaId === tipoCapsulaId).length;
	}

	it('CA-020: con umbral 10, un tipo con stock 11 no está en stock bajo; tras un consumo queda en 10 y sí', async () => {
		const miembro = miembroActivo();
		const id = await tipoConStock(11, 10);
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(false);

		consumirUna(id, miembro);

		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(true);
	});

	it('CA-023: varios consumos bajo el umbral registran una sola entrada; reponer y volver a bajar registra otra', async () => {
		const miembro = miembroActivo();
		const id = await tipoConStock(12, 10);
		consumirUna(id, miembro);
		consumirUna(id, miembro);
		expect(entradasDe(id)).toBe(1);

		consumirUna(id, miembro);
		consumirUna(id, miembro);
		expect(entradasDe(id)).toBe(1);

		await registrarCompra(entorno.ambiente, miembro, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: id, cantidad: 40, importe: 13_932 }],
			confirmoHuchaNegativa: true,
		});
		expect(leerCapsulaAdmin(entorno.ambiente.db, ADMIN, id, entorno.ambiente.reloj.ahora()).enStockBajo).toBe(false);

		for (let i = 0; i < 39; i += 1) consumirUna(id, miembro);
		expect(entradasDe(id)).toBe(2);
	});
});
