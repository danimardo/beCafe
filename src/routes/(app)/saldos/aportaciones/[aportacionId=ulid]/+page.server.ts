import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../../fallo';
import { anularAportacion, leerAportacion } from '#lib/server/economia';
import { esquemaAnulacion } from '#lib/shared/contratos/economia';
import { textos } from '#lib/shared/textos';

export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		return { aportacion: leerAportacion(locals.ambiente.db, actor, params.aportacionId) };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	anular: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacion.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, datos);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		return ejecutarAccion({}, () => {
			anularAportacion(locals.ambiente, actor, params.aportacionId, entrada.data.motivo);
			return { anulada: true, confirmacion: textos.economia.aportacionAnulada };
		});
	},
};
