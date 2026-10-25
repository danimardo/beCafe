import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { ejecutarAccion, fallo } from '../../(app)/fallo';
import { listarTipos } from '#lib/server/catalogo';
import { leerCafesDeVisita, leerTiposParaVisitante, registrarCafeVisitante } from '#lib/server/economia';
import { nuevoId } from '#lib/server/plataforma';
import { esquemaCafeVisitanteForm } from '#lib/shared/contratos/visitantes';

// Pantalla del visitante (plan F10 D3; RF-191, RF-194, CA-191, CA-194). Solo con una visita vigente; nunca con datos
// de miembros: ni saldos, ni precios, ni consumos de otras personas.
export const load: PageServerLoad = ({ locals, setHeaders }) => {
	const visita = locals.visita;
	if (!visita) redirect(303, resolve('/(auth)/login'));
	setHeaders({ 'cache-control': 'no-store' });
	const db = locals.ambiente.db;
	const nombres = new Map(listarTipos(db).map((tipo) => [tipo.id, tipo.nombre]));
	return {
		nombre: visita.nombre,
		expiraEn: visita.expiraEn,
		// Sin foto: las fotos de cápsula solo se sirven con sesión de miembro; la ilustración por color basta.
		tipos: leerTiposParaVisitante(db, visita).map((tipo) => ({ ...tipo, clienteId: nuevoId() })),
		cafes: leerCafesDeVisita(db, visita.id).map((cafe) => ({
			id: cafe.id,
			tipo: nombres.get(cafe.tipoCapsulaId) ?? '',
			horaGesto: cafe.horaGesto,
			estado: cafe.estado,
		})),
	};
};

export const actions: Actions = {
	registrar: async ({ request, locals }) => {
		const visita = locals.visita;
		if (!visita) redirect(303, resolve('/(auth)/login'));
		const entrada = esquemaCafeVisitanteForm.safeParse(Object.fromEntries(await request.formData()));
		if (!entrada.success) return fallo(400, entrada.error, {});
		const resultado = await ejecutarAccion({}, () =>
			registrarCafeVisitante(locals.ambiente, visita, {
				clienteId: entrada.data.clienteId,
				tipoCapsulaId: entrada.data.tipoCapsulaId,
				horaGesto: entrada.data.horaGesto ?? locals.ambiente.reloj.ahora(),
			}),
		);
		if (!('id' in resultado)) return resultado;
		return { cafe: { id: resultado.id, estado: 'pendiente' as const } };
	},
};
