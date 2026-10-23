import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerPersonasBajoLimite } from './panel';
import { anotarMovimientos } from './libro';

const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('panel de avisos: personas bajo el límite de deuda (CA-021, RF-021)', () => {
	let entorno: EntornoPrueba;
	let miembro: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre: 'Luis', correo: `luis-${id}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		miembro = { usuarioId: id, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'hash-luis' };
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function persona(nombre: string, saldo: number): string {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@ejemplo.test`, rol: 'miembro', instante: INSTANTE });
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: id,
					tipo: 'cargo_consumo',
					importe: saldo,
					origenTipo: 'consumo',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]),
		);
		return id;
	}

	it('CA-021: con saldo −6,00 € y límite −5,00 € aparece; con −5,00 € exactos no aparece', () => {
		const ana = persona('Ana', -600);
		persona('Bea', -500);

		const deudores = leerPersonasBajoLimite(entorno.ambiente.db, miembro);

		expect(deudores).toEqual([expect.objectContaining({ usuarioId: ana, nombre: 'Ana', saldo: -600 })]);
	});

	it('sin sesión no se lee el panel', () => {
		expect(() => leerPersonasBajoLimite(entorno.ambiente.db, undefined)).toThrow('SIN_SESION');
	});
});
