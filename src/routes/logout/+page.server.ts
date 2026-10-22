import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions } from './$types';
import { cerrarSesionActual, NOMBRE_COOKIE } from '#lib/server/auth';

// Cierre de la sesión actual (RF-138). Solo acción: no tiene página propia.
export const actions: Actions = {
	default: ({ locals, cookies }) => {
		if (locals.actor) cerrarSesionActual(locals.ambiente.db, locals.actor.usuarioId, locals.actor.sesionIdHash);
		cookies.delete(NOMBRE_COOKIE, { path: '/' });
		redirect(303, resolve('/(auth)/login'));
	},
};
