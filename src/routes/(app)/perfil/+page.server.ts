import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, falloDeNegocio, fallo } from '../fallo';
import { cambiarContrasena, cerrarSesionesGlobal as cerrarTodasLasSesiones, NOMBRE_COOKIE } from '#lib/server/auth';
import { cambiarPreferencia, leerPreferencias } from '#lib/server/notificaciones';
import { buscarUsuarioPorId, cambiarFoto } from '#lib/server/usuarios';
import { esquemaQuitarFotoPersona, esquemaSubirFotoPersona, urlFotoUsuario } from '#lib/shared/contratos/fotos-usuario';
import { bytesDeFoto } from '../admin/capsulas/formulario';
import { esquemaCambioContrasena } from '#lib/shared/contratos/auth';
import { esquemaPreferencia } from '#lib/shared/contratos/preferencias';
import { textos } from '#lib/shared/textos';

// Perfil de la persona que entra (RF-137, RF-138). Solo toca su propia cuenta: el actor de la sesión decide.
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, actor.usuarioId);
	if (!persona) redirect(303, resolve('/(auth)/login'));
	const preferencias = leerPreferencias(locals.ambiente.db, { usuarioId: persona.id, rol: persona.rol });
	return {
		id: persona.id,
		nombre: persona.nombre,
		email: persona.email,
		rol: persona.rol,
		preferencias,
		fotoUrl: persona.fotoRuta ? urlFotoUsuario(persona.id, persona.fotoRuta) : null,
	};
};

export const actions: Actions = {
	// Foto propia (RF-208): se valida con su esquema y la procesa el caso de uso. Sin JavaScript también funciona.
	foto: async ({ request, locals }) => {
		const entrada = esquemaSubirFotoPersona.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({}, async () => {
			await cambiarFoto(locals.ambiente, actor, actor.usuarioId, (await bytesDeFoto(entrada.data.foto)) ?? null);
			return { confirmacion: textos.fotoPersona.guardada };
		});
	},

	quitarFoto: async ({ request, locals }) => {
		const entrada = esquemaQuitarFotoPersona.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({}, async () => {
			await cambiarFoto(locals.ambiente, actor, actor.usuarioId, null);
			return { confirmacion: textos.fotoPersona.quitada };
		});
	},

	// Cambio desde el perfil (RF-137): verifica la contraseña actual, guarda la nueva y cierra las demás sesiones.
	cambiarContrasena: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaCambioContrasena.safeParse(datos);
		const valores = {};
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		return ejecutarAccion(valores, async () => {
			await cambiarContrasena(locals.ambiente.db, {
				usuarioId: actor.usuarioId,
				sesionIdHash: actor.sesionIdHash,
				contrasenaActual: entrada.data.contrasenaActual,
				contrasenaNueva: entrada.data.contrasenaNueva,
				instante: locals.ambiente.reloj.ahora(),
			});
			return { confirmacion: textos.confirmaciones.contrasenaCambiada };
		});
	},

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

	// Cierre en todos los dispositivos (RF-137, CA-137). Incluye la sesión actual: la cookie se borra y se vuelve a la entrada.
	cerrarSesionesGlobal: ({ locals, cookies }) => {
		const actor = locals.actor;
		if (!actor) redirect(303, resolve('/(auth)/login'));
		cerrarTodasLasSesiones(locals.ambiente.db, actor.usuarioId);
		cookies.delete(NOMBRE_COOKIE, { path: '/' });
		redirect(303, resolve('/(auth)/login'));
	},
};
