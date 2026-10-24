import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { registrarRelleno } from '#lib/server/rellenos';

// Anulación desde el detalle de un relleno (F7 T015, CA-174, RN-083). El `load` no se prueba: lo cubren las pruebas E2E (AGENTS §7).
const INSTANTE = '2026-10-23T10:00:00.000Z';

/** Devuelve lo que rechaza `operacion`, o `undefined` si se resuelve. */
async function capturarErrorAsync(operacion: () => Promise<unknown>): Promise<unknown> {
	try {
		await operacion();
		return undefined;
	} catch (causa) {
		return causa;
	}
}

describe('anulación de un relleno desde su detalle (CA-174, RN-083)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, {
				id: usuarioId,
				nombre,
				correo: `${nombre.toLowerCase()}-${usuarioId}@ejemplo.es`,
				rol: 'miembro',
				instante: INSTANTE,
			}),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function anular(actor: Actor, rellenoId: string, motivo: string) {
		const resultado = await actions.anular(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/rellenos/[rellenoId=ulid]',
				params: { rellenoId },
				cuerpo: new URLSearchParams({ motivo }),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
		return resultado;
	}

	function rellenar(actor: Actor): string {
		return registrarRelleno(entorno.ambiente, { usuarioId: actor.usuarioId }, { clienteId: nuevoId() }).id;
	}

	it('el autor anula su relleno con un motivo', async () => {
		const ana = sesionDe('Ana');
		const id = rellenar(ana);

		await expect(anular(ana, id, 'Registrado por error')).resolves.toMatchObject({ anulado: true });
	});

	it('CA-174: anular un relleno ajeno responde 403 y no lo anula', async () => {
		const ana = sesionDe('Ana');
		const luis = sesionDe('Luis');
		const id = rellenar(ana);

		const causa = await capturarErrorAsync(() => anular(luis, id, 'No es mío'));

		expect(isHttpError(causa, 403)).toBe(true);
	});
});
