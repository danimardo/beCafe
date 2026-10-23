import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enTransaccion, ErrorDeNegocio, nuevoId, crearEntornoPrueba, type EntornoPrueba } from '#lib/server/plataforma';
import { anotarMovimientos, anularMovimientosDe, saldoHucha, saldoPersona, type NuevoMovimiento } from './libro';
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

	it('INV-05: anular un origen deja sus movimientos fuera del saldo y no los vuelve a vigentes', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const origen = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, -35, origen)]));
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', origen));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', origen));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
	});

	it('anular no toca movimientos de otro origen', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, -35), cargoPersona(ana, -70)]));
		enTransaccion(entorno.ambiente.db, (tx) => anularMovimientosDe(tx, 'consumo', nuevoId()));
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(-105);
	});

	it('rechaza un movimiento de importe 0 sin escribir nada', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		expect(() => enTransaccion(entorno.ambiente.db, (tx) => anotarMovimientos(tx, [cargoPersona(ana, 0)]))).toThrow(ErrorDeNegocio);
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
	});
});
