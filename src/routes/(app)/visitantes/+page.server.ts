import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, fallo, falloDeNegocio } from '../fallo';
import { crearEnlaceVisitante, listarEnlacesVisitante, revocarEnlaceVisitante } from '#lib/server/auth';
import { qrSvg } from '#lib/server/plataforma';
import { esquemaRevocarEnlace } from '#lib/shared/contratos/visitantes';

// Enlaces de visitante de un miembro (plan F10 D4; RF-189, CA-189). El token solo se devuelve al crear el enlace.
export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	return { enlaces: listarEnlacesVisitante(locals.ambiente.db, actor, locals.ambiente.reloj.ahora()) };
};

export const actions: Actions = {
	crear: ({ locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const creado = crearEnlaceVisitante(locals.ambiente, actor);
		// Absoluta y sin `resolve()`: dentro de una action, `resolve` devuelve una ruta relativa a la página.
		const url = `${locals.ambiente.origen}/visita/${creado.token}`;
		// El QR va como imagen SVG en una URL `data:`: funciona sin JavaScript y sin insertar HTML en la página.
		const qr = `data:image/svg+xml;base64,${Buffer.from(qrSvg(url)).toString('base64')}`;
		return { enlace: { id: creado.enlaceId, url, qr, expiraEn: creado.expiraEn } };
	},

	revocar: async ({ request, locals }) => {
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		const entrada = esquemaRevocarEnlace.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const resultado = await ejecutarAccion({}, () => revocarEnlaceVisitante(locals.ambiente, actor, entrada.data.enlaceId));
		if (resultado !== undefined) return resultado;
		return { revocado: true };
	},
};
