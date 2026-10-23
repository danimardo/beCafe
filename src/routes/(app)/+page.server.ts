import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, falloDeNegocio, fallo } from './fallo';
import { nuevoId } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import {
	deshacerConsumo,
	leerAvisosStock,
	leerConsumosRecientesPropios,
	leerPersonasBajoLimite,
	leerSaldoHucha,
	leerSaldoPropio,
	leerTiposRegistrables,
	registrarConsumo,
} from '#lib/server/economia';
import { esquemaAvisoInicio } from '#lib/shared/contratos/privacidad';
import { esquemaConsumirForm, esquemaDeshacerForm } from '#lib/shared/contratos/consumos';
import { urlFotoCapsula } from '#lib/shared/contratos/capsulas';

// Pantalla principal (RF-010 a RF-019, RF-060, RF-063). El toque es un formulario por fila: funciona sin JavaScript (principio XVII).
// Los identificadores de consumo se generan al cargar la página: un reenvío del mismo formulario no duplica el consumo (RF-016).

export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const db = locals.ambiente.db;
	const ahora = locals.ambiente.reloj.ahora();
	const persona = buscarUsuarioPorId(db, actor.usuarioId);
	// Un parámetro desconocido o con otro valor no muestra aviso; no es un error de la página.
	const aviso = esquemaAvisoInicio.safeParse(Object.fromEntries(url.searchParams));
	const avisos = leerAvisosStock(db, actor, ahora).map((tipo) => ({
		id: tipo.id,
		nombre: tipo.nombre,
		sinStock: tipo.stock <= 0,
		dias: tipo.estimacion.tipo === 'dias' ? tipo.estimacion.dias : null,
	}));
	const tipos = leerTiposRegistrables(db, actor, ahora).map((tipo) => ({
		id: tipo.id,
		nombre: tipo.nombre,
		marca: tipo.marca,
		intensidad: tipo.intensidad,
		color: tipo.color,
		fotoUrl: tipo.fotoRuta ? urlFotoCapsula(tipo.id) : null,
		stock: tipo.stock,
		umbralMinimo: tipo.umbralMinimo,
		enStockBajo: tipo.enStockBajo,
		precio: tipo.precio,
		dias: tipo.estimacion.tipo === 'dias' ? tipo.estimacion.dias : null,
		clienteId: nuevoId(),
	}));
	const nombres = new Map(tipos.map((tipo) => [tipo.id, tipo.nombre]));
	const hucha = leerSaldoHucha(db);
	return {
		nombre: persona?.nombre ?? '',
		usuarioId: actor.usuarioId,
		saldoPropio: leerSaldoPropio(db, actor),
		hucha: hucha.saldo,
		deudores: leerPersonasBajoLimite(db, actor).map((persona) => ({ nombre: persona.nombre, saldo: persona.saldo })),
		privacidadAceptada: aviso.success && aviso.data.aviso === 'privacidad-aceptada',
		avisos,
		tipos,
		recientes: leerConsumosRecientesPropios(db, actor, ahora).map((consumo) => ({
			id: consumo.id,
			tipo: nombres.get(consumo.tipoCapsulaId) ?? '',
			hora: consumo.horaRegistro,
			precio: consumo.precioAplicado,
			invitado: consumo.invitado,
		})),
	};
};

export const actions: Actions = {
	// `invitado` llega del botón pulsado: «0» la fila, «1» el botón de invitado (RF-014).
	consumir: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaConsumirForm.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});

		const resultado = await ejecutarAccion({}, () =>
			registrarConsumo(locals.ambiente, actor, {
				clienteId: entrada.data.clienteId,
				tipoCapsulaId: entrada.data.tipoCapsulaId,
				invitado: entrada.data.invitado === '1',
				horaGesto: entrada.data.horaGesto ?? locals.ambiente.reloj.ahora(),
				via: 'directo',
			}),
		);
		if (!('id' in resultado)) return resultado;
		return {
			consumo: { id: resultado.id, tipoCapsulaId: entrada.data.tipoCapsulaId, precio: resultado.precio, descuadre: resultado.descuadre },
		};
	},

	// «Deshacer» (RF-013): anulación del autor dentro del plazo, con el motivo fijo (Clarifications 5).
	deshacer: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaDeshacerForm.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});

		const resultado = await ejecutarAccion({}, () => {
			deshacerConsumo(locals.ambiente, actor, entrada.data.consumoId);
			return { deshecho: true as const };
		});
		return resultado;
	},
};
