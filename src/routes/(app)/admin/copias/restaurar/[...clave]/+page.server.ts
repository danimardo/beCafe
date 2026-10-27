import { error, fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { errorDeCarga } from '../../../../fallo';
import {
	crearClienteS3,
	ErrorRestauracion,
	esquemaClaveCopia,
	esquemaRestaurar,
	ESTADO_RESTAURACION,
	exigirPermisoCopias,
	leerCopiaARestaurar,
	restaurarCopia,
} from '#lib/server/copias';
import { esErrorDeNegocio, registrarRechazo, type Ambiente } from '#lib/server/plataforma';
import { fallo } from '#lib/shared/contratos/formularios';
import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
import { textos } from '#lib/shared/textos';

// Restaurar una copia (plan F14 D1, RF-254, contracts/restauracion.md). Es una pantalla y no un diálogo para que funcione sin JavaScript.
const esquemaConsulta = z.strictObject({ clave: esquemaClaveCopia });

/** Rechazo de un campo del formulario. `valores` nunca lleva la contraseña (constitución XVII). */
function rechazo(estado: number, campo: 'contrasena' | 'general', codigo: string, mensaje: string, valores: Record<string, unknown>) {
	const errores: Record<string, { codigo: string; mensaje: string }> = { [campo]: { codigo, mensaje } };
	return fail(estado, { errores, valores });
}

function clienteDe(ambiente: Ambiente) {
	const s3 = ambiente.copias.s3;
	if (!s3) error(404, textos.copias.restauracion.SIN_S3);
	return crearClienteS3(s3);
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const consulta = esquemaConsulta.safeParse(params);
	if (!consulta.success) error(404, textos.copias.restauracion.NO_ENCONTRADA);
	try {
		// El permiso va antes que el bucket: un miembro recibe 403 aunque no haya S3 configurado.
		exigirPermisoCopias(locals.ambiente.db, actor);
		const copia = await leerCopiaARestaurar(locals.ambiente, actor, consulta.data.clave, clienteDe(locals.ambiente));
		return {
			copia: { ...copia, fecha: formatearFechaHoraMadrid(copia.modificadaEn) },
			origenSistema: locals.ambiente.copias.origen,
		};
	} catch (causa) {
		if (causa instanceof ErrorRestauracion) {
			error(ESTADO_RESTAURACION[causa.codigo], textos.copias.restauracion[causa.codigo]);
		}
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	restaurar: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) redirect(303, resolve('/(auth)/login'));
		const formulario = Object.fromEntries(await request.formData());
		const valores = { clave: formulario.clave };
		const entrada = esquemaRestaurar.safeParse(formulario);
		if (!entrada.success) return fallo(400, entrada.error, valores);
		try {
			exigirPermisoCopias(locals.ambiente.db, actor);
			await restaurarCopia(locals.ambiente, actor, entrada.data, clienteDe(locals.ambiente));
		} catch (causa) {
			if (causa instanceof ErrorRestauracion) {
				return rechazo(ESTADO_RESTAURACION[causa.codigo], 'general', causa.codigo, textos.copias.restauracion[causa.codigo], valores);
			}
			if (esErrorDeNegocio(causa)) {
				registrarRechazo(causa);
				if (causa.codigo === 'CREDENCIALES_INCORRECTAS') {
					return rechazo(400, 'contrasena', causa.codigo, textos.copias.contrasenaIncorrecta, valores);
				}
				if (causa.codigo === 'SIN_PERMISO') error(403, textos.errores.SIN_PERMISO);
			}
			throw causa;
		}
		redirect(303, `${resolve('/(app)/admin/copias')}?restauracion=preparada`);
	},
};
