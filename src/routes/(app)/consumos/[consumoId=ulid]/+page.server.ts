import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import { anularConsumo, leerConsumo } from '#lib/server/economia';
import { leerTipo } from '#lib/server/catalogo';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esquemaAnulacion } from '#lib/shared/contratos/economia';

// Detalle de un consumo (RF-060 a RF-062; contracts/rutas.md). El permiso lo comprueba el caso de uso (`leerConsumo`, `anularConsumo`).

export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const consumo = leerConsumo(db, actor, params.consumoId);
		return {
			consumo: {
				id: consumo.id,
				tipo: leerTipo(db, consumo.tipoCapsulaId)?.nombre ?? '',
				autor: buscarUsuarioPorId(db, consumo.usuarioId)?.nombre ?? '',
				invitado: consumo.invitado,
				precio: consumo.precioAplicado,
				horaGesto: consumo.horaGesto,
				horaRegistro: consumo.horaRegistro,
				estado: consumo.estado,
				motivoAnulacion: consumo.motivoAnulacion,
			},
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	anular: async ({ request, locals, params }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const formulario = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacion.safeParse(formulario);
		if (!entrada.success) return fallo(400, entrada.error, {});
		return ejecutarAccion({ motivo: entrada.data.motivo }, () => {
			anularConsumo(locals.ambiente, actor, params.consumoId, entrada.data.motivo);
			return { anulado: true as const };
		});
	},
};
