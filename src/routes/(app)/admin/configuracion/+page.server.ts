import { redirect, fail } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio } from '../../fallo';
import { exigirAdministrador, exigirReautenticacion } from '#lib/server/auth';
import { cambiarConfiguracion, leerConfiguracion, leerUltimosCambios, RANGOS, type ValoresConfiguracion } from '#lib/server/configuracion';
import { parsearLimite } from '#lib/shared/deuda/tramos';
import { textos } from '#lib/shared/textos';

// Parámetros de negocio (plan F8 D7; RF-150, CA-150, CA-138). La reautenticación se pide antes de cambiar nada.
// Campo vacío de contraseña = ausente: así se pide la contraseña en vez de fallar la validación de formato.
const sinVacio = (valor: unknown) => (typeof valor === 'string' && valor !== '' ? valor : undefined);

const entero = (rango: keyof typeof RANGOS) =>
	z
		.string()
		.trim()
		.regex(/^-?\d+$/)
		.transform(Number)
		.pipe(RANGOS[rango]);

const esquemaGuardar = z.strictObject({
	plazoAutoanulacionMin: entero('plazo_autoanulacion_min'),
	intervaloRellenosMin: entero('intervalo_rellenos_min'),
	limiteDeudaCentimos: z
		.string()
		.transform((texto) => parsearLimite(texto))
		.pipe(RANGOS.limite_deuda_centimos),
});

const MENSAJES = {
	plazoAutoanulacionMin: textos.configuracion.rango.plazo,
	intervaloRellenosMin: textos.configuracion.rango.intervalo,
	limiteDeudaCentimos: textos.configuracion.rango.limite,
} as const;

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		exigirAdministrador(actor, '/admin/configuracion');
		const db = locals.ambiente.db;
		const valores = leerConfiguracion(db);
		const ultimos = leerUltimosCambios(db);
		return {
			valores,
			ultimos: Object.fromEntries(
				Object.entries(ultimos).map(([clave, cambio]) => [clave, cambio ? cambio.modificadoEn.slice(0, 16).replace('T', ' ') : null]),
			),
		};
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// «Guardar configuración» (CA-150). Primero valida los rangos, luego pide la contraseña si hace falta (CA-138).
	guardar: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const valores = {
			plazoAutoanulacionMin: datos.plazoAutoanulacionMin,
			limiteDeudaCentimos: datos.limiteDeudaCentimos,
			intervaloRellenosMin: datos.intervaloRellenosMin,
		};
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});

		const entrada = esquemaGuardar.safeParse(valores);
		if (!entrada.success) {
			const campo = entrada.error.issues[0]?.path[0];
			const clave = campo === 'limiteDeudaCentimos' || campo === 'intervaloRellenosMin' ? campo : 'plazoAutoanulacionMin';
			return fail(400, { errores: { [clave]: { codigo: 'VALIDACION', mensaje: MENSAJES[clave] } }, valores });
		}

		return ejecutarAccion(valores, async () => {
			await exigirReautenticacion(locals.ambiente.db, {
				actor,
				contrasenaActual: sinVacio(datos.contrasenaActual),
				instante: locals.ambiente.reloj.ahora(),
			});
			const cambios: ValoresConfiguracion = entrada.data;
			cambiarConfiguracion(locals.ambiente, actor, cambios);
			return { guardado: true as const };
		});
	},
};
