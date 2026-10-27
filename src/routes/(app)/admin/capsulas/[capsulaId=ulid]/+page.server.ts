import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../../fallo';
import { esColorPropio, esquemaBorrado, esquemaCapsula, esquemaQuitarFotoCapsula, OPCION_COLOR_PROPIO, urlFotoCapsula } from '#lib/shared/contratos/capsulas';
import { borrarCapsula, cambiarEstadoCapsula, editarCapsula, leerCapsulaAdmin, quitarFotoCapsula } from '#lib/server/economia';
import { textos } from '#lib/shared/textos';
import { bytesDeFoto, valoresDeFormulario } from '../formulario';

export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const tipo = leerCapsulaAdmin(locals.ambiente.db, actor, params.capsulaId, locals.ambiente.reloj.ahora());
		// Valores iniciales del formulario: el servidor los devuelve tal cual tras un rechazo (constitución XVII).
		const iniciales = {
			nombre: tipo.nombre,
			marca: tipo.marca,
			intensidad: tipo.intensidad === null ? '' : String(tipo.intensidad),
			// Un color propio vuelve al formulario como «Otro color» con su valor en el selector (RF-269).
			color: esColorPropio(tipo.color) ? OPCION_COLOR_PROPIO : tipo.color,
			colorPropio: esColorPropio(tipo.color) ? tipo.color : '',
			umbralMinimo: String(tipo.umbralMinimo),
		};
		return { tipo: { ...tipo, fotoUrl: tipo.fotoRuta ? urlFotoCapsula(tipo.id) : null }, iniciales };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	guardar: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const valores = valoresDeFormulario(datos);
		const entrada = esquemaCapsula.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		return ejecutarAccion(valores, async () => {
			await editarCapsula(locals.ambiente, actor, params.capsulaId, {
				nombre: entrada.data.nombre,
				marca: entrada.data.marca,
				intensidad: entrada.data.intensidad,
				color: entrada.data.color,
				umbralMinimo: entrada.data.umbralMinimo,
				foto: await bytesDeFoto(entrada.data.foto),
			});
			return { confirmacion: textos.capsulas.guardada };
		});
	},

	quitarFoto: async ({ request, locals, params }) => {
		const entrada = esquemaQuitarFotoCapsula.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({}, () => {
			quitarFotoCapsula(locals.ambiente, actor, params.capsulaId);
			return { confirmacion: textos.capsulas.fotoQuitada };
		});
	},

	retirar: async ({ locals, params }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({}, () => {
			cambiarEstadoCapsula(locals.ambiente, actor, params.capsulaId, 'retirado');
			return { confirmacion: textos.capsulas.retirado };
		});
	},

	reactivar: async ({ locals, params }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({}, () => {
			cambiarEstadoCapsula(locals.ambiente, actor, params.capsulaId, 'activo');
			return { confirmacion: textos.capsulas.reactivado };
		});
	},

	// Borrado sin JavaScript: la casilla de confirmación es obligatoria (constitución X).
	borrar: async ({ request, locals, params }) => {
		const entrada = esquemaBorrado.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		const resultado = await ejecutarAccion({}, () => {
			borrarCapsula(locals.ambiente, actor, params.capsulaId);
			return { borrado: true as const };
		});
		if ('borrado' in resultado) redirect(303, resolve('/(app)/admin/capsulas'));
		return resultado;
	},
};
