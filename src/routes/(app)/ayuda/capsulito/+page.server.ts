import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';

// Laboratorio de demostración de Capsulito (RF-188, CA-188). Solo requiere sesión activa.
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	return {};
};
