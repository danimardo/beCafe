import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../fallo';
import { leerAportacionesPropias, leerSaldoHucha, leerSaldoPropio, registrarAportacion } from '#lib/server/economia';
import { esquemaAportacion } from '#lib/shared/contratos/economia';
import { nuevoId } from '#lib/server/plataforma';
import { textos } from '#lib/shared/textos';

const LIMITE_APORTACIONES = 20;

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		return {
			saldoPropio: leerSaldoPropio(db, actor),
			hucha: leerSaldoHucha(db),
			aportaciones: leerAportacionesPropias(db, actor, LIMITE_APORTACIONES),
			clienteId: nuevoId(),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	aportar: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAportacion.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, datos);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		return ejecutarAccion({}, () => {
			const { id, duplicado } = registrarAportacion(locals.ambiente, actor, entrada.data);
			return { id, duplicado, confirmacion: textos.economia.aportacionRegistrada };
		});
	},
};
