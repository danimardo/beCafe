import type { Encuadre } from '#lib/shared/contratos/encuadre';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import { bytesDeFoto } from '../capsulas/formulario';
import { esquemaAltaUsuario } from '#lib/shared/contratos/usuarios';
import { esquemaFotoAlta } from '#lib/shared/contratos/fotos-usuario';
import { darDeAltaConInvitacion, listarPersonas } from '#lib/server/auth';
import { textos } from '#lib/shared/textos';

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		return listarPersonas(locals.ambiente.db, actor);
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// Alta con invitación (RF-130, RF-131, CA-130, CA-131). El enlace se devuelve una vez, para copiarlo.
	alta: async ({ request, locals }) => {
		const { foto: archivo, encuadreX, encuadreY, encuadreLado, ...datos } = Object.fromEntries(await request.formData());
		const entrada = esquemaAltaUsuario.safeParse(datos);
		// `valores` nunca lleva el archivo (constitución XVII); sin JavaScript hay que volver a adjuntarlo.
		const valores = { nombre: datos.nombre, email: datos.email, rol: datos.rol };
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const foto = esquemaFotoAlta.safeParse({ foto: archivo, encuadreX, encuadreY, encuadreLado });
		if (!foto.success) return fallo(400, foto.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		const { nombre, email, rol, contrasenaActual } = entrada.data;
		return ejecutarAccion(valores, async () => {
			const alta = await darDeAltaConInvitacion(locals.ambiente.db, {
				actor,
				nombre,
				correo: email,
				rol,
				contrasenaActual,
				...(await fotoDeAlta(foto.data.foto, foto.data.encuadre, locals.ambiente.directorioFotos)),
				instante: locals.ambiente.reloj.ahora(),
			});
			return {
				origen: 'alta' as const,
				enlace: `${locals.ambiente.origen}/acceso/${alta.token}`,
				expiraEn: alta.expiraEn,
				confirmacion: textos.confirmaciones.personaDadaDeAlta,
			};
		});
	},
};

async function fotoDeAlta(
	archivo: File | undefined,
	encuadre: Encuadre | undefined,
	directorio: string,
): Promise<{ foto?: { bytes: Uint8Array; directorio: string; encuadre: Encuadre | undefined } }> {
	const bytes = await bytesDeFoto(archivo);
	return bytes ? { foto: { bytes, directorio, encuadre } } : {};
}
