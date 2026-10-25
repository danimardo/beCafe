import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../fallo';
import { bytesDeFoto } from '../admin/capsulas/formulario';
import { leerComprasRecientes, leerSaldoHucha, leerTiposComprables, registrarCompra } from '#lib/server/economia';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esErrorDeNegocio, nuevoId, registrarRechazo } from '#lib/server/plataforma';
import { esquemaCompra, lineasDesdeFormulario } from '#lib/shared/contratos/economia';
import { urlFotoCapsula } from '#lib/shared/contratos/capsulas';

const LIMITE_COMPRAS = 20;

// Detalle del rechazo por hucha negativa (RF-198): lo que la confirmación enseña a la persona.
const esquemaConfirmacion = z.object({ saldo: z.number().int(), importe: z.number().int(), resultado: z.number().int() });

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
			// RF-197: todos los tipos activos, con coste medio o sin él (la primera compra lo crea).
			tipos: leerTiposComprables(db, actor).map((tipo) => ({
				id: tipo.id,
				nombre: tipo.nombre,
				color: tipo.color,
				fotoUrl: tipo.fotoRuta ? urlFotoCapsula(tipo.id) : null,
			})),
			saldoHucha: leerSaldoHucha(db).saldo,
			clienteId: nuevoId(),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	registrar: async ({ request, locals }) => {
		const formulario = await request.formData();
		const datos = Object.fromEntries(formulario);
		const lineas = lineasDesdeFormulario(
			formulario.getAll('tipo').map(String),
			formulario.getAll('cantidad').map(String),
			formulario.getAll('importe').map(String),
		);
		// Sin el archivo: el navegador no puede volver a rellenar un campo de archivo (contracts/formularios.md).
		const valores = { clienteId: datos.clienteId, lineas };
		const entrada = esquemaCompra.safeParse({
			clienteId: datos.clienteId,
			lineas,
			foto: datos.foto,
			confirmarHuchaNegativa: datos.confirmarHuchaNegativa,
			saldoConfirmado: datos.saldoConfirmado,
		});
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		const resultado = await ejecutarAccion(valores, async () => {
			const foto = await bytesDeFoto(entrada.data.foto);
			try {
				const { id } = await registrarCompra(locals.ambiente, actor, {
					clienteId: entrada.data.clienteId,
					lineas: entrada.data.lineas,
					foto,
					confirmoHuchaNegativa: entrada.data.confirmarHuchaNegativa === 'si',
					saldoConfirmado: entrada.data.saldoConfirmado,
				});
				return { id };
			} catch (causa) {
				if (!esErrorDeNegocio(causa) || causa.codigo !== 'CONFIRMACION_REQUERIDA') throw causa;
				const confirmacion = esquemaConfirmacion.safeParse(causa.detalle);
				if (!confirmacion.success) throw causa;
				registrarRechazo(causa);
				return { confirmacion: confirmacion.data };
			}
		});
		// RF-198: la confirmación pendiente vuelve con el saldo, el importe y el resultado; la página la muestra como diálogo o paso intermedio.
		if ('confirmacion' in resultado) return fail(409, { confirmacion: resultado.confirmacion, valores });
		if (!('id' in resultado)) return resultado;
		redirect(303, resolve('/(app)/compras/[compraId=ulid]', { compraId: resultado.id }));
	},
};
