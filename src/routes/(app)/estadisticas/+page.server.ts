import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../fallo';
import { leerEquipo } from '#lib/server/estadisticas';
import { leerTipo } from '#lib/server/catalogo';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { normalizarConsultaEstadisticas } from './consulta';

// `/estadisticas`: el consumo de todo el departamento, sin elegir persona (RF-201, RF-202, plan F10 D7).
export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const { consulta, consultaValida } = normalizarConsultaEstadisticas(url.searchParams);
	const ahora = esquemaInstanteUtc.parse(locals.ambiente.reloj.ahora());
	try {
		const db = locals.ambiente.db;
		const datos = leerEquipo(db, actor, consulta, ahora);
		return {
			consulta,
			consultaValida,
			resumen: {
				...datos,
				porTipo: datos.porTipo.map((tipo) => {
					const fila = leerTipo(db, tipo.tipoCapsulaId);
					return { nombre: fila?.nombre ?? '', cafes: tipo.cafes, color: fila?.color ?? '' };
				}),
			},
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
