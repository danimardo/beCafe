import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import { anotarPruebaRestauracion, esquemaAnotarPrueba, leerCopias, leerEstadoRestauracion, leerPruebas } from '#lib/server/copias';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';

// Panel de copias (plan F8 D5, RF-143, CA-143). El permiso lo comprueba cada caso de uso (ARCHITECTURE.md §7).
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const hoy = fechaDeMadrid(locals.ambiente.reloj.ahora());
		return {
			copias: leerCopias(db, actor),
			pruebas: leerPruebas(db, actor),
			restauracion: leerEstadoRestauracion(db, actor, hoy),
			s3Activa: locals.ambiente.s3Activa,
			hoy,
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// «Anotar prueba de restauración» (RF-143): fecha no futura, resultado y notas opcionales.
	anotarPrueba: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const formulario = Object.fromEntries(await request.formData());
		const entrada = esquemaAnotarPrueba.safeParse(formulario);
		if (!entrada.success) return fallo(400, entrada.error, { realizadaEl: formulario.realizadaEl, notas: formulario.notas });
		return ejecutarAccion({ realizadaEl: formulario.realizadaEl, notas: formulario.notas }, () => {
			anotarPruebaRestauracion(locals.ambiente, actor, entrada.data);
			return { anotada: true as const };
		});
	},
};
