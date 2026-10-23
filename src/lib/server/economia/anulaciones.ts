import { and, eq } from 'drizzle-orm';
import type { Actor } from '#lib/server/auth';
import { enTransaccion, ErrorDeNegocio, RecursoNoEncontrado, registrar, type Ambiente } from '#lib/server/plataforma';
import { buscarUsuarioPorId } from '#lib/server/usuarios';
import { leerConfiguracion } from '#lib/server/configuracion';
import { aportacion } from './esquema';
import { anularMovimientosDe } from './libro';

// Anulaciones (RF-060 a RF-062, RN-030 a RN-033, INV-05). Nunca se borra ni se modifica un importe: se marca el
// registro como anulado y se quitan sus movimientos del libro (constitución IV).

const MILISEGUNDOS_POR_MINUTO = 60_000;

/**
 * Permiso para anular (RN-031, RN-032). Un administrador puede siempre. El autor puede dentro del plazo, y solo
 * sus propios registros.
 */
export function comprobarPermisoAnulacion(actor: Actor, autorId: string, registradaEn: string, plazoMin: number, ahora: string): void {
	if (actor.rol === 'administrador') return;
	if (actor.usuarioId !== autorId) throw new ErrorDeNegocio('SIN_PERMISO');
	const limite = Date.parse(registradaEn) + plazoMin * MILISEGUNDOS_POR_MINUTO;
	if (limite < Date.parse(ahora)) throw new ErrorDeNegocio('FUERA_DE_PLAZO');
}

/** Anula una aportación con la transacción única de la anulación (INV-05, EV-011). */
export function anularAportacion(ambiente: Ambiente, actor: Actor, id: string, motivo: string): void {
	const ahora = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const fila = tx.select().from(aportacion).where(eq(aportacion.id, id)).get();
		if (!fila) throw new RecursoNoEncontrado();
		const persona = buscarUsuarioPorId(tx, fila.usuarioId);
		if (persona?.estado === 'baja') throw new ErrorDeNegocio('ESTADO_INCORRECTO');
		comprobarPermisoAnulacion(actor, fila.usuarioId, fila.registradaEn, leerConfiguracion(tx).plazoAutoanulacionMin, ahora);
		const actualizada = tx
			.update(aportacion)
			.set(datosAnulacion(actor.usuarioId, motivo, ahora))
			.where(and(eq(aportacion.id, id), eq(aportacion.estado, 'vigente')))
			.run();
		exigirAnulacionAplicada(actualizada.changes);
		anularMovimientosDe(tx, 'aportacion', id, ahora);
	});
	registrar('anulacion.registrada', { tipo: 'aportacion', id });
}

/** Campos de anulación de un registro (RN-030, RN-033). Cada caso de uso los escribe con su propio `UPDATE`. */
export function datosAnulacion(anuladoPor: string, motivo: string, ahora: string) {
	return { estado: 'anulado' as const, anuladoPor, anuladoEn: ahora, motivoAnulacion: motivo };
}

/** Si el `UPDATE` no cambió ninguna fila, otra petición ya anuló el registro: `YA_ANULADO` (INV-05, EV-011). */
export function exigirAnulacionAplicada(cambios: number): void {
	if (cambios === 0) throw new ErrorDeNegocio('YA_ANULADO');
}
