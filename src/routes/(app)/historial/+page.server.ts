import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../fallo';
import { leerHistorial, TAMANO_PAGINA } from '#lib/server/economia';
import { normalizarConsulta } from './consulta';
import { vistaDeFilas } from './vista';

export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const { consulta, consultaValida, filtros } = normalizarConsulta(Object.fromEntries(url.searchParams));
	try {
		const db = locals.ambiente.db;
		const pagina = leerHistorial(db, actor, filtros);
		return {
			consulta,
			consultaValida,
			pagina: pagina.pagina,
			paginas: Math.max(1, Math.ceil(pagina.total / TAMANO_PAGINA)),
			filas: vistaDeFilas(db, pagina.filas),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
