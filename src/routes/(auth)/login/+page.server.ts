import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { iniciarSesion, NOMBRE_COOKIE, opcionesCookie } from '#lib/server/auth';
import { esErrorDeNegocio, registrarRechazo } from '#lib/server/plataforma';
import { fallo } from '#lib/shared/contratos/formularios';
import { esquemaInicioSesion } from '#lib/shared/contratos/auth';
import { textos } from '#lib/shared/textos';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.actor) redirect(303, resolve('/(app)'));
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaInicioSesion.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, { email: datos.email });

		try {
			const { sesionToken } = await iniciarSesion(locals.ambiente.db, {
				correo: entrada.data.email,
				contrasena: entrada.data.contrasena,
				instante: locals.ambiente.reloj.ahora(),
			});
			cookies.set(NOMBRE_COOKIE, sesionToken, opcionesCookie(locals.ambiente.origen));
		} catch (error) {
			if (!esErrorDeNegocio(error)) throw error;
			registrarRechazo(error);
			return fail(401, {
				errores: { general: { codigo: error.codigo, mensaje: textos.errores.CREDENCIALES_INCORRECTAS } },
				valores: { email: datos.email },
			});
		}
		redirect(303, resolve('/(app)'));
	},
};
