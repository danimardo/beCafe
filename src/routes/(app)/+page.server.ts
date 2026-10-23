import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { leerAvisosStock, leerPersonasBajoLimite, leerSaldoHucha, leerSaldoPropio } from '#lib/server/economia';
import { esquemaAvisoInicio } from '#lib/shared/contratos/privacidad';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.actor) redirect(303, resolve('/(auth)/login'));
	const persona = buscarUsuarioPorId(locals.ambiente.db, locals.actor.usuarioId);
	// Un parámetro desconocido o con otro valor no muestra aviso; no es un error de la página.
	const aviso = esquemaAvisoInicio.safeParse(Object.fromEntries(url.searchParams));
	const avisos = leerAvisosStock(locals.ambiente.db, locals.actor).map((tipo) => ({
		id: tipo.id,
		nombre: tipo.nombre,
		sinStock: tipo.stock <= 0,
		dias: tipo.estimacion.tipo === 'dias' ? tipo.estimacion.dias : null,
	}));
	const hucha = leerSaldoHucha(locals.ambiente.db);
	return {
		nombre: persona?.nombre ?? '',
		saldoPropio: leerSaldoPropio(locals.ambiente.db, locals.actor),
		hucha: hucha.saldo,
		deudores: leerPersonasBajoLimite(locals.ambiente.db, locals.actor).map((persona) => ({ nombre: persona.nombre, saldo: persona.saldo })),
		privacidadAceptada: aviso.success && aviso.data.aviso === 'privacidad-aceptada',
		avisos,
	};
};
