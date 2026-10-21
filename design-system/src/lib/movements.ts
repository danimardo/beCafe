// Modelo de movimientos para historiales y detalle (RF-111, RF-112, RF-062).
// REGLAS REFLEJADAS AQUÍ SOLO PARA LA INTERFAZ (qué botón o mensaje mostrar). El servidor decide siempre (RNF-007).
import type { MovementKind } from './components/capsulas/MovementRow.svelte';
import { formatMoney } from './utils';

export interface MovementDetail {
	id: string;
	kind: MovementKind;
	title: string;
	/** Fecha y hora ya formateadas, p. ej. «18 oct, 10:31». */
	at: string;
	/** Minutos desde que se hizo el registro (para el plazo de autoanulación, RN-032). */
	ageMinutes: number;
	authorId: string;
	authorName: string;
	/** Importe con signo en céntimos. Sin importe en recuentos sin faltante y arqueos que cuadran. */
	cents?: number;
	/** De dónde viene el movimiento: «Reparto del arqueo del 13 oct entre 6 personas». RF-112. */
	origin?: string;
	/** Texto corto para la fila de lista (si no se indica, se usa `at`). */
	subtitle?: string;
	guest?: boolean;
	/** Consumo guardado en el móvil, aún sin enviar (RF-015). */
	pending?: boolean;
	voided?: { by: string; at: string; reason: string };
	/** Arqueo: es el último vigente. Recuento: es el último vigente de ese tipo (RN-036). */
	isLast?: boolean;
	/** Reparto o regularización: nace de otro registro; no se anula por separado. */
	derivedFrom?: string;
}

export interface Viewer {
	id: string;
	role: 'miembro' | 'administrador';
}

export type VoidPolicy =
	| { action: 'void' }
	| { action: 'dequeue' }
	| { action: 'none'; message: string };

/**
 * ¿Qué puede hacer esta persona con este registro? RN-032, RN-033, RN-035, RN-036, RF-062, RF-063.
 * Los mensajes son los que verá la persona; el de «pídeselo a un administrador» es el de RF-062.
 */
export function voidPolicy(m: MovementDetail, viewer: Viewer, graceMinutes: number): VoidPolicy {
	if (m.voided) return { action: 'none', message: 'Este registro ya está anulado. Un registro anulado no se puede volver a anular ni reactivar.' };
	if (m.pending && m.authorId === viewer.id) return { action: 'dequeue' };
	if (m.derivedFrom) return { action: 'none', message: `Este movimiento nace de otro registro (${m.derivedFrom}). Para corregirlo hay que anular ese registro.` };
	const isAdmin = viewer.role === 'administrador';
	if (m.kind === 'arqueo' || m.kind === 'recuento') {
		if (!isAdmin) return { action: 'none', message: 'Los arqueos y recuentos solo los anula un administrador. Pídeselo a un administrador.' };
		if (!m.isLast)
			return {
				action: 'none',
				message:
					m.kind === 'arqueo'
						? 'Solo se puede anular el último arqueo. Hay otro más reciente.'
						: 'Solo se puede anular el último recuento de cada tipo de cápsula. Hay otro más reciente de este tipo.'
			};
		return { action: 'void' };
	}
	if (m.kind === 'baja') return { action: 'none', message: 'Las bajas no se anulan. Para volver a dar acceso, reactiva a la persona desde Usuarios.' };
	if (isAdmin) return { action: 'void' };
	if (m.authorId !== viewer.id) return { action: 'none', message: 'Solo la persona que hizo el registro puede anularlo, y solo durante el plazo. Pídeselo a un administrador.' };
	if (m.ageMinutes > graceMinutes)
		return { action: 'none', message: `Ya ha pasado el plazo de ${graceMinutes} minutos para anular tus propios registros. Pídeselo a un administrador.` };
	return { action: 'void' };
}

/** Texto que explica la consecuencia económica antes de anular (se muestra en VoidDialog). RN-012, RN-013, RN-016, RN-036. */
export function voidConsequence(m: MovementDetail): string {
	const amount = m.cents !== undefined ? formatMoney(Math.abs(m.cents)) : '';
	switch (m.kind) {
		case 'consumo':
			return `El cargo de ${amount} dejará de contar y el stock volverá a subir 1. No se recalcula ningún otro cargo (RN-013).`;
		case 'aportacion':
			return `La aportación de ${amount} dejará de contar: el saldo de la persona y el de la hucha bajarán ese importe.`;
		case 'compra':
			return 'Se reconstruirá el coste medio del tipo y se generará una regularización para quien consumió después de la compra (RN-012). Verás el resumen al confirmar.';
		case 'arqueo':
			return 'Se revertirá el ajuste de la hucha y el reparto entre los miembros.';
		case 'relleno':
			return 'El relleno dejará de contar en el ranking y en el título de aguador del mes. No cambia ningún saldo, porque no mueve dinero (RN-080).';
		case 'recuento':
			return 'Se revertirán el ajuste de stock y los cargos repartidos de ese tipo de cápsula.';
		default:
			return 'El registro dejará de contar en saldos, stock y coste medio. Se conserva en el historial.';
	}
}

export const kindLabels: Record<MovementKind, string> = {
	consumo: 'Consumo',
	aportacion: 'Aportación',
	compra: 'Compra',
	arqueo: 'Arqueo de la hucha',
	recuento: 'Recuento de stock',
	reparto: 'Reparto',
	regularizacion: 'Regularización',
	baja: 'Baja de usuario',
	relleno: 'Relleno de agua'
};

/** Agrupación para filtrar listas. */
export const kindGroups = {
	consumos: ['consumo'],
	aportes: ['aportacion'],
	compras: ['compra'],
	control: ['arqueo', 'recuento', 'reparto', 'regularizacion', 'baja'],
	ajustes: ['reparto', 'regularizacion'],
	rellenos: ['relleno']
} as const satisfies Record<string, readonly MovementKind[]>;
