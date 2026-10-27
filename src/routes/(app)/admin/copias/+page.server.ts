import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import {
	anotarPruebaRestauracion,
	crearClienteS3,
	esquemaAnotarPrueba,
	leerCopias,
	leerEstadoRestauracion,
	leerPruebas,
	type CopiaBucket,
} from '#lib/server/copias';
import { leerUltimaAuditoria } from '#lib/server/usuarios';
import { z } from 'zod';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';

// Panel de copias (plan F8 D5, RF-143, CA-143). El permiso lo comprueba cada caso de uso (ARCHITECTURE.md §7).
export const load: PageServerLoad = async ({ locals, url }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const hoy = fechaDeMadrid(locals.ambiente.reloj.ahora());
		const copias = leerCopias(db, actor);
		const s3 = locals.ambiente.copias.s3;
		// La lista del bucket no bloquea la pantalla: si falla, el resto se ve y el aviso lo explica (plan F14 D1).
		let bucket: CopiaBucket[] = [];
		let bucketError = false;
		if (s3) {
			try {
				bucket = await crearClienteS3(s3).listar();
			} catch {
				bucketError = true;
			}
		}
		const ultima = leerUltimaAuditoria(db, 'copia.restaurada');
		const detalle = z.object({ resguardo: z.string() }).safeParse(ultima?.detalle);
		return {
			copias,
			pruebas: leerPruebas(db, actor),
			restauracion: leerEstadoRestauracion(db, actor, hoy),
			s3Activa: s3 !== undefined,
			bucket,
			bucketError,
			ultimaRestauracion:
				ultima && detalle.success ? { instante: ultima.creadoEn, copia: ultima.objetoId, resguardo: detalle.data.resguardo } : null,
			preparada: url.searchParams.get('restauracion') === 'preparada' || locals.ambiente.mantenimiento.restaurando,
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
