import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../../../fallo';
import { leerRegistroDeControl } from '#lib/server/economia';
import { RecursoNoEncontrado } from '#lib/server/plataforma';
import { textos } from '#lib/shared/textos';

// Detalle de solo lectura de un arqueo o de una línea de recuento (plan F5 D7). Sin permiso propio: lo ve quien ve el historial.
export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		return { registro: leerRegistroDeControl(locals.ambiente.db, actor, params.id) };
	} catch (causa) {
		if (causa instanceof RecursoNoEncontrado) error(404, textos.historial.control.noEncontrado);
		return errorDeCarga(causa);
	}
};
