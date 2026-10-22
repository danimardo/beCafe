import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { crearActor, crearSesion, NOMBRE_COOKIE, resolverSesion } from '#lib/server/auth';

// RF-138: cerrar sesión invalida el token de la cookie en la siguiente petición.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('POST /logout', () => {
	let entorno: EntornoPrueba;
	let token: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE }),
		);
		token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
	});

	afterEach(() => entorno.cerrar());

	it('la sesión deja de ser válida y la cookie se borra con redirección al acceso', async () => {
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		const evento = crearEventoAccion({
			locals: { ambiente: entorno.ambiente, actor: crearActor(sesion) },
			ruta: '/logout',
			params: {},
		});

		let redireccion: { status: number; location: string } | undefined;
		try {
			await actions.default(evento);
		} catch (error) {
			if (!isRedirect(error)) throw error;
			redireccion = { status: error.status, location: error.location };
		}

		expect(redireccion).toEqual({ status: 303, location: '/login' });
		expect(resolverSesion(entorno.ambiente.db, token, INSTANTE)).toBeNull();
		expect(evento.cookies.get(NOMBRE_COOKIE)).toBeUndefined();
		const cierre = entorno.eventos().find((evento) => evento.codigo === 'auth.sesion_cerrada');
		expect(cierre?.campos.alcance).toBe('actual');
	});
});
