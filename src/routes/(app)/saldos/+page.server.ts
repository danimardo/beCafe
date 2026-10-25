import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../fallo';
import { leerAportacionesPropias, leerSaldoHucha, leerSaldoPropio, leerSaldos, registrarAportacion } from '#lib/server/economia';
import { ultimosRegistros } from '../historial/vista';
import { esquemaAportacion } from '#lib/shared/contratos/economia';
import { nuevoId } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { textos } from '#lib/shared/textos';

const LIMITE_APORTACIONES = 20;

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		return {
			saldoPropio: leerSaldoPropio(db, actor),
			saldos: leerSaldos(db, actor),
			esAdministrador: actor.rol === 'administrador',
			recientes: ultimosRegistros(db, actor, 5),
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

		return ejecutarAccion({ beneficiarioId: datos.beneficiarioId }, () => {
			const { id, duplicado } = registrarAportacion(locals.ambiente, actor, entrada.data);
			const beneficiario = entrada.data.beneficiarioId;
			const nombre =
				beneficiario && beneficiario !== actor.usuarioId ? buscarUsuarioPorId(locals.ambiente.db, beneficiario)?.nombre : undefined;
			return {
				id,
				duplicado,
				confirmacion: nombre ? textos.economia.aportacionRegistradaPara(nombre) : textos.economia.aportacionRegistrada,
			};
		});
	},
};
