import { error, fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { definirContrasenaConEnlace, NOMBRE_COOKIE, opcionesCookie, validarEnlace } from '#lib/server/auth';
import { esErrorDeNegocio, registrarRechazo } from '#lib/server/plataforma';
import { fallo } from '#lib/shared/contratos/formularios';
import { esquemaDefinirContrasena } from '#lib/shared/contratos/auth';
import { textos } from '#lib/shared/textos';

// `load` solo mira el enlace: no lo consume. Consumirlo es la *action* (RF-132).
export const load: PageServerLoad = ({ locals, params, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	const enlace = validarEnlace(locals.ambiente.db, params.token, locals.ambiente.reloj.ahora());
	if (!enlace.valido) return { valido: false as const, tipo: null };
	return { valido: true as const, tipo: enlace.tipo };
};

export const actions: Actions = {
	default: async ({ request, locals, params, cookies }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaDefinirContrasena.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, {});

		let sesionToken: string;
		try {
			({ sesionToken } = await definirContrasenaConEnlace(locals.ambiente.db, {
				token: params.token,
				contrasena: entrada.data.contrasena,
				instante: locals.ambiente.reloj.ahora(),
			}));
		} catch (cause) {
			if (!esErrorDeNegocio(cause)) throw cause;
			registrarRechazo(cause);
			if (cause.codigo === 'CONTRASENA_NO_VALIDA') {
				return fail(400, { errores: { contrasena: { codigo: cause.codigo, mensaje: textos.errores.CONTRASENA_NO_VALIDA } }, valores: {} });
			}
			if (cause.codigo === 'ENLACE_NO_VALIDO') {
				return fail(410, { errores: { general: { codigo: cause.codigo, mensaje: textos.acceso.enlaceNoValido } }, valores: {} });
			}
			error(500, textos.errorNoPrevisto);
		}
		cookies.set(NOMBRE_COOKIE, sesionToken, opcionesCookie(locals.ambiente.origen));
		redirect(303, resolve('/(app)'));
	},
};
