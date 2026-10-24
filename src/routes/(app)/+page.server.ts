import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, falloDeNegocio, fallo } from './fallo';
import { ErrorDeNegocio, nuevoId } from '#lib/server/plataforma';
import { leerConfiguracion } from '#lib/server/configuracion';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { deshacerRelleno, leerEstadoAgua, registrarRelleno } from '#lib/server/rellenos';
import {
	contarConsumos,
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
import { esquemaDeshacerRelleno, esquemaRellenar } from '#lib/shared/contratos/rellenos';
import { formatearHace } from '#lib/shared/fechas/formato';
import { nombreDeMes } from '#lib/shared/fechas/meses';
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
	const consumosPropios = contarConsumos(db, {
		desde: '1970-01-01T00:00:00.000Z',
		hasta: '9999-12-31T23:59:59.999Z',
		usuarioId: actor.usuarioId,
	});
	const propiosPorTipo = new Map<string, number>();
	const invitadosPorTipo = new Map<string, number>();
	for (const item of consumosPropios) {
		if (item.invitado) {
			invitadosPorTipo.set(item.tipoCapsulaId, (invitadosPorTipo.get(item.tipoCapsulaId) ?? 0) + 1);
		} else {
			propiosPorTipo.set(item.tipoCapsulaId, (propiosPorTipo.get(item.tipoCapsulaId) ?? 0) + 1);
		}
	}
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
		propios: propiosPorTipo.get(tipo.id) ?? 0,
		invitados: invitadosPorTipo.get(tipo.id) ?? 0,
		clienteId: nuevoId(),
	}));
	const nombres = new Map(tipos.map((tipo) => [tipo.id, tipo.nombre]));
	const hucha = leerSaldoHucha(db);
	const { limiteDeudaCentimos } = leerConfiguracion(db);
	const estadoAgua = leerEstadoAgua(db, actor, ahora);
	const agua = {
		clienteId: nuevoId(),
		ultimo: estadoAgua.ultimo
			? {
					id: estadoAgua.ultimo.id,
					nombre: estadoAgua.ultimo.nombre,
					hace: formatearHace(estadoAgua.ultimo.registradoEn, ahora),
					esPropio: estadoAgua.ultimo.esPropio,
				}
			: null,
		aguador: estadoAgua.aguadores
			? {
					mes: nombreDeMes(estadoAgua.aguadores.mes),
					nombres: estadoAgua.aguadores.personas.map((persona) => persona.nombre).join(' y '),
					incluyeAlUsuario: estadoAgua.aguadores.personas.some((persona) => persona.esPropio),
				}
			: null,
	};
	return {
		agua,
		nombre: persona?.nombre ?? '',
		usuarioId: actor.usuarioId,
		saldoPropio: leerSaldoPropio(db, actor),
		limiteDeuda: limiteDeudaCentimos,
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
	// «He rellenado el agua» (RF-170, RF-172): el servidor decide el intervalo; un rechazo vuelve con quién y cuándo (409).
	rellenar: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaRellenar.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});

		let resultado: ReturnType<typeof registrarRelleno>;
		try {
			resultado = registrarRelleno(locals.ambiente, actor, { clienteId: entrada.data.clienteId });
		} catch (causa) {
			if (!(causa instanceof ErrorDeNegocio) || causa.codigo !== 'RELLENO_RECIENTE' || !causa.detalle) {
				return ejecutarAccion({}, () => {
					throw causa;
				});
			}
			const autorId = String(causa.detalle.autorId);
			return fail(409, {
				codigo: causa.codigo,
				autor: buscarUsuarioPorId(locals.ambiente.db, autorId)?.nombre ?? '',
				esPropio: causa.detalle.esPropio === true,
				hace: formatearHace(String(causa.detalle.registradoEn), locals.ambiente.reloj.ahora()),
			});
		}
		return { registrado: true as const, rellenoId: resultado.id };
	},

	// «Deshacer» de un relleno (RF-013, RF-171): solo el autor dentro del plazo (CA-171).
	deshacerRelleno: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaDeshacerRelleno.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});

		return ejecutarAccion({}, () => {
			deshacerRelleno(locals.ambiente, actor, entrada.data.rellenoId);
			return { deshechoRelleno: true as const };
		});
	},

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
			consumo: {
				id: resultado.id,
				tipoCapsulaId: entrada.data.tipoCapsulaId,
				invitado: entrada.data.invitado === '1',
				precio: resultado.precio,
				descuadre: resultado.descuadre,
			},
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
