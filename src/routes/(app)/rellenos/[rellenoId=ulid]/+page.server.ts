import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import { anularRelleno, leerRelleno } from '#lib/server/rellenos';
import { esquemaAnulacionRelleno } from '#lib/shared/contratos/rellenos';
import { esErrorDeNegocio } from '#lib/server/plataforma';
import { textos } from '#lib/shared/textos';

// Detalle de un relleno y su anulación (plan F8 D4, contracts/rutas.md). El permiso lo comprueba el caso de uso.
export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const relleno = leerRelleno(
			locals.ambiente.db,
			{ usuarioId: actor.usuarioId, administrador: actor.rol === 'administrador' },
			params.rellenoId,
			locals.ambiente.reloj.ahora(),
		);
		if (!relleno) error(404, textos.rellenos.noEncontrado);
		return { relleno };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	anular: async ({ request, locals, params }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const formulario = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacionRelleno.safeParse(formulario);
		if (!entrada.success) return fallo(400, entrada.error, {});
		return ejecutarAccion({ motivo: entrada.data.motivo }, () => {
			try {
				anularRelleno(locals.ambiente, { usuarioId: actor.usuarioId }, params.rellenoId, entrada.data.motivo);
			} catch (causa) {
				// CA-174: un relleno ajeno o de otra persona no se anula; la pantalla responde 403 sin mostrar el formulario.
				if (esErrorDeNegocio(causa) && causa.codigo === 'SIN_PERMISO') error(403, textos.errores.SIN_PERMISO);
				throw causa;
			}
			return { anulado: true as const };
		});
	},
};
