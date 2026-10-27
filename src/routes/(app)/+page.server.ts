import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, falloDeNegocio, fallo } from './fallo';
import { ErrorDeNegocio, esErrorDeNegocio, nuevoId, registrar } from '#lib/server/plataforma';
import { leerConfiguracion } from '#lib/server/configuracion';
import { leerAvisoRecuentoPendiente, marcarVisto } from '#lib/server/notificaciones';
import {
	asignarMensajeDia,
	buscarUsuarioPorId,
	entregarFrase,
	entregarSaludo,
	leerMarcasCuenta,
	leerSaludoDisponible,
	marcarCuenta,
	registrarInstalacion,
} from '#lib/server/usuarios';
import { deshacerRelleno, leerEstadoAgua, registrarRelleno } from '#lib/server/rellenos';
import {
	contarConsumos,
	deshacerConsumo,
	leerAvisosStock,
	leerConsumosRecientesPropios,
	leerPersonasBajoLimite,
	leerSaldoHucha,
	leerSaldoPropio,
	leerTiposInicio,
	leerTiposRegistrables,
	registrarConsumo,
} from '#lib/server/economia';
import { esquemaAvisoInicio } from '#lib/shared/contratos/privacidad';
import { esquemaRegistrarInstalacion } from '#lib/shared/contratos/instalacion';
import { esquemaVerAviso } from '#lib/shared/contratos/avisos';
import { esquemaConsumirForm, esquemaDeshacerForm } from '#lib/shared/contratos/consumos';
import { esquemaDeshacerRelleno, esquemaRellenar } from '#lib/shared/contratos/rellenos';
import { formatearHace } from '#lib/shared/fechas/formato';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { nombreDeMes } from '#lib/shared/fechas/meses';
import { urlFotoCapsula } from '#lib/shared/contratos/capsulas';
import { MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';

// Pantalla principal (RF-010 a RF-019, RF-060, RF-063). El toque es un formulario por fila: funciona sin JavaScript (principio XVII).
// Los identificadores de consumo se generan al cargar la página: un reenvío del mismo formulario no duplica el consumo (RF-016).

export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const db = locals.ambiente.db;
	const ahora = locals.ambiente.reloj.ahora();
	const persona = buscarUsuarioPorId(db, actor.usuarioId);
	const marcas = leerMarcasCuenta(db, actor.usuarioId);
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
	// RN-090: el orden de Inicio. La comprobación de `consumir` sigue con `leerTiposRegistrables`.
	const tipos = leerTiposInicio(db, actor, ahora).map((tipo) => ({
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
	// RN-091, RF-266: mensaje del día. Un aviso conocido por el servidor (deuda, stock bajo, aguador del mes) no gasta ninguno.
	const saldoPropio = leerSaldoPropio(db, actor);
	const hayAviso = saldoPropio < limiteDeudaCentimos || avisos.length > 0 || agua.aguador?.incluyeAlUsuario === true;
	const asignado = asignarMensajeDia(locals.ambiente, actor.usuarioId, { hayAviso });
	const mensajeDia = MENSAJES_DIA.find((mensaje) => mensaje.id === asignado?.mensajeId);
	return {
		agua,
		mensajeDia: mensajeDia ? { id: mensajeDia.id, texto: mensajeDia.texto } : null,
		nombre: persona?.nombre ?? '',
		usuarioId: actor.usuarioId,
		saldoPropio,
		limiteDeuda: limiteDeudaCentimos,
		hucha: hucha.saldo,
		deudores: leerPersonasBajoLimite(db, actor).map((persona) => ({ nombre: persona.nombre, saldo: persona.saldo })),
		privacidadAceptada: aviso.success && aviso.data.aviso === 'privacidad-aceptada',
		// RF-214: solo se lee; el saludo se entrega con `?/saludo` tras montar la página, para que una precarga no lo gaste.
		saludoDisponible: leerSaludoDisponible(db, actor.usuarioId, ahora),
		// RF-204: el tour se ofrece una vez por cuenta, o cuando la persona lo pide desde la ayuda.
		tourPendiente: !marcas.tourInicioVisto || (aviso.success && aviso.data.tour === 'si'),
		// RF-206: descartar la tarjeta de instalación se guarda en la cuenta.
		instalacionDescartada: marcas.instalacionDescartada,
		// RF-207: la oferta de avisos se hace una sola vez por cuenta.
		ofertaAvisosVista: marcas.ofertaAvisosVista,
		avisos,
		// RF-246: el último recuento sin ver. Se muestra hasta pulsar «Entendido» y sigue en el panel de avisos.
		avisoRecuento: leerAvisoRecuentoPendiente(db, { usuarioId: actor.usuarioId }, esquemaInstanteUtc.parse(ahora)),
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
	// RF-206: «Ahora no» en la tarjeta de instalación. Repetirlo no cambia nada.
	descartarInstalacion: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		marcarCuenta(locals.ambiente, actor.usuarioId, 'instalacion_descartada');
		return { instalacionDescartada: true };
	},

	// RF-279: el navegador envía su estado de instalación (aceptada o rechazada). Se aplica la transición de RF-280.
	registrarInstalacion: async ({ request, locals }) => {
		const entrada = esquemaRegistrarInstalacion.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		registrarInstalacion(locals.ambiente, actor, entrada.data.estado);
		return { instalacionRegistrada: true };
	},

	// RF-207: «Activar avisos» o «Ahora no» en la oferta. Las dos la dan por vista; el permiso lo gestiona el navegador.
	ofertaAvisosVista: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		marcarCuenta(locals.ambiente, actor.usuarioId, 'oferta_avisos_vista');
		return { ofertaAvisosVista: true };
	},

	// RF-214: el saludo se entrega al abrir Inicio, con JavaScript, si han pasado 2 horas desde el último. Una segunda llamada seguida devuelve `null`.
	saludo: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		try {
			return { saludo: { fraseId: entregarSaludo(locals.ambiente, actor.usuarioId)?.fraseId ?? null } };
		} catch (causa) {
			registrar('frase.fallo', { usuarioId: actor.usuarioId, lista: 'saludo', tipo: causa instanceof Error ? causa.name : 'desconocido' });
			return { saludo: { fraseId: null } };
		}
	},

	// RF-246: «Entendido» en el aviso de recuento. Solo marca un aviso de esta persona; repetirlo no cambia nada.
	verAviso: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaVerAviso.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		marcarVisto(locals.ambiente, { usuarioId: actor.usuarioId }, entrada.data.avisoId);
		return { avisoVisto: true as const };
	},

	// RF-204: terminar o saltar el tour lo marca como visto en la cuenta. Repetirlo no cambia nada.
	tourVisto: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		marcarCuenta(locals.ambiente, actor.usuarioId, 'tour_inicio_visto');
		return { tourVisto: true };
	},

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

		const resultado = await ejecutarAccion({}, () => {
			try {
				return registrarConsumo(locals.ambiente, actor, {
					clienteId: entrada.data.clienteId,
					tipoCapsulaId: entrada.data.tipoCapsulaId,
					invitado: entrada.data.invitado === '1',
					horaGesto: entrada.data.horaGesto ?? locals.ambiente.reloj.ahora(),
					via: 'directo',
					sinStockVisto: entrada.data.sinStock === '1',
					confirmado: entrada.data.confirmarSinStock === 'si',
				});
			} catch (causa) {
				// RF-217: la pregunta de confirmación no es un error; vuelve con lo necesario para el paso intermedio sin JavaScript.
				if (esErrorDeNegocio(causa) && causa.codigo === 'CONFIRMAR_SIN_STOCK') return { confirmar: true as const };
				throw causa;
			}
		});
		if ('confirmar' in resultado) {
			const tipo = leerTiposRegistrables(locals.ambiente.db, actor, locals.ambiente.reloj.ahora()).find(
				(candidato) => candidato.id === entrada.data.tipoCapsulaId,
			);
			return fail(409, {
				confirmarSinStock: {
					tipoCapsulaId: entrada.data.tipoCapsulaId,
					nombre: tipo?.nombre ?? '',
					clienteId: entrada.data.clienteId,
					invitado: entrada.data.invitado,
				},
			});
		}
		if (!('id' in resultado)) return resultado;
		// RF-213: la frase se entrega después del consumo y fuera de su transacción; un fallo no lo afecta (principio XIII).
		let fraseId: string | null = null;
		if (entrada.data.mascota === 'si' && !resultado.duplicado) {
			try {
				fraseId = entregarFrase(locals.ambiente, actor.usuarioId, 'registro').fraseId;
			} catch (causa) {
				registrar('frase.fallo', {
					usuarioId: actor.usuarioId,
					lista: 'registro',
					tipo: causa instanceof Error ? causa.name : 'desconocido',
				});
			}
		}
		return {
			consumo: {
				fraseId,
				id: resultado.id,
				tipoCapsulaId: entrada.data.tipoCapsulaId,
				invitado: entrada.data.invitado === '1',
				precio: resultado.precio,
				descuadre: resultado.descuadre,
				// RF-243: un reenvío del mismo toque no vuelve a celebrar.
				duplicado: resultado.duplicado,
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
