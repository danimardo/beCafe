import { and, eq, lt, max } from 'drizzle-orm';
import { mensajeDia } from './esquema';
import { siguienteFrase } from './dominio/ciclo-frases';
import { enTransaccion, registrar, type Ambiente, type Ejecutor } from '#lib/server/plataforma';
import { fechaDeMadrid } from '#lib/shared/fechas/meses';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { IDS_MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';

// Mensaje del día de Capsulito por persona (F15, RN-091, RF-266, RF-268). Una fila por persona y día de Madrid: la clave
// primaria `(usuario_id, dia)` hace que dos dispositivos o dos peticiones simultáneas reciban el mismo mensaje (EV-114).

function leerDelDia(db: Ejecutor, usuarioId: string, dia: string): string | null {
	const fila = db
		.select({ mensajeId: mensajeDia.mensajeId })
		.from(mensajeDia)
		.where(and(eq(mensajeDia.usuarioId, usuarioId), eq(mensajeDia.dia, dia)))
		.get();
	return fila?.mensajeId ?? null;
}

/**
 * Mensaje del día de la persona, o `null` si hoy hay un aviso y todavía no tenía uno asignado (no se gasta ninguno).
 * Si ya tenía mensaje hoy, lo devuelve aunque haya aviso.
 */
export function asignarMensajeDia(
	ambiente: Ambiente,
	usuarioId: string,
	{ hayAviso }: { hayAviso: boolean },
): { mensajeId: string } | null {
	const instante = esquemaInstanteUtc.parse(ambiente.reloj.ahora());
	const dia = fechaDeMadrid(instante);
	const existente = leerDelDia(ambiente.db, usuarioId, dia);
	if (existente) return { mensajeId: existente };
	if (hayAviso) return null;
	return enTransaccion(ambiente.db, (tx) => {
		// Otra petición pudo asignarlo entre la lectura y la transacción: gana la que ya está.
		const yaAsignado = leerDelDia(tx, usuarioId, dia);
		if (yaAsignado) return { mensajeId: yaAsignado };
		const delUsuario = eq(mensajeDia.usuarioId, usuarioId);
		const vueltaActual =
			tx
				.select({ vuelta: max(mensajeDia.vuelta) })
				.from(mensajeDia)
				.where(delUsuario)
				.get()?.vuelta ?? 1;
		const vistos = new Set(
			tx
				.select({ mensajeId: mensajeDia.mensajeId })
				.from(mensajeDia)
				.where(and(delUsuario, eq(mensajeDia.vuelta, vueltaActual)))
				.all()
				.map((fila) => fila.mensajeId),
		);
		const { fraseId: mensajeId, ciclo: vuelta } = siguienteFrase(IDS_MENSAJES_DIA, vistos, vueltaActual, ambiente.azar);
		tx.insert(mensajeDia).values({ usuarioId, dia, mensajeId, vuelta, asignadoEn: instante }).onConflictDoNothing().run();
		if (vuelta !== vueltaActual) {
			tx.delete(mensajeDia)
				.where(and(delUsuario, lt(mensajeDia.vuelta, vuelta - 1)))
				.run();
			registrar('mensaje_dia.ciclo_reiniciado', { usuarioId, vuelta });
		}
		registrar('mensaje_dia.asignado', { usuarioId, mensajeId, vuelta });
		return { mensajeId: leerDelDia(tx, usuarioId, dia) ?? mensajeId };
	});
}
