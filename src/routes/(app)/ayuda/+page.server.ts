import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';

// Ayuda de avisos (plan F6 D11, RF-103). Solo requiere sesión: no lee datos de la persona.
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	return {};
};
