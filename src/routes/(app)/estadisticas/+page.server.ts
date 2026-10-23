import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../fallo';
import { leerEquipo, leerPersonales } from '#lib/server/estadisticas';
import { leerTipo } from '#lib/server/catalogo';
import { listarUsuarios } from '#lib/server/usuarios';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { normalizarConsultaEstadisticas } from './consulta';
import { esquemaUlid } from '#lib/shared/contratos/comunes';

// `/estadisticas`: «Mías» o «Equipo» (RF-120, RF-121). El administrador elige persona y va a su pantalla (RF-123).
export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));

	// El selector de persona del administrador envía `persona` y la pantalla de esa persona toma el relevo.
	const persona = esquemaUlid.safeParse(url.searchParams.get('persona'));
	if (persona.success && actor.rol === 'administrador') {
		redirect(303, resolve('/(app)/estadisticas/[usuarioId=ulid]', { usuarioId: persona.data }));
	}

	const { consulta, consultaValida } = normalizarConsultaEstadisticas(url.searchParams);
	const ahora = esquemaInstanteUtc.parse(locals.ambiente.reloj.ahora());
	try {
		const db = locals.ambiente.db;
		const datos =
			consulta.vista === 'equipo' ? leerEquipo(db, actor, consulta, ahora) : leerPersonales(db, actor, actor.usuarioId, consulta, ahora);
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
			personas: actor.rol === 'administrador' ? listarUsuarios(db).map((fila) => ({ id: fila.id, nombre: fila.nombre })) : [],
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
