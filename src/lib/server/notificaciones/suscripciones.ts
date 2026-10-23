import { and, eq } from 'drizzle-orm';
import { enTransaccion, nuevoId, registrar, type Ambiente, type Tx } from '#lib/server/plataforma';
import type { EntradaSuscripcion } from '#lib/shared/contratos/push';
import { suscripcionPush } from './esquema';

// Suscripciones push de una persona (plan F6 D12, contracts/api-push.md). El endpoint no se registra nunca (constitución XVI).

/**
 * Da de alta o actualiza un dispositivo. Si el endpoint ya existía con otra persona (dispositivo compartido), pasa a la
 * persona que se suscribe ahora.
 */
export function registrarSuscripcion(ambiente: Ambiente, usuarioId: string, datos: EntradaSuscripcion): void {
	const instante = ambiente.reloj.ahora();
	enTransaccion(ambiente.db, (tx) => {
		const existente = tx.select({ id: suscripcionPush.id }).from(suscripcionPush).where(eq(suscripcionPush.endpoint, datos.endpoint)).get();
		if (existente) {
			tx.update(suscripcionPush)
				.set({ usuarioId, clavePdh: datos.claves.p256dh, claveAuth: datos.claves.auth, actualizadaEn: instante })
				.where(eq(suscripcionPush.id, existente.id))
				.run();
		} else {
			tx.insert(suscripcionPush)
				.values({
					id: nuevoId(),
					usuarioId,
					endpoint: datos.endpoint,
					clavePdh: datos.claves.p256dh,
					claveAuth: datos.claves.auth,
					creadaEn: instante,
					actualizadaEn: instante,
				})
				.run();
		}
		registrar('push.suscripcion_registrada', { usuarioId });
	});
}

/** Borra la suscripción solo si es de la persona indicada. No revela si el endpoint existía (contrato: 204 siempre). */
export function borrarSuscripcion(ambiente: Ambiente, usuarioId: string, endpoint: string): void {
	enTransaccion(ambiente.db, (tx) => {
		tx.delete(suscripcionPush)
			.where(and(eq(suscripcionPush.endpoint, endpoint), eq(suscripcionPush.usuarioId, usuarioId)))
			.run();
	});
}

/** Al dar de baja a una persona, sus dispositivos dejan de recibir avisos (RN-051). Se llama dentro de la transacción de la baja. */
export function retirarPersona(tx: Tx, usuarioId: string): void {
	tx.delete(suscripcionPush).where(eq(suscripcionPush.usuarioId, usuarioId)).run();
}
