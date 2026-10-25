import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { abrirVisita, NOMBRE_COOKIE_VISITA, opcionesCookieVisita, validarEnlaceVisitante } from '#lib/server/auth';
import { esErrorDeNegocio, registrarRechazo } from '#lib/server/plataforma';
import { fallo } from '#lib/shared/contratos/formularios';
import { esquemaEntrarVisita } from '#lib/shared/contratos/visitantes';
import { textos } from '#lib/shared/textos';

// Entrada de un visitante con su enlace (plan F10 D3; RF-190, CA-190). `load` solo mira el enlace; abrir la visita es la *action*.
export const load: PageServerLoad = ({ locals, params, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	const estado = validarEnlaceVisitante(locals.ambiente.db, params.token, locals.ambiente.reloj.ahora());
	return estado.valido ? { valido: true as const, motivo: null } : { valido: false as const, motivo: estado.motivo };
};

export const actions: Actions = {
	entrar: async ({ request, locals, params, cookies }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaEntrarVisita.safeParse(datos);
		if (!entrada.success) return fallo(400, entrada.error, datos);

		let abierta: ReturnType<typeof abrirVisita>;
		try {
			abierta = abrirVisita(locals.ambiente, params.token, entrada.data.nombre);
		} catch (causa) {
			if (!esErrorDeNegocio(causa)) throw causa;
			registrarRechazo(causa);
			return fail(410, { errores: { general: { codigo: causa.codigo, mensaje: textos.visitantes.enlaceDesconocido } }, valores: {} });
		}
		cookies.set(
			NOMBRE_COOKIE_VISITA,
			abierta.tokenVisita,
			opcionesCookieVisita(locals.ambiente.origen, abierta.expiraEn, locals.ambiente.reloj.ahora()),
		);
		redirect(303, resolve('/(visita)/visita'));
	},
};
