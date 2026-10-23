import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../../fallo';
import { esquemaCambioRol, esquemaSoloReautenticacion } from '#lib/shared/contratos/usuarios';
import { cambiarRolPersona, generarEnlaceParaPersona, obtenerPersona, reactivarPersona } from '#lib/server/auth';
import { textos } from '#lib/shared/textos';

export const load: PageServerLoad = ({ locals, params, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		return { persona: obtenerPersona(locals.ambiente.db, actor, params.usuarioId), bajaRegistrada: url.searchParams.get('baja') === 'ok' };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	cambiarRol: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaCambioRol.safeParse(datos);
		const valores = { rol: datos.rol };
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		return ejecutarAccion(valores, async () => {
			await cambiarRolPersona(locals.ambiente.db, {
				actor,
				usuarioId: params.usuarioId,
				rolNuevo: entrada.data.rol,
				contrasenaActual: entrada.data.contrasenaActual,
				instante: locals.ambiente.reloj.ahora(),
			});
			return { confirmacion: textos.confirmaciones.rolCambiado };
		});
	},

	generarEnlace: async ({ request, locals, params }) => {
		const entrada = esquemaSoloReautenticacion.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		return ejecutarAccion({}, async () => {
			const enlace = await generarEnlaceParaPersona(locals.ambiente.db, {
				actor,
				usuarioId: params.usuarioId,
				contrasenaActual: entrada.data.contrasenaActual,
				instante: locals.ambiente.reloj.ahora(),
			});
			return {
				enlace: `${locals.ambiente.origen}/acceso/${enlace.token}`,
				expiraEn: enlace.expiraEn,
				tipo: enlace.tipo,
				confirmacion: textos.confirmaciones.enlaceGenerado,
			};
		});
	},

	// Reactivar (RF-136, CA-136) deja a la persona sin contraseña; el enlace de invitación que se devuelve es el que la hace entrar.
	reactivar: async ({ request, locals, params }) => {
		const entrada = esquemaSoloReautenticacion.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		return ejecutarAccion({}, async () => {
			const instante = locals.ambiente.reloj.ahora();
			await reactivarPersona(locals.ambiente.db, {
				actor,
				usuarioId: params.usuarioId,
				contrasenaActual: entrada.data.contrasenaActual,
				instante,
			});
			const enlace = await generarEnlaceParaPersona(locals.ambiente.db, {
				actor,
				usuarioId: params.usuarioId,
				contrasenaActual: entrada.data.contrasenaActual,
				instante,
			});
			return {
				enlace: `${locals.ambiente.origen}/acceso/${enlace.token}`,
				expiraEn: enlace.expiraEn,
				tipo: enlace.tipo,
				confirmacion: textos.confirmaciones.personaReactivada,
			};
		});
	},
};
