import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { leerPanel, marcarVistos, type AvisoPanel } from '#lib/server/notificaciones';
import { esquemaPanelAvisos } from '#lib/shared/contratos/avisos';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';

// Panel de avisos de los últimos 30 días (RF-107, CA-021). Los más recientes sin abrir van primero, como «Nuevos».
const formatoFecha = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' });

export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const entrada = esquemaPanelAvisos.safeParse(Object.fromEntries(url.searchParams));
	const cantidadNuevos = entrada.success ? (entrada.data.nuevos ?? 0) : 0;
	const { avisos } = leerPanel(locals.ambiente.db, { usuarioId: actor.usuarioId }, locals.ambiente.reloj.ahora());
	const conFecha = (aviso: AvisoPanel) => ({ ...aviso, cuando: formatoFecha.format(new Date(esquemaInstanteUtc.parse(aviso.creadaEn))) });
	return {
		nuevos: avisos.slice(0, cantidadNuevos).map(conFecha),
		anteriores: avisos.slice(cantidadNuevos).map(conFecha),
	};
};

export const actions: Actions = {
	// Marca como vistos los avisos sin abrir y vuelve a la página con su número (sin JavaScript también funciona).
	abrir: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) redirect(303, resolve('/(auth)/login'));
		const marcados = marcarVistos(locals.ambiente, { usuarioId: actor.usuarioId });
		redirect(303, `${resolve('/(app)/avisos')}?nuevos=${marcados}`);
	},
};
