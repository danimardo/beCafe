import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../fallo';
import { leerHistorialConsumos } from '#lib/server/economia';
import { leerTipo } from '#lib/server/catalogo';
import { buscarUsuarioPorId } from '#lib/server/usuarios';

// Historial mínimo de consumos (plan D4). F6 lo completa con aportaciones, compras y filtros (spec, Assumptions).
const esquemaConsulta = z.strictObject({
	pagina: z.coerce.number().int().min(1, { error: 'La página empieza en 1' }).default(1),
});

export const load: PageServerLoad = ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	const consulta = esquemaConsulta.safeParse(Object.fromEntries(url.searchParams));
	const pagina = consulta.success ? consulta.data.pagina : 1;
	try {
		const db = locals.ambiente.db;
		const { filas, hayMas } = leerHistorialConsumos(db, actor, pagina);
		return {
			pagina,
			hayMas,
			filas: filas.map((consumo) => ({
				id: consumo.id,
				tipo: leerTipo(db, consumo.tipoCapsulaId)?.nombre ?? '',
				autor: buscarUsuarioPorId(db, consumo.usuarioId)?.nombre ?? '',
				hora: consumo.horaRegistro,
				precio: consumo.precioAplicado,
				estado: consumo.estado,
			})),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
