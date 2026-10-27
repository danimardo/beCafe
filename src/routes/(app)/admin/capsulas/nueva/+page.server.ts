import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../../fallo';
import { exigirAdministrador } from '#lib/server/auth';
import { esquemaCapsula } from '#lib/shared/contratos/capsulas';
import { darDeAltaCapsula } from '#lib/server/economia';
import { textos } from '#lib/shared/textos';
import { bytesDeFoto, valoresDeFormulario } from '../formulario';

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		exigirAdministrador(actor, 'admin/capsulas');
		return {};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	crear: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const valores = valoresDeFormulario(datos);
		const entrada = esquemaCapsula.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		const resultado = await ejecutarAccion(valores, async () => {
			const { id } = await darDeAltaCapsula(locals.ambiente, actor, {
				nombre: entrada.data.nombre,
				marca: entrada.data.marca,
				intensidad: entrada.data.intensidad,
				color: entrada.data.color,
				umbralMinimo: entrada.data.umbralMinimo,
				foto: await bytesDeFoto(entrada.data.foto),
				encuadre: entrada.data.encuadre,
			});
			return { id, confirmacion: textos.capsulas.altaCorrecta };
		});
		// Con éxito, vuelve al listado: el aviso de alta se muestra allí (`?alta=ok`).
		if ('confirmacion' in resultado) redirect(303, `${resolve('/(app)/admin/capsulas')}?alta=ok`);
		return resultado;
	},
};
