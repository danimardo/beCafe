import { and, desc, eq, gte, isNull } from 'drizzle-orm';
import { enTransaccion, type Ambiente, type Ejecutor } from '#lib/server/plataforma';
import { esquemaInstanteUtc, instanteDesdeFecha, type InstanteUtc } from '#lib/shared/fechas/tipos';
import { construirMensaje, type MensajeAviso } from './catalogo';
import { notificacion, type TipoNotificacion } from './esquema';

// Consultas del panel de avisos (plan F6 D13, RF-107). Un aviso se ve 30 días; los nuevos son los que no tienen `vista_en`.
// Marcar como vistos no los oculta (Clarifications 11). Los avisos se escriben con `registrarAviso`.

const VENTANA_MS = 30 * 24 * 60 * 60 * 1000;

/** Persona cuyos avisos se leen. Solo el identificador: `notificaciones` no depende de `auth` (ARCHITECTURE.md §4). */
export type PersonaPanel = { usuarioId: string };

export type AvisoPanel = MensajeAviso & {
	id: string;
	tipo: TipoNotificacion;
	creadaEn: InstanteUtc;
	vista: boolean;
};

function inicioDeVentana(ahora: InstanteUtc): InstanteUtc {
	return instanteDesdeFecha(new Date(Date.parse(ahora) - VENTANA_MS));
}

/** Instante del último aviso de un tipo para una persona, o `null` si nunca recibió uno. */
export function ultimoAviso(db: Ejecutor, usuarioId: string, tipo: TipoNotificacion): string | null {
	const fila = db
		.select({ creadaEn: notificacion.creadaEn })
		.from(notificacion)
		.where(and(eq(notificacion.usuarioId, usuarioId), eq(notificacion.tipo, tipo)))
		.orderBy(desc(notificacion.creadaEn))
		.limit(1)
		.get();
	return fila?.creadaEn ?? null;
}

/** Avisos de los últimos 30 días, del más reciente al más antiguo. */
export function leerPanel(db: Ejecutor, persona: PersonaPanel, ahora: InstanteUtc): { avisos: AvisoPanel[] } {
	const filas = db
		.select({
			id: notificacion.id,
			tipo: notificacion.tipo,
			datos: notificacion.datos,
			creadaEn: notificacion.creadaEn,
			vistaEn: notificacion.vistaEn,
		})
		.from(notificacion)
		.where(and(eq(notificacion.usuarioId, persona.usuarioId), gte(notificacion.creadaEn, inicioDeVentana(ahora))))
		.orderBy(desc(notificacion.creadaEn))
		.all();
	return {
		avisos: filas.map((fila) => {
			const datos: unknown = JSON.parse(fila.datos);
			return {
				...construirMensaje(fila.tipo, datos),
				id: fila.id,
				tipo: fila.tipo,
				creadaEn: esquemaInstanteUtc.parse(fila.creadaEn),
				vista: fila.vistaEn !== null,
			};
		}),
	};
}

/** Número de avisos de los últimos 30 días que la persona no ha abierto. */
export function contarNuevos(db: Ejecutor, persona: PersonaPanel, ahora: InstanteUtc): number {
	return db
		.select({ id: notificacion.id })
		.from(notificacion)
		.where(
			and(eq(notificacion.usuarioId, persona.usuarioId), isNull(notificacion.vistaEn), gte(notificacion.creadaEn, inicioDeVentana(ahora))),
		)
		.all().length;
}

/** Marca como vistos los avisos sin vista de la persona. Devuelve cuántos cambió. */
export function marcarVistos(ambiente: Ambiente, persona: PersonaPanel): number {
	const ahora = ambiente.reloj.ahora();
	return enTransaccion(
		ambiente.db,
		(tx) =>
			tx
				.update(notificacion)
				.set({ vistaEn: ahora })
				.where(and(eq(notificacion.usuarioId, persona.usuarioId), isNull(notificacion.vistaEn)))
				.run().changes,
	);
}
