import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { errorDeCarga } from '../../fallo';
import { leerCatalogoAdmin } from '#lib/server/economia';
import { urlFotoCapsula } from '#lib/shared/contratos/capsulas';

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const tipos = leerCatalogoAdmin(locals.ambiente.db, actor).map((tipo) => ({
			...tipo,
			fotoUrl: tipo.fotoRuta ? urlFotoCapsula(tipo.id) : null,
		}));
		return { tipos };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};
