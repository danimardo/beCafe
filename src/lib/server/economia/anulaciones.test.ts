import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { marcarBaja } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { anularAportacion } from './anulaciones';
import { anularCompra, registrarCompra } from './compras';
import { registrarConsumo } from './consumos';
import { leerSaldoHucha, leerSaldoPropio } from './saldos';
import { prepararConsumo, prepararMiembros, prepararTipo } from './pruebas/constructores';
import { aportacion, existencia, regularizacion } from './esquema';

const INSTANTE = '2026-10-21T09:00:00.000Z';
const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

describe('anulaciones (CA-060, CA-061, CA-062, EV-011, INV-05)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-060: el autor anula su aportación a los 10 minutos (plazo 15); saldo y hucha la descuentan', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const { id } = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		entorno.reloj.avanzar(10 * MINUTO);

		anularAportacion(entorno.ambiente, actorDe(ana), id, 'Error al escribir el importe');

		expect(leerSaldoPropio(entorno.ambiente.db, actorDe(ana))).toBe(0);
		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(0);
		expect(entorno.ambiente.db.select().from(aportacion).get()?.estado).toBe('anulado');
	});

	it('CA-061: un administrador anula una aportación ajena a los 3 días', () => {
		const [ana, admin] = prepararMiembros(entorno.ambiente.db, 2);
		const { id } = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		entorno.reloj.avanzar(3 * DIA);

		anularAportacion(entorno.ambiente, actorDe(admin, 'administrador'), id, 'Duplicada');

		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(0);
	});

	it('CA-062: el autor no anula una compra a los 20 minutos (plazo 15) y una persona ajena no puede anularla', async () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 5000 });
		const tipo = await prepararTipo(entorno.ambiente);
		const { id } = await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 }],
			confirmoHuchaNegativa: false,
		});

		expect(() => anularCompra(entorno.ambiente, actorDe(bea), id, 'Error')).toThrow('SIN_PERMISO');

		entorno.reloj.avanzar(20 * MINUTO);
		expect(() => anularCompra(entorno.ambiente, actorDe(ana), id, 'Error')).toThrow('FUERA_DE_PLAZO');
	});

	it('EV-011 e INV-05: anular dos veces el mismo registro rechaza la segunda y no lo vuelve a vigente', () => {
		const [ana, admin] = prepararMiembros(entorno.ambiente.db, 2);
		const { id } = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		anularAportacion(entorno.ambiente, actorDe(admin, 'administrador'), id, 'Primera');

		expect(() => anularAportacion(entorno.ambiente, actorDe(admin, 'administrador'), id, 'Segunda')).toThrow('YA_ANULADO');
		expect(entorno.ambiente.db.select().from(aportacion).get()?.estado).toBe('anulado');
	});
});

