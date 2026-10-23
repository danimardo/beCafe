import { enTransaccion, marcarEjecucion, type Db, type Reloj } from '#lib/server/plataforma';
import { leerConfiguracion } from '#lib/server/configuracion';
import { listarUsuarios } from '#lib/server/usuarios';
import { registrarAviso, ultimoAviso } from '#lib/server/notificaciones';
import { tocaRecordatorio } from '#lib/shared/deuda/tramos';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { saldoPersona } from './libro';

// Recordatorio diario de deuda (plan F6 D7, RN-074, Clarifications 7). Un solo periodo por día de Madrid: la tarea
// se marca a sí misma en la transacción, así que una segunda ejecución del mismo día no envía nada.

export const TAREA_RECORDATORIO_DEUDA = 'recordatorio_deuda';

/** Envía los recordatorios que toquen hoy. Devuelve cuántos avisos registró. */
export function recordarDeudas({ db, reloj }: { db: Db; reloj: Reloj }): number {
	const instante = reloj.ahora();
	const hoy = fechaDeMadrid(instante);
	return enTransaccion(db, (tx) => {
		if (!marcarEjecucion(tx, TAREA_RECORDATORIO_DEUDA, hoy, instante)) return 0;
		const { limiteDeudaCentimos: limite } = leerConfiguracion(tx);
		let registrados = 0;
		for (const persona of listarUsuarios(tx)) {
			if (persona.estado !== 'activo') continue;
			const saldo = saldoPersona(tx, persona.id);
			const ultimo = ultimoAviso(tx, persona.id, 'deuda');
			const ultimoEnvio = ultimo === null ? null : fechaDeMadrid(esquemaInstanteUtc.parse(ultimo));
			if (!tocaRecordatorio({ saldo, limite, ultimoEnvio, hoy })) continue;
			registrarAviso(tx, { tipo: 'deuda', destinatario: persona.id, datos: { saldo, limite }, instante });
			registrados += 1;
		}
		return registrados;
	});
}
