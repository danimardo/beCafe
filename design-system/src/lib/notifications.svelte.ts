// Estado del panel de notificaciones de la app (RF-107). PROPUESTO en lo que la especificación no define:
// - «Leída» = la persona ha abierto el panel después de que llegara el aviso (decisión del cliente).
// - El panel muestra los avisos de los últimos 30 días (decisión del cliente).
// En la app real: los avisos vienen del servidor (tabla de notificaciones enviadas, RF-103) filtrados por destinatario
// (RF-101, CA-101: un miembro nunca ve «stock negativo») y `lastSeenAt` se guarda por usuario.

export type NotificationKind = 'stock-bajo' | 'deuda' | 'resumen-mensual' | 'stock-negativo' | 'hucha-negativa' | 'copia-fallida';

export interface AppNotification {
	id: string;
	kind: NotificationKind;
	title: string;
	detail?: string;
	/** Texto de fecha ya formateado («Hoy, 9:12», «Ayer», «12 oct»). */
	when: string;
	/** Instante de llegada, en ms (para decidir si es nueva). */
	createdAt: number;
	/** Pantalla a la que lleva el aviso. */
	href?: string;
}

class NotificationState {
	items = $state<AppNotification[]>([]);
	/** Último instante en que la persona abrió el panel. */
	lastSeenAt = $state(0);
	/** Referencia para resaltar lo nuevo mientras el panel está abierto. */
	viewedBaseline = $state(0);
	open = $state(false);

	/** Número de avisos recibidos desde la última vez que se abrió el panel. */
	get unreadCount() {
		return this.items.filter((n) => n.createdAt > this.lastSeenAt).length;
	}
	/** ¿Era nuevo al abrir el panel? Se usa para resaltarlo dentro del panel. */
	isNew(n: AppNotification) {
		return n.createdAt > this.viewedBaseline;
	}
	/** Abre el panel y marca todo como leído (los nuevos siguen resaltados hasta cerrarlo). */
	openPanel() {
		this.viewedBaseline = this.lastSeenAt;
		this.lastSeenAt = Date.now();
		this.open = true;
	}
	load(items: AppNotification[]) {
		this.items = [...items].sort((a, b) => b.createdAt - a.createdAt);
	}
}

export const notifications = new NotificationState();
