import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import { anularCompra, leerCompra } from '#lib/server/economia';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { leerTipo } from '#lib/server/catalogo';
import { esquemaAnulacion } from '#lib/shared/contratos/economia';
import { textos } from '#lib/shared/textos';

export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const compra = leerCompra(db, actor, params.compraId);
		return {
			compra: {
				id: compra.id,
				fecha: compra.registradaEn,
				importe: compra.importeTotal,
				estado: compra.estado,
				autor: buscarUsuarioPorId(db, compra.usuarioId)?.nombre ?? '',
				tieneFoto: compra.fotoTicketRuta !== null,
				lineas: compra.lineas.map((linea) => ({
					tipo: leerTipo(db, linea.tipoCapsulaId)?.nombre ?? '',
					cantidad: linea.cantidad,
					importe: linea.importe,
				})),
				regularizaciones: compra.regularizaciones.map((fila) => ({
					usuario: buscarUsuarioPorId(db, fila.usuarioId)?.nombre ?? '',
					importe: fila.importe,
				})),
			},
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	anular: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacion.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, datos);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		return ejecutarAccion({}, () => {
			const resumen = anularCompra(locals.ambiente, actor, params.compraId, entrada.data.motivo).map((fila) => ({
				usuario: buscarUsuarioPorId(locals.ambiente.db, fila.usuarioId)?.nombre ?? '',
				importe: fila.importe,
			}));
			return { anulada: true, resumen, confirmacion: textos.economia.compraAnulada };
		});
	},
};
