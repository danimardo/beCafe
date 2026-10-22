import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { VERSION_PRIVACIDAD } from '#lib/shared/privacidad';

// Consulta permanente del texto (RF-161): la versión vigente y el instante en que la persona la leyó.
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
	if (!persona) redirect(303, resolve('/(auth)/login'));
	return { version: VERSION_PRIVACIDAD, leidaEn: persona.privacidadLeidaEn };
};
