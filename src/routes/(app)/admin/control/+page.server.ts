import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, errorDeCarga, falloDeNegocio, fallo } from '../../fallo';
import {
	anularArqueo,
	anularLineaRecuento,
	confirmarArqueo,
	confirmarRecuento,
	leerControl,
	leerEstadoTipos,
	previsualizarArqueo,
	previsualizarRecuento,
} from '#lib/server/economia';
import {
	esquemaAnulacionControl,
	esquemaArqueo,
	esquemaContadoArqueo,
	esquemaLineasRecuento,
	esquemaRecuento,
	lineasRecuentoDesdeFormulario,
} from '#lib/shared/contratos/economia';
import { textos } from '#lib/shared/textos';

// Campo vacío de contraseña = ausente: así se pide la contraseña en vez de fallar la validación de formato.
const sinVacio = (valor: unknown) => (typeof valor === 'string' && valor !== '' ? valor : undefined);

export const load: PageServerLoad = ({ locals }) => {
	const actor = locals.actor;
	if (!actor) redirect(303, resolve('/(auth)/login'));
	try {
		const db = locals.ambiente.db;
		const control = leerControl(db, actor);
		const tipos = leerEstadoTipos(db, actor, locals.ambiente.reloj.ahora())
			.filter((tipo) => tipo.estado === 'activo')
			.map((tipo) => ({ id: tipo.id, nombre: tipo.nombre, stock: tipo.stock }));
		return { ...control, tipos };
	} catch (causa) {
		return errorDeCarga(causa);
	}
};

export const actions: Actions = {
	// Vista previa: no escribe nada. El servidor calcula el efecto con los datos actuales (CA-080, RF-081).
	previsualizarArqueo: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const contado = esquemaContadoArqueo.safeParse(datos.contado);
		if (!contado.success) return fallo(400, contado.error, { contado: datos.contado });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		// `contado` vuelve con la vista previa para rellenar el campo sin JavaScript (constitución XVII).
		return ejecutarAccion({ contado: datos.contado }, () => ({
			contado: datos.contado,
			previsionArqueo: previsualizarArqueo(locals.ambiente.db, actor, contado.data),
		}));
	},

	confirmarArqueo: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaArqueo.safeParse({
			contado: datos.contado,
			contadoPrevisto: datos.contadoPrevisto,
			saldoTeoricoPrevisto: datos.saldoTeoricoPrevisto,
			contrasenaActual: sinVacio(datos.contrasenaActual),
		});
		const valores = { contado: datos.contado, contadoPrevisto: datos.contadoPrevisto, saldoTeoricoPrevisto: datos.saldoTeoricoPrevisto };
		if (!entrada.success) return fallo(400, entrada.error, valores);
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion(valores, async () => {
			await confirmarArqueo(locals.ambiente, actor, entrada.data);
			return { confirmacion: textos.economia.arqueoRegistrado };
		});
	},

	previsualizarRecuento: async ({ request, locals }) => {
		const formulario = await request.formData();
		const lineas = lineasRecuentoDesdeFormulario(
			formulario.getAll('tipoCapsulaId').map(String),
			formulario.getAll('contado').map(String),
			formulario.getAll('registradoPrevisto').map(String),
		);
		const entrada = esquemaLineasRecuento.safeParse(lineas);
		if (!entrada.success) return fallo(400, entrada.error, { lineas });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({ lineas }, () => ({
			previsionRecuento: previsualizarRecuento(locals.ambiente.db, actor, entrada.data),
		}));
	},

	confirmarRecuento: async ({ request, locals }) => {
		const formulario = await request.formData();
		const lineas = lineasRecuentoDesdeFormulario(
			formulario.getAll('tipoCapsulaId').map(String),
			formulario.getAll('contado').map(String),
			formulario.getAll('registradoPrevisto').map(String),
		);
		const entrada = esquemaRecuento.safeParse({ lineas, contrasenaActual: sinVacio(formulario.get('contrasenaActual')) });
		if (!entrada.success) return fallo(400, entrada.error, { lineas });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({ lineas }, async () => {
			await confirmarRecuento(locals.ambiente, actor, entrada.data);
			return { confirmacion: textos.economia.recuentoRegistrado };
		});
	},

	anularArqueo: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacionControl.safeParse({
			id: datos.id,
			motivo: datos.motivo,
			contrasenaActual: sinVacio(datos.contrasenaActual),
		});
		if (!entrada.success) return fallo(400, entrada.error, { id: datos.id, motivo: datos.motivo });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({ id: datos.id, motivo: datos.motivo }, async () => {
			await anularArqueo(locals.ambiente, actor, entrada.data);
			return { confirmacion: textos.economia.arqueoAnulado };
		});
	},

	anularRecuento: async ({ request, locals }) => {
		const datos = Object.fromEntries(await request.formData());
		const entrada = esquemaAnulacionControl.safeParse({
			id: datos.id,
			motivo: datos.motivo,
			contrasenaActual: sinVacio(datos.contrasenaActual),
		});
		if (!entrada.success) return fallo(400, entrada.error, { id: datos.id, motivo: datos.motivo });
		const actor = locals.actor;
		if (!actor) return falloDeNegocio('SIN_SESION', {});
		return ejecutarAccion({ id: datos.id, motivo: datos.motivo }, async () => {
			await anularLineaRecuento(locals.ambiente, actor, entrada.data);
			return { confirmacion: textos.economia.lineaAnulada };
		});
	},
};
