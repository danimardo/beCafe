import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../../../fallo';
import { APORTACIONES_POR_PAGINA, leerAportacionesDe } from '#lib/server/economia';
import { esquemaPaginaAportaciones } from '#lib/shared/contratos/economia';
import { textos } from '#lib/shared/textos';

// Detalle de las aportaciones de una persona (RF-199, CA-199): fecha, importe y quién la registró.
export const load: PageServerLoad = ({ locals, params, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const filtro = esquemaPaginaAportaciones.safeParse(Object.fromEntries(url.searchParams));
	if (!filtro.success) error(400, textos.errores.VALIDACION);
	try {
		const detalle = leerAportacionesDe(locals.ambiente.db, actor, params.usuarioId, filtro.data.pagina);
		return {
			...detalle,
			usuarioId: params.usuarioId,
			pagina: filtro.data.pagina,
			paginas: Math.max(1, Math.ceil(detalle.total / APORTACIONES_POR_PAGINA)),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
