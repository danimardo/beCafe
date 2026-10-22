import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { buscarUsuarioPorId } from '#lib/server/usuarios';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, locals.actor.usuarioId);
	return { nombre: persona?.nombre ?? '' };
};
