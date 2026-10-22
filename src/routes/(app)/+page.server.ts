import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esquemaAvisoInicio } from '#lib/shared/contratos/privacidad';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, locals.actor.usuarioId);
	// Un parámetro desconocido o con otro valor no muestra aviso; no es un error de la página.
	const aviso = esquemaAvisoInicio.safeParse(Object.fromEntries(url.searchParams));
	return { nombre: persona?.nombre ?? '', privacidadAceptada: aviso.success && aviso.data.aviso === 'privacidad-aceptada' };
};
