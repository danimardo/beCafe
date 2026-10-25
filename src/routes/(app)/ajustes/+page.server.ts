import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, falloDeNegocio, fallo } from '../fallo';
import { cambiarPreferencia, leerPreferencias } from '#lib/server/notificaciones';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esquemaPreferencia } from '#lib/shared/contratos/preferencias';
import { textos } from '#lib/shared/textos';

// Ajustes de la persona que entra (F11, RF-221): apariencia, Capsulito y voz, avisos e instalar la app.
// Apariencia y Capsulito se guardan en el dispositivo (constitución V); solo los avisos viven en la cuenta.
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
	if (!persona) redirect(303, resolve('/(auth)/login'));
	return { preferencias: leerPreferencias(locals.ambiente.db, { usuarioId: persona.id, rol: persona.rol }) };
};

export const actions: Actions = {
	// Activa o desactiva un tipo de aviso para la persona (RF-102). Sin JavaScript funciona igual: es un formulario.
	preferencia: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaPreferencia.safeParse(datos);
		const valores = {};
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);
		const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
		if (!persona) return falloDeNegocio('SIN_SESION', valores);

		return ejecutarAccion(valores, () => {
			cambiarPreferencia(locals.ambiente, { usuarioId: persona.id, rol: persona.rol }, entrada.data);
			return { confirmacion: textos.notificaciones.preferenciaGuardada };
		});
	},
};
