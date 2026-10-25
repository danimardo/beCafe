import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { esIdPantalla, esquemaConsultaAyuda } from '#lib/shared/ayuda/pantallas';

// `/ayuda` (RF-203): sin JavaScript, el «?» de cada pantalla llega con `pantalla=<id>` y su ayuda se muestra primero.
// Una consulta no válida muestra la ayuda general: no es un error de la página.
export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	const consulta = esquemaConsultaAyuda.safeParse(Object.fromEntries(url.searchParams));
	const pantalla = consulta.success ? consulta.data.pantalla : undefined;
	return { pantalla: pantalla !== undefined && esIdPantalla(pantalla) ? pantalla : null };
};
