import { existsSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { cambiarEstadoCapsula } from './capsulas';
import { leerCompra, leerComprasRecientes, registrarCompra } from './compras';
import { registrarAportacion } from './aportaciones';
import { leerSaldoPropio, leerSaldoHucha } from './saldos';
import { avisoEconomia, compra, existencia, movimiento } from './esquema';
import { prepararConsumo, prepararMiembros, prepararTipo } from './pruebas/constructores';

const INSTANTE = '2026-10-21T09:00:00.000Z';
const ADMIN: Actor = { usuarioId: '01ADMIN0000000000000000000', rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'hash-admin' };

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

async function fotoJpeg(): Promise<Uint8Array> {
	const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 90, g: 50, b: 30 } } })
		.jpeg()
		.toBuffer();
	return new Uint8Array(buffer);
}

describe('compras de cápsulas (CA-040 a CA-043, RN-001, RN-002, RF-046, RNF-010)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Hucha con saldo inicial (aportación de un miembro), para que las compras no queden en negativo. */
	function dotarHucha(importe: number): void {
		const [dotador] = prepararMiembros(entorno.ambiente.db, 1);
		registrarAportacion(entorno.ambiente, actorDe(dotador), { clienteId: nuevoId(), importe });
	}

	function huchaSaldo(): number {
		return leerSaldoHucha(entorno.ambiente.db).saldo;
	}

	it('CA-040: dos líneas dan un total de 2400 céntimos y una sola compra', async () => {
		dotarHucha(5000);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const a = await prepararTipo(entorno.ambiente);
		const b = await prepararTipo(entorno.ambiente);

		const resultado = await registrarCompra(entorno.ambiente, actorDe(marta), {
			clienteId: nuevoId(),
			lineas: [
				{ tipoCapsulaId: a, cantidad: 10, importe: 1000 },
				{ tipoCapsulaId: b, cantidad: 5, importe: 1400 },
			],
			confirmoHuchaNegativa: false,
		});

		expect(resultado.duplicado).toBe(false);
		expect(leerCompra(entorno.ambiente.db, ADMIN, resultado.id).importeTotal).toBe(2400);
		expect(huchaSaldo()).toBe(5000 - 2400);
		expect(leerComprasRecientes(entorno.ambiente.db, ADMIN, 10)).toHaveLength(1);
	});

	it('CA-041: coste medio y stock por línea; con stock −2 la compra no pondera y el coste es solo el de la compra', async () => {
		dotarHucha(5000);
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		const tipo = await prepararTipo(entorno.ambiente);
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: ana,
			tipoCapsulaId: tipo,
			precioAplicado: 0,
			costeMedioAplicado: 0,
			horaRegistro: INSTANTE,
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: bea,
			tipoCapsulaId: tipo,
			precioAplicado: 0,
			costeMedioAplicado: 0,
			horaRegistro: INSTANTE,
		});

		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 4, importe: 1600 }],
			confirmoHuchaNegativa: false,
		});

		const fila = entorno.ambiente.db.select().from(existencia).get();
		expect(fila?.stock).toBe(2);
		expect(fila?.costeMedio).toBe(40000);
	});

	it('CA-042: quien compra no recibe cargo ni saldo; la hucha baja por el total', async () => {
		dotarHucha(5000);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);

		await registrarCompra(entorno.ambiente, actorDe(marta), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 2, importe: 800 }],
			confirmoHuchaNegativa: false,
		});

		expect(leerSaldoPropio(entorno.ambiente.db, actorDe(marta))).toBe(0);
		expect(huchaSaldo()).toBe(4200);
	});

	it('RN-001 y RN-002: una compra posterior no cambia el precio ni el cargo de los consumos anteriores', async () => {
		dotarHucha(5000);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 40 }],
			confirmoHuchaNegativa: false,
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: ana,
			tipoCapsulaId: tipo,
			precioAplicado: 40,
			costeMedioAplicado: 4000,
			horaRegistro: INSTANTE,
		});

		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 360 }],
			confirmoHuchaNegativa: false,
		});

		expect(leerSaldoPropio(entorno.ambiente.db, actorDe(ana))).toBe(-40);
	});

	it('CA-043: sin confirmar, una compra que deja la hucha en negativo se rechaza; confirmada, queda en −800 y con aviso', async () => {
		dotarHucha(1200);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);
		const datos = { clienteId: nuevoId(), lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 2000 }], confirmoHuchaNegativa: false };

		await expect(registrarCompra(entorno.ambiente, actorDe(marta), datos)).rejects.toThrow('CONFIRMACION_REQUERIDA');
		expect(huchaSaldo()).toBe(1200);

		await registrarCompra(entorno.ambiente, actorDe(marta), { ...datos, confirmoHuchaNegativa: true });

		expect(huchaSaldo()).toBe(-800);
		expect(entorno.ambiente.db.select().from(avisoEconomia).all()).toHaveLength(1);
	});

	it('RF-046: reenviar la misma compra no la duplica', async () => {
		dotarHucha(5000);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);
		const clienteId = nuevoId();
		const datos = { clienteId, lineas: [{ tipoCapsulaId: tipo, cantidad: 2, importe: 800 }], confirmoHuchaNegativa: false };

		const primera = await registrarCompra(entorno.ambiente, actorDe(marta), datos);
		const segunda = await registrarCompra(entorno.ambiente, actorDe(marta), datos);

		expect(segunda).toEqual({ id: primera.id, duplicado: true });
		expect(entorno.ambiente.db.select().from(compra).all()).toHaveLength(1);
		expect(huchaSaldo()).toBe(4200);
	});

	it('un tipo retirado o inexistente se rechaza con TIPO_NO_DISPONIBLE', async () => {
		dotarHucha(5000);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const tipo = await prepararTipo(entorno.ambiente);
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, tipo, 'retirado');

		await expect(
			registrarCompra(entorno.ambiente, actorDe(marta), {
				clienteId: nuevoId(),
				lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 }],
				confirmoHuchaNegativa: false,
			}),
		).rejects.toThrow('TIPO_NO_DISPONIBLE');
	});

	it('RNF-010: un fallo a mitad de la compra no deja ni compra, ni stock, ni foto', async () => {
		dotarHucha(5000);
		const [marta] = prepararMiembros(entorno.ambiente.db, 1);
		const a = await prepararTipo(entorno.ambiente);
		const b = await prepararTipo(entorno.ambiente);

		await expect(
			registrarCompra(entorno.ambiente, actorDe(marta), {
				clienteId: nuevoId(),
				lineas: [
					{ tipoCapsulaId: a, cantidad: 1, importe: 100 },
					{ tipoCapsulaId: b, cantidad: 1, importe: 0 },
				],
				foto: await fotoJpeg(),
				confirmoHuchaNegativa: false,
			}),
		).rejects.toThrow();

		expect(entorno.ambiente.db.select().from(compra).all()).toHaveLength(0);
		expect(
			entorno.ambiente.db
				.select()
				.from(movimiento)
				.all()
				.filter((m) => m.tipo === 'hucha_compra'),
		).toHaveLength(0);
		expect(
			entorno.ambiente.db
				.select()
				.from(existencia)
				.all()
				.map((e) => e.stock),
		).toEqual([0, 0]);
		expect(existsSync(entorno.ambiente.directorioFotos) ? readdirSync(entorno.ambiente.directorioFotos) : []).toEqual([]);
	});
});
