import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { leerSaldoPropio, registrarAportacion } from '#lib/server/economia';

// Anulación de una aportación desde su detalle (CA-060, RN-034) con evento falso.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acción anular de /saldos/aportaciones/[aportacionId]', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function miembro(): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol: 'miembro', instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function anular(actor: Actor | undefined, aportacionId: string, motivo: string) {
		return actions.anular(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/saldos/aportaciones/[aportacionId=ulid]',
				params: { aportacionId },
				cuerpo: new URLSearchParams({ motivo }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-060: la persona anula su aportación reciente y el saldo vuelve a su valor anterior', async () => {
		const ana = miembro();
		const { id } = registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 500 });

		await expect(anular(ana, id, 'Importe mal escrito')).resolves.toMatchObject({ anulada: true });
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(0);
	});

	it('anular dos veces responde YA_ANULADO y no vuelve a mover el saldo', async () => {
		const ana = miembro();
		const { id } = registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 500 });
		await anular(ana, id, 'Primera vez');

		const { datos } = desenvolverFallo(await anular(ana, id, 'Segunda vez'));

		expect(datos).toMatchObject({ errores: { general: { codigo: 'YA_ANULADO' } } });
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(0);
	});

	it('un motivo vacío se rechaza con error de campo', async () => {
		const ana = miembro();
		const { id } = registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 500 });

		const { estado, datos } = desenvolverFallo(await anular(ana, id, ''));

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores.motivo');
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(500);
	});
});
