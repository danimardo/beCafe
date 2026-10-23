import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../fallo';
import { bytesDeFoto } from '../admin/capsulas/formulario';
import { leerComprasRecientes, leerSaldoHucha, leerTiposComprables, registrarCompra } from '#lib/server/economia';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esquemaCompra, lineasDesdeFormulario } from '#lib/shared/contratos/economia';
import { nuevoId } from '#lib/server/plataforma';

const LIMITE_COMPRAS = 20;
const LINEAS_INICIALES = 1;

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const compras = leerComprasRecientes(db, actor, LIMITE_COMPRAS).map((compra) => ({
			id: compra.id,
			fecha: compra.registradaEn,
			importe: compra.importeTotal,
			estado: compra.estado,
			autor: buscarUsuarioPorId(db, compra.usuarioId)?.nombre ?? '',
		}));
		return {
			compras,
			tipos: leerTiposComprables(db, actor).map((tipo) => ({ id: tipo.id, nombre: tipo.nombre })),
			saldoHucha: leerSaldoHucha(db).saldo,
			numeroLineas: LINEAS_INICIALES,
			clienteId: nuevoId(),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// Sin JavaScript, «Añadir línea» vuelve a mostrar el formulario con una línea más y lo que ya estaba escrito.
	anadirLinea: async ({ request }) => {
		const formulario = await request.formData();
		const lineas = lineasDesdeFormulario(
			formulario.getAll('tipo').map(String),
			formulario.getAll('cantidad').map(String),
			formulario.getAll('importe').map(String),
		);
		return { lineas, numeroLineas: Math.max(lineas.length, LINEAS_INICIALES) + 1 };
	},

	// Quita la última línea sin registrar nada; siempre queda una línea (CA-040).
	quitarLinea: async ({ request }) => {
		const formulario = await request.formData();
		const lineas = lineasDesdeFormulario(
			formulario.getAll('tipo').map(String),
			formulario.getAll('cantidad').map(String),
			formulario.getAll('importe').map(String),
		).slice(0, -1);
		return { lineas, numeroLineas: Math.max(lineas.length, LINEAS_INICIALES) };
	},

	registrar: async ({ request, locals }) => {
		const formulario = await request.formData();
		const datos = Object.fromEntries(formulario);
		const lineas = lineasDesdeFormulario(
			formulario.getAll('tipo').map(String),
			formulario.getAll('cantidad').map(String),
			formulario.getAll('importe').map(String),
		);
		const valores = {
			clienteId: datos.clienteId,
			lineas,
			confirmoHuchaNegativa: datos.confirmoHuchaNegativa,
			numeroLineas: Math.max(lineas.length, LINEAS_INICIALES),
		};
		const entrada = esquemaCompra.safeParse({
			clienteId: datos.clienteId,
			lineas,
			foto: datos.foto,
			confirmoHuchaNegativa: datos.confirmoHuchaNegativa,
		});
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		const resultado = await ejecutarAccion(valores, async () => {
			const foto = await bytesDeFoto(entrada.data.foto);
			const { id } = await registrarCompra(locals.ambiente, actor, {
				clienteId: entrada.data.clienteId,
				lineas: entrada.data.lineas,
				foto,
				confirmoHuchaNegativa: entrada.data.confirmoHuchaNegativa === 'on',
			});
			return { id };
		});
		// El 409 de la confirmación de hucha negativa incluye el saldo teórico para que la vista lo muestre (T031).
		if (!('id' in resultado)) {
			if (resultado.status !== 409) return resultado;
			return fail(409, { ...resultado.data, saldoTeorico: leerSaldoHucha(locals.ambiente.db).saldo });
		}
		redirect(303, resolve('/(app)/compras/[compraId=ulid]', { compraId: resultado.id }));
	},
};
