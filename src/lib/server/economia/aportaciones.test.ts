import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { registrarAportacion, escribirAportacion } from './aportaciones';
import { leerAportacion, leerAportacionesPropias, leerSaldoHucha, leerSaldoPropio } from './saldos';
import { anotarMovimientos, saldoHucha, saldoPersona } from './libro';
import { prepararMiembros, prepararAportacion } from './pruebas/constructores';
import { aportacion } from './esquema';

const INSTANTE = '2026-10-21T09:00:00.000Z';

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

describe('aportaciones (CA-030, RF-046, RN-034, RNF-010)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('CA-030: −4,00 € con una aportación de 5,00 € deja a la persona en +1,00 € y la hucha sube de 10,00 € a 15,00 €', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		enTransaccion(entorno.ambiente.db, (tx) => {
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: ana,
					tipo: 'cargo_consumo',
					importe: -400,
					origenTipo: 'consumo',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]);
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
			]);
		});
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(100);
		expect(saldoHucha(entorno.ambiente.db)).toBe(1500);
	});

	it('RF-046: el mismo clienteId dos veces deja una sola aportación y registra registro.duplicado', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		const clienteId = nuevoId();
		const primera = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId, importe: 500 });
		const segunda = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId, importe: 500 });
		expect(segunda).toEqual({ id: primera.id, duplicado: true });
		expect(entorno.ambiente.db.select().from(aportacion).all()).toHaveLength(1);
		expect(saldoHucha(entorno.ambiente.db)).toBe(500);
		expect(entorno.eventos().map((evento) => evento.codigo)).toContain('registro.duplicado');
	});

	it('RN-034: la aportación queda a nombre de quien la registra, sin otro usuarioId posible', () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		const { id } = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		expect(leerAportacion(entorno.ambiente.db, actorDe(ana), id).usuarioId).toBe(ana);
		expect(saldoPersona(entorno.ambiente.db, bea)).toBe(0);
	});

	it('RNF-010: un fallo después de escribir la aportación y sus movimientos no deja nada guardado', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		expect(() =>
			enTransaccion(entorno.ambiente.db, (tx) => {
				escribirAportacion(tx, { importe: 500, usuarioId: ana, registradaPor: ana, origen: 'directa', instante: INSTANTE });
				throw new ErrorDeNegocio('VALIDACION');
			}),
		).toThrow('VALIDACION');
		expect(entorno.ambiente.db.select().from(aportacion).all()).toHaveLength(0);
		expect(saldoHucha(entorno.ambiente.db)).toBe(0);
		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(0);
	});

	it('saldos: el saldo propio, el de la hucha con su último arqueo y las aportaciones propias', () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 500, instante: INSTANTE });
		prepararAportacion(entorno.ambiente.db, { usuarioId: bea, importe: 300, instante: INSTANTE });
		expect(leerSaldoPropio(entorno.ambiente.db, actorDe(ana))).toBe(500);
		expect(leerSaldoHucha(entorno.ambiente.db)).toEqual({ saldo: 800, ultimoArqueo: null });
		expect(leerAportacionesPropias(entorno.ambiente.db, actorDe(ana), 10)).toHaveLength(1);
	});

	it('leer la aportación de otra persona da «no encontrada», salvo a un administrador', () => {
		const [ana, bea] = prepararMiembros(entorno.ambiente.db, 2);
		const id = prepararAportacion(entorno.ambiente.db, { usuarioId: ana, importe: 500, instante: INSTANTE });
		expect(() => leerAportacion(entorno.ambiente.db, actorDe(bea), id)).toThrow('RECURSO_NO_ENCONTRADO');
		expect(leerAportacion(entorno.ambiente.db, actorDe(bea, 'administrador'), id).id).toBe(id);
	});
});
