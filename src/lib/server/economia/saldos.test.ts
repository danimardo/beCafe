import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { leerAportacionesDe, leerSaldoHucha, leerSaldos } from './saldos';
import { registrarAportacion } from './aportaciones';
import { anularAportacion } from './anulaciones';
import { RecursoNoEncontrado } from '#lib/server/plataforma';
import { anotarMovimientos } from './libro';

// Plan F5 D1 y tareas T006: saldos de todas las personas activas (CA-110), orden y marca de la fila propia (CA-111).
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('saldos de todas las personas (CA-110, CA-111)', () => {
	let entorno: EntornoPrueba;
	let ana: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		ana = actorDe('Ana');
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function actorDe(nombre: string): Actor {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		return { usuarioId: id, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: `hash-${id}` };
	}

	function cargo(usuarioId: string, importe: number): void {
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{ cuenta: 'persona', usuarioId, tipo: 'cargo_consumo', importe, origenTipo: 'consumo', origenId: nuevoId(), creadoEn: INSTANTE },
			]),
		);
	}

	it('CA-110: muestra a las personas activas con su saldo; quien no tiene movimientos aparece con 0', () => {
		const bea = actorDe('Bea');
		cargo(bea.usuarioId, -350);

		const saldos = leerSaldos(entorno.ambiente.db, ana);

		expect(saldos).toEqual([
			{ usuarioId: ana.usuarioId, nombre: 'Ana', saldo: 0, totalAportado: 0, esPropia: true },
			{ usuarioId: bea.usuarioId, nombre: 'Bea', saldo: -350, totalAportado: 0, esPropia: false },
		]);
	});

	it('CA-110: la persona de baja no aparece aunque tenga movimientos', () => {
		const carla = actorDe('Carla');
		cargo(carla.usuarioId, -100);
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: carla.usuarioId, instante: INSTANTE }));

		expect(leerSaldos(entorno.ambiente.db, ana).map((fila) => fila.nombre)).toEqual(['Ana']);
	});

	it('CA-111: ordena con la fila propia primero y después por nombre; solo la propia es esPropia', () => {
		actorDe('Zoe');
		actorDe('Bea');

		const saldos = leerSaldos(entorno.ambiente.db, ana);

		expect(saldos.map((fila) => fila.nombre)).toEqual(['Ana', 'Bea', 'Zoe']);
		expect(saldos.filter((fila) => fila.esPropia)).toEqual([expect.objectContaining({ nombre: 'Ana' })]);
	});

	it('suma solo los movimientos vigentes de cada persona', () => {
		cargo(ana.usuarioId, -200);
		cargo(ana.usuarioId, 500);

		expect(leerSaldos(entorno.ambiente.db, ana)[0]).toEqual(expect.objectContaining({ nombre: 'Ana', saldo: 300 }));
	});

	it('la hucha suma sus movimientos y sin arqueo no tiene último arqueo', () => {
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'hucha',
					usuarioId: null,
					tipo: 'hucha_aportacion',
					importe: 1200,
					origenTipo: 'aportacion',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]),
		);

		expect(leerSaldoHucha(entorno.ambiente.db)).toEqual({ saldo: 1200, ultimoArqueo: null });
	});

	it('CA-199: cada persona muestra el total de sus aportaciones vigentes y su detalle dice quién registró cada una', () => {
		const admin: Actor = { ...actorDe('Admin'), rol: 'administrador' };
		const bea = actorDe('Bea');
		registrarAportacion(entorno.ambiente, bea, { clienteId: nuevoId(), importe: 500 });
		entorno.reloj.avanzar(60_000);
		const { id: anulada } = registrarAportacion(entorno.ambiente, bea, { clienteId: nuevoId(), importe: 300 });
		anularAportacion(entorno.ambiente, bea, anulada, 'Error');
		entorno.reloj.avanzar(60_000);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 1000, beneficiarioId: bea.usuarioId });

		expect(leerSaldos(entorno.ambiente.db, ana).find((fila) => fila.usuarioId === bea.usuarioId)?.totalAportado).toBe(1500);
		const detalle = leerAportacionesDe(entorno.ambiente.db, ana, bea.usuarioId, 1);
		expect(detalle).toMatchObject({ nombre: 'Bea', totalAportado: 1500, total: 3 });
		expect(detalle.filas.map((f) => [f.importe, f.estado, f.registradaPorNombre, f.registradaPorOtra])).toEqual([
			[1000, 'vigente', 'Admin', true],
			[300, 'anulado', 'Bea', false],
			[500, 'vigente', 'Bea', false],
		]);
		expect(leerAportacionesDe(entorno.ambiente.db, ana, bea.usuarioId, 2).filas).toEqual([]);
	});

	it('CA-199: el detalle de una persona que no existe es «no encontrada» y sin sesión se rechaza', () => {
		expect(() => leerAportacionesDe(entorno.ambiente.db, ana, nuevoId(), 1)).toThrow(RecursoNoEncontrado);
		expect(() => leerAportacionesDe(entorno.ambiente.db, undefined, ana.usuarioId, 1)).toThrow();
	});
});
