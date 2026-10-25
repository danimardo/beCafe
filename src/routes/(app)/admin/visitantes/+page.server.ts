import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, fallo, falloDeNegocio } from '../../fallo';
import { eliminarNombreVisita, leerVisitas } from '#lib/server/auth';
import { listarTipos } from '#lib/server/catalogo';
import { anularCafeVisitante, leerCafesVisitante, revisarCafesVisitante } from '#lib/server/economia';
import {
	esquemaAnularCafeVisitante,
	esquemaEliminarNombre,
	esquemaRevisarCafes,
	esquemaVistaVisitantes,
} from '#lib/shared/contratos/visitantes';
import { textos } from '#lib/shared/textos';

// Revisión de cafés de visitante (plan F10 D4; RF-193, RF-210, CA-193, CA-210). El permiso lo comprueba cada caso de uso.
export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const filtro = esquemaVistaVisitantes.safeParse(Object.fromEntries(url.searchParams));
	if (!filtro.success) error(400, textos.errores.VALIDACION);
	try {
		const db = locals.ambiente.db;
		const pagina = leerCafesVisitante(db, actor, filtro.data);
		const tipos = new Map(listarTipos(db).map((tipo) => [tipo.id, tipo.nombre]));
		const visitas = new Map(leerVisitas(db, [...new Set(pagina.filas.map((fila) => fila.visitaId))]).map((v) => [v.id, v.nombre]));
		return {
			vista: filtro.data.vista,
			pagina: filtro.data.pagina,
			total: pagina.total,
			tamanoPagina: pagina.tamanoPagina,
			cafes: pagina.filas.map((fila) => ({
				...fila,
				tipo: tipos.get(fila.tipoCapsulaId) ?? '',
				nombre: visitas.get(fila.visitaId) ?? null,
			})),
		};
	} catch (causa) {
		errorDeCarga(causa);
	}
};

export const actions: Actions = {
	revisar: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const datos = await request.formData();
		const entrada = esquemaRevisarCafes.safeParse({ ids: datos.getAll('ids'), decision: datos.get('decision') });
		if (!entrada.success) return fallo(400, entrada.error, {});
		const resultado = await ejecutarAccion({}, () => revisarCafesVisitante(locals.ambiente, actor, entrada.data));
		if (!('aprobados' in resultado)) return resultado;
		return { revision: resultado };
	},

	anular: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAnularCafeVisitante.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, datos);
		const resultado = await ejecutarAccion(datos, () => anularCafeVisitante(locals.ambiente, actor, entrada.data.id, entrada.data.motivo));
		if (resultado !== undefined) return resultado;
		return { anulado: entrada.data.id };
	},

	eliminarNombre: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaEliminarNombre.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const resultado = await ejecutarAccion({}, () => eliminarNombreVisita(locals.ambiente, actor, entrada.data.visitaId));
		if (resultado !== undefined) return resultado;
		return { nombreEliminado: entrada.data.visitaId };
	},
};
