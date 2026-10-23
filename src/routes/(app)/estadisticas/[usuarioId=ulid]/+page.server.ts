import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../../fallo';
import { leerPersonales } from '#lib/server/estadisticas';
import { leerTipo } from '#lib/server/catalogo';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { normalizarConsultaEstadisticas } from '../consulta';
import { textos } from '#lib/shared/textos';

// Estadísticas de una persona concreta (RN-060, CA-122). Sin permiso, 403 sin datos; persona inexistente, 404.
export const load: PageServerLoad = ({ locals, url, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const { consulta, consultaValida } = normalizarConsultaEstadisticas(url.searchParams);
	const ahora = esquemaInstanteUtc.parse(locals.ambiente.reloj.ahora());
	try {
		const db = locals.ambiente.db;
		const persona = buscarUsuarioPorId(db, params.usuarioId);
		if (!persona) error(404, textos.admin.personaNoEncontrada);
		const datos = leerPersonales(db, actor, persona.id, consulta, ahora);
		return {
			persona: persona.nombre,
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
