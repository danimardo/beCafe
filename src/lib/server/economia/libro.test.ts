import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enTransaccion, ErrorDeNegocio, nuevoId, crearEntornoPrueba, type EntornoPrueba } from '#lib/server/plataforma';
import { anotarMovimientos, anularMovimientosDe, leerEvolucionHucha, saldoHucha, saldoPersona, type NuevoMovimiento } from './libro';
import { esquemaMes } from '#lib/shared/fechas/tipos';
import { prepararMiembros } from './pruebas/constructores';

const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('libro de movimientos', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function cargoPersona(usuarioId: string, importe: number, origenId = nuevoId()): NuevoMovimiento {
		return { cuenta: 'persona', usuarioId, tipo: 'cargo_consumo', importe, origenTipo: 'consumo', origenId, creadoEn: INSTANTE };
	}

	it('RN-010: el saldo de una persona es la suma de sus movimientos vigentes; sin movimientos vale 0', () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		enTransaccion(entorno.ambiente.db, (tx) => {
			anotarMovimientos(tx, [cargoPersona(ana, -35), { ...cargoPersona(ana, 500), tipo: 'abono_aportacion', origenTipo: 'aportacion' }]);
			anotarMovimientos(tx, [cargoPersona(bea, -70)]);
		});
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(465);
		expect(saldoPersona(entorno.ambiente.db, bea)).toBe(-70);
	});

	it('RN-011: el saldo teórico de la hucha suma sus movimientos vigentes; sin movimientos vale 0', () => {
		expect(saldoHucha(entorno.ambiente.db)).toBe(0);
		enTransaccion(entorno.ambiente.db, (tx) => {
			anotarMovimientos(tx, [
				{
					cuenta: 'hucha',
					usuarioId: null,
					tipo: 'hucha_aportacion',
					importe: 1000,
					origenTipo: 'aportacion',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
				{
					cuenta: 'hucha',
					usuarioId: null,
					tipo: 'hucha_compra',
					importe: -400,
					origenTipo: 'compra',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]);
		});
		expect(saldoHucha(entorno.ambiente.db)).toBe(600);
	});

	it('CA-201: la evolución de la hucha da el saldo al cierre de cada mes de Madrid; un mes sin movimientos repite el anterior', () => {
		const hucha = (importe: number, creadoEn: string, tipo: 'hucha_aportacion' | 'hucha_compra' = 'hucha_aportacion'): NuevoMovimiento => ({
			cuenta: 'hucha',
			usuarioId: null,
			tipo,
			importe,
			origenTipo: tipo === 'hucha_compra' ? 'compra' : 'aportacion',
			origenId: nuevoId(),
			creadoEn,
		});
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				hucha(1000, '2026-08-10T10:00:00.000Z'),
				// 31 de agosto a las 23:30 en Madrid (21:30 UTC): cuenta en agosto.
				hucha(-300, '2026-08-31T21:30:00.000Z', 'hucha_compra'),
				// 1 de octubre a las 00:30 en Madrid (22:30 UTC del 30 de septiembre): cuenta en octubre.
				hucha(500, '2026-09-30T22:30:00.000Z'),
			]),
		);
		const meses = ['2026-07', '2026-08', '2026-09', '2026-10'].map((mes) => esquemaMes.parse(mes));

		expect(leerEvolucionHucha(entorno.ambiente.db, meses).map((fila) => fila.saldo)).toEqual([0, 700, 700, 1200]);
	});

	it('INV-05: anular un origen deja sus movimientos fuera del saldo y no los vuelve a vigentes', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const origen = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, -35, origen)]));
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', origen, INSTANTE));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', origen, INSTANTE));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
	});

	it('anular no toca movimientos de otro origen', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, -35), cargoPersona(ana, -70)]));
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', nuevoId(), INSTANTE));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(-105);
	});

	it('rechaza un movimiento de importe 0 sin escribir nada', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		expect(() => enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, 0)]))).toThrow(ErrorDeNegocio);
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
	});
});