describe('regularización al anular una compra (CA-045, RN-037)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-045: una compra errónea de 3,60 € anulada deja el coste en 0,40 € y regulariza cada consumo +3,20 €', async () => {
		const admin = actorDe(prepararMiembros(entorno.ambiente.db, 1)[0], 'administrador');
		const [c1, c2, c3, c4, ana] = prepararMiembros(entorno.ambiente.db, 5);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 5000 });
		const tipo = await prepararTipo(entorno.ambiente);

		// A: compra correcta de 0,40 €; un consumo la agota.
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 40 }],
			confirmoHuchaNegativa: false,
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: c1,
			tipoCapsulaId: tipo,
			precioAplicado: 40,
			costeMedioAplicado: 4000,
			horaRegistro: entorno.reloj.ahora(),
		});
		entorno.reloj.avanzar(MINUTO);

		// B: compra errónea de 3,60 € con stock 0, así que el coste es 3,60 €. Tres consumos cobrados a 3,60 €.
		const b = await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 360 }],
			confirmoHuchaNegativa: false,
		});
		for (const persona of [c2, c3, c4]) {
			prepararConsumo(entorno.ambiente.db, {
				usuarioId: persona,
				tipoCapsulaId: tipo,
				precioAplicado: 360,
				costeMedioAplicado: 36000,
				horaRegistro: entorno.reloj.ahora(),
			});
		}
		entorno.reloj.avanzar(MINUTO);

		const resumen = anularCompra(entorno.ambiente, admin, b.id, 'Precio mal introducido');

		expect(resumen.map((fila) => fila.importe).sort()).toEqual([320, 320, 320]);
		expect(entorno.ambiente.db.select().from(regularizacion).all()).toHaveLength(3);
		const fila = entorno.ambiente.db.select().from(existencia).get();
		expect(fila?.costeMedio).toBe(4000);
		expect(fila?.stock).toBe(-3);
	});

	it('CA-045 con consumos registrados por registrarConsumo (T017): la regularización es la misma que con consumos preparados', async () => {
		const admin = actorDe(prepararMiembros(entorno.ambiente.db, 1)[0], 'administrador');
		const [c1, c2, c3, c4, ana] = prepararMiembros(entorno.ambiente.db, 5);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 5000 });
		const tipo = await prepararTipo(entorno.ambiente);
		const consumir = (usuarioId: string) =>
			registrarConsumo(entorno.ambiente, actorDe(usuarioId), {
				clienteId: nuevoId(),
				tipoCapsulaId: tipo,
				invitado: false,
				horaGesto: entorno.reloj.ahora(),
				via: 'directo',
			});

		// A: compra correcta de 0,40 €; un consumo real la agota.
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 40 }],
			confirmoHuchaNegativa: false,
		});
		consumir(c1);
		entorno.reloj.avanzar(MINUTO);

		// B: compra errónea de 3,60 € con stock 0. Tres consumos reales cobrados a 3,60 €.
		const b = await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 360 }],
			confirmoHuchaNegativa: false,
		});
		for (const persona of [c2, c3, c4]) consumir(persona);
		entorno.reloj.avanzar(MINUTO);

		const resumen = anularCompra(entorno.ambiente, admin, b.id, 'Precio mal introducido');

		expect(resumen.map((fila) => fila.importe).sort()).toEqual([320, 320, 320]);
		expect(entorno.ambiente.db.select().from(regularizacion).all()).toHaveLength(3);
	});

	it('sin ninguna compra vigente que fije el precio, el consumo no se regulariza y el coste medio es nulo', async () => {
		const admin = actorDe(prepararMiembros(entorno.ambiente.db, 1)[0], 'administrador');
		const [ana, c1] = prepararMiembros(entorno.ambiente.db, 2);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 5000 });
		const tipo = await prepararTipo(entorno.ambiente);
		const compraUnica = await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 40 }],
			confirmoHuchaNegativa: false,
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: c1,
			tipoCapsulaId: tipo,
			precioAplicado: 40,
			costeMedioAplicado: 4000,
			horaRegistro: entorno.reloj.ahora(),
		});

		const resumen = anularCompra(entorno.ambiente, admin, compraUnica.id, 'Error');

		expect(resumen).toEqual([]);
		expect(entorno.ambiente.db.select().from(regularizacion).all()).toHaveLength(0);
		expect(entorno.ambiente.db.select().from(existencia).get()?.costeMedio).toBeNull();
	});

	it('Clarifications 10: el consumo de una persona de baja no se regulariza; las demás sí', async () => {
		const admin = actorDe(prepararMiembros(entorno.ambiente.db, 1)[0], 'administrador');
		const [c1, c2, c3, c4, ana] = prepararMiembros(entorno.ambiente.db, 5);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 5000 });
		const tipo = await prepararTipo(entorno.ambiente);
		// Compra A de 0,40 € que fija el precio; un consumo la agota (como en CA-045).
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 40 }],
			confirmoHuchaNegativa: false,
		});
		prepararConsumo(entorno.ambiente.db, {
			usuarioId: c1,
			tipoCapsulaId: tipo,
			precioAplicado: 40,
			costeMedioAplicado: 4000,
			horaRegistro: entorno.reloj.ahora(),
		});
		entorno.reloj.avanzar(MINUTO);
		const b = await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 360 }],
			confirmoHuchaNegativa: false,
		});
		for (const persona of [c2, c3, c4]) {
			prepararConsumo(entorno.ambiente.db, {
				usuarioId: persona,
				tipoCapsulaId: tipo,
				precioAplicado: 360,
				costeMedioAplicado: 36000,
				horaRegistro: entorno.reloj.ahora(),
			});
		}
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: c2, instante: entorno.reloj.ahora() }));

		const resumen = anularCompra(entorno.ambiente, admin, b.id, 'Precio mal introducido');

		expect(resumen.map((fila) => fila.usuarioId).sort()).toEqual([c3, c4].sort());
		expect(entorno.ambiente.db.select().from(regularizacion).all()).toHaveLength(2);
	});
});
