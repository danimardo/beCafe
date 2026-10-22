import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { aceptarPrivacidadPersona, buscarUsuarioPorId, privacidadPendiente } from '#lib/server/usuarios';
import { VERSION_PRIVACIDAD } from '#lib/shared/privacidad';

// Pantalla que bloquea hasta aceptar la versión vigente (RF-160). Sin navegación: solo se sale aceptando.
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
	if (!persona) redirect(303, resolve('/(auth)/login'));
	if (!privacidadPendiente(persona, VERSION_PRIVACIDAD)) redirect(303, resolve('/(app)'));
	return { version: VERSION_PRIVACIDAD, primeraVez: persona.privacidadLeidaEn === null };
};

export const actions: Actions = {
	aceptar: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) redirect(303, resolve('/(auth)/login'));
		aceptarPrivacidadPersona(locals.ambiente.db, {
			usuarioId: actor.usuarioId,
			version: VERSION_PRIVACIDAD,
			instante: locals.ambiente.reloj.ahora(),
		});
		redirect(303, `${resolve('/(app)')}?aviso=privacidad-aceptada`);
	},
};
