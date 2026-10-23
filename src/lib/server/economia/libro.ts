import { and, eq, sql, type SQL } from 'drizzle-orm';
import { ErrorDeNegocio, nuevoId, type Ejecutor, type Tx } from '#lib/server/plataforma';
import { registrarAviso } from '#lib/server/notificaciones';
import { leerConfiguracion } from '#lib/server/configuracion';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { movimiento, type ORIGENES_MOVIMIENTO, type TIPOS_MOVIMIENTO } from './esquema';

// Libro de movimientos (constitución IV). Interno de `economia`: no se exporta desde `index.ts`.
// Un movimiento no se modifica ni se borra; solo pasa de vigente a no vigente cuando se anula su origen (INV-05).
// Los saldos se derivan del libro (RN-010, RN-011): nunca se guardan.

export type NuevoMovimiento = {
	cuenta: 'persona' | 'hucha';
	usuarioId: string | null;
	tipo: (typeof TIPOS_MOVIMIENTO)[number];
	importe: number;
	origenTipo: (typeof ORIGENES_MOVIMIENTO)[number];
	origenId: string;
	creadoEn: string;
};

/** Inserta movimientos vigentes en la transacción del caso de uso. Un importe 0 no es un movimiento. */
export function anotarMovimientos(tx: Tx, movimientos: readonly NuevoMovimiento[]): void {
	const antes = saldosAntes(
		tx,
		movimientos.flatMap((nuevo) => (nuevo.cuenta === 'persona' && nuevo.usuarioId ? [nuevo.usuarioId] : [])),
	);
	for (const nuevo of movimientos) {
		if (nuevo.importe === 0) throw new ErrorDeNegocio('VALIDACION');
		tx.insert(movimiento)
			.values({ id: nuevoId(), ...nuevo, vigente: true })
			.run();
	}
	const ultimo = movimientos.at(-1);
	if (ultimo) avisarCruceDeuda(tx, antes, ultimo.creadoEn);
}

/** Pasa a no vigentes los movimientos de un origen. Idempotente: los ya anulados no cambian (INV-05). */
export function anularMovimientosDe(tx: Tx, origenTipo: NuevoMovimiento['origenTipo'], origenId: string, instante: string): void {
	const afectados = tx
		.select({ usuarioId: movimiento.usuarioId })
		.from(movimiento)
		.where(and(eq(movimiento.origenTipo, origenTipo), eq(movimiento.origenId, origenId), eq(movimiento.vigente, true)))
		.all();
	const antes = saldosAntes(
		tx,
		afectados.flatMap((fila) => (fila.usuarioId ? [fila.usuarioId] : [])),
	);
	tx.update(movimiento)
		.set({ vigente: false })
		.where(and(eq(movimiento.origenTipo, origenTipo), eq(movimiento.origenId, origenId), eq(movimiento.vigente, true)))
		.run();
	avisarCruceDeuda(tx, antes, instante);
}

/** Saldo de cada persona antes de un cambio, para comparar después (RN-074). */
function saldosAntes(tx: Tx, usuarioIds: readonly string[]): Map<string, number> {
	return new Map([...new Set(usuarioIds)].map((usuarioId) => [usuarioId, saldoPersona(tx, usuarioId)]));
}

/** Avisa de deuda a quien cruza el límite hacia abajo (RF-101, RN-074). Un cambio que no cruza no genera aviso. */
function avisarCruceDeuda(tx: Tx, antes: Map<string, number>, instante: string): void {
	if (antes.size === 0) return;
	const { limiteDeudaCentimos: limite } = leerConfiguracion(tx);
	for (const [usuarioId, saldoAntes] of antes) {
		const saldo = saldoPersona(tx, usuarioId);
		if (saldoAntes >= limite && saldo < limite) {
			registrarAviso(tx, {
				tipo: 'deuda',
				destinatario: usuarioId,
				datos: { saldo, limite },
				instante: esquemaInstanteUtc.parse(instante),
			});
		}
	}
}

/** Saldo de una persona: suma de sus movimientos vigentes (RN-010). 0 si no tiene ninguno. */
export function saldoPersona(db: Ejecutor, usuarioId: string): number {
	return sumaVigente(db, and(eq(movimiento.cuenta, 'persona'), eq(movimiento.usuarioId, usuarioId)));
}

/** Saldo teórico de la hucha: suma de sus movimientos vigentes (RN-011). 0 si no tiene ninguno. */
export function saldoHucha(db: Ejecutor): number {
	return sumaVigente(db, eq(movimiento.cuenta, 'hucha'));
}

function sumaVigente(db: Ejecutor, filtro: SQL | undefined): number {
	const fila = db
		.select({ total: sql<number>`coalesce(sum(${movimiento.importe}), 0)` })
		.from(movimiento)
		.where(and(filtro, eq(movimiento.vigente, true)))
		.get();
	return fila?.total ?? 0;
}
