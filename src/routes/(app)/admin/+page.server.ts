import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../fallo';
import { exigirAdministrador } from '#lib/server/auth';
import { leerEstadoRestauracion } from '#lib/server/copias';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';

// Secciones de administración (RF-130). El permiso lo decide el caso de uso, no el layout (ARCHITECTURE.md §7).
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		exigirAdministrador(actor, '/admin');
		// Aviso de restauración (RF-144, CA-144): solo para administradores.
		const restauracion = leerEstadoRestauracion(locals.ambiente.db, actor, fechaDeMadrid(locals.ambiente.reloj.ahora()));
		return { avisoRestauracion: restauracion.aviso };
	} catch (causa) {
		errorDeCarga(causa);
	}
};
