import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../../../fallo';
import { darDeBaja, leerLiquidacion, previsualizarBaja } from '#lib/server/economia';
import { esquemaBaja } from '#lib/shared/contratos/economia';

// Campo vacío de contraseña = ausente: así se pide la contraseña en vez de fallar la validación de formato.
const sinVacio = (valor: unknown) => (typeof valor === 'string' && valor !== '' ? valor : undefined);

export const load: PageServerLoad = ({ locals, params }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		return leerLiquidacion(locals.ambiente.db, actor, params.usuarioId);
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// Vista previa del efecto de un modo (CA-135). No escribe nada; la confirmación vuelve a comprobar el saldo.
	previsualizar: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const modo = esquemaBaja.shape.modo.safeParse(datos.modo);
		if (!modo.success) return fallo(400, modo.error, { modo: datos.modo });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({ modo: datos.modo }, () => ({
			prevision: previsualizarBaja(locals.ambiente.db, actor, params.usuarioId, modo.data),
		}));
	},

	// Baja con liquidación (RF-139, CA-135). Requiere el saldo que vio la persona administradora (CAMBIO_CONCURRENTE).
	baja: async ({ request, locals, params }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaBaja.safeParse({
			modo: datos.modo,
			saldoPrevisto: datos.saldoPrevisto,
			confirmoHuchaNegativa: datos.confirmoHuchaNegativa,
			contrasenaActual: sinVacio(datos.contrasenaActual),
		});
		const valores = { modo: datos.modo, saldoPrevisto: datos.saldoPrevisto, confirmoHuchaNegativa: datos.confirmoHuchaNegativa };
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', valores);

		const resultado = await ejecutarAccion(valores, async () => {
			await darDeBaja(locals.ambiente, actor, {
				usuarioId: params.usuarioId,
				modo: entrada.data.modo,
				saldoPrevisto: entrada.data.saldoPrevisto,
				confirmoHuchaNegativa: entrada.data.confirmoHuchaNegativa === 'on',
				contrasenaActual: entrada.data.contrasenaActual,
			});
			return { hecho: true as const };
		});
		if (!('hecho' in resultado)) return resultado;
		redirect(303, `${resolve('/(app)/admin/usuarios/[usuarioId=ulid]', { usuarioId: params.usuarioId })}?baja=ok`);
	},
};
