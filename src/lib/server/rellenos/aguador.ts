import { and, eq, gte, lt } from 'drizzle-orm';
import { enTransaccion, marcarEjecucion, registrar, type Db, type Reloj } from '#lib/server/plataforma';
import { listarUsuarios } from '#lib/server/usuarios';
import { limitesDeMes } from '#lib/shared/fechas/meses';
import type { Mes } from '#lib/shared/fechas/tipos';
import { aguadorMes, rellenoAgua } from './esquema';
import { elegirAguadores } from './dominio/aguador';

// Aguador del mes (plan F8 D5, RF-176, CA-176). Una tarea lo fija el día 1 y no se recalcula (Clarifications 1).

export const TAREA_AGUADOR = 'aguador_mes';

/**
 * Fija el aguador del mes `mes` (el que termina). En una transacción: si la tarea ya corrió ese mes, no hace nada.
 * Cuenta los rellenos vigentes del mes, elige entre las personas activas y guarda una fila por persona elegida.
 */
export function determinarAguador({ db, reloj, mes }: { db: Db; reloj: Reloj; mes: Mes }): number {
	const instante = reloj.ahora();
	return enTransaccion(db, (tx) => {
		if (!marcarEjecucion(tx, TAREA_AGUADOR, mes, instante)) return 0;
		const { desde, hasta } = limitesDeMes(mes);
		const vigentes = tx
			.select({ usuarioId: rellenoAgua.usuarioId })
			.from(rellenoAgua)
			.where(and(eq(rellenoAgua.estado, 'vigente'), gte(rellenoAgua.registradoEn, desde), lt(rellenoAgua.registradoEn, hasta)))
			.all();
		const porPersona = new Map<string, number>();
		for (const fila of vigentes) porPersona.set(fila.usuarioId, (porPersona.get(fila.usuarioId) ?? 0) + 1);
		const personas = listarUsuarios(tx);
		const activos = new Set(personas.filter((persona) => persona.estado === 'activo').map((persona) => persona.id));
		const conteos = [...porPersona].map(([usuarioId, rellenos]) => ({ usuarioId, rellenos }));
		const elegidos = elegirAguadores(conteos, activos);
		for (const elegido of elegidos) {
			tx.insert(aguadorMes).values({ mes, usuarioId: elegido.usuarioId, rellenos: elegido.rellenos, determinadoEn: instante }).run();
		}
		if (elegidos.length > 0) registrar('aguador.determinado', { mes, personas: elegidos.length });
		return elegidos.length;
	});
}
