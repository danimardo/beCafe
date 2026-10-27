import { error, fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import {
	anotarPruebaRestauracion,
	crearClienteS3,
	ErrorCopia,
	ErrorOperacionCopia,
	ESTADO_OPERACION_COPIA,
	esquemaAnotarPrueba,
	hacerCopiaManual,
	leerCopias,
	leerEstadoRestauracion,
	leerPruebas,
	type CopiaBucket,
} from '#lib/server/copias';
import { esErrorDeNegocio, registrarRechazo } from '#lib/server/plataforma';
import { leerUltimaAuditoria } from '#lib/server/usuarios';
import { textos } from '#lib/shared/textos';
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
			origenSistema: locals.ambiente.copias.origen,
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
	// «Hacer copia ahora» (RF-286): hace y sube una copia manual. Sin JavaScript, la página se recarga con el resultado.
	copiaManual: async ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		try {
			await hacerCopiaManual(locals.ambiente, actor);
		} catch (causa) {
			if (causa instanceof ErrorOperacionCopia) {
				const mensaje = textos.copias.operacion[causa.codigo];
				return fail(ESTADO_OPERACION_COPIA[causa.codigo], { errores: { copia: { codigo: causa.codigo, mensaje } }, valores: {} });
			}
			if (causa instanceof ErrorCopia) {
				// 424: falló una dependencia (el bucket). Un 5xx es un fallo de la aplicación y aquí el rechazo está previsto (XIII).
				const mensaje = textos.copias.copiaFallida(textos.copias.codigo[causa.codigo]);
				return fail(424, { errores: { copia: { codigo: causa.codigo, mensaje } }, valores: {} });
			}
			if (esErrorDeNegocio(causa)) {
				registrarRechazo(causa);
				if (causa.codigo === 'SIN_PERMISO') error(403, textos.errores.SIN_PERMISO);
			}
			throw causa;
		}
		return { copiaHecha: true as const };
	},

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
