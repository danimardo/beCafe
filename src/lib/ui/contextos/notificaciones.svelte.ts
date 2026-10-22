import { getContext, setContext } from 'svelte';
import type { ResolvedPathname } from '$app/types';

// Estado del panel de avisos (RF-107). Lo usan la campana y el panel, que F1 no pinta (research R3).
// PROPUESTO en lo que la especificación no define:
// - «Leída» = la persona ha abierto el panel después de que llegara el aviso (decisión del cliente).
// - El panel muestra los avisos de los últimos 30 días (decisión del cliente).

export type TipoAviso = 'stock-bajo' | 'deuda' | 'resumen-mensual' | 'stock-negativo' | 'hucha-negativa' | 'copia-fallida';

export interface AvisoRecibido {
	id: string;
	tipo: TipoAviso;
	title: string;
	detail?: string;
	/** Texto de fecha ya formateado («Hoy, 9:12», «Ayer», «12 oct»). */
	when: string;
	/** Instante de llegada, en ms (para decidir si es nueva). */
	createdAt: number;
	/** Pantalla a la que lleva el aviso (ya resuelta con `resolve()`). */
	href?: ResolvedPathname;
}

const CLAVE_CONTEXTO = Symbol('notificaciones');

export class EstadoNotificaciones {
	avisos = $state<AvisoRecibido[]>([]);
	/** Último instante en que la persona abrió el panel. */
	ultimaVezVisto = $state(0);
	/** Referencia para resaltar lo nuevo mientras el panel está abierto. */
	referenciaVisto = $state(0);
	abierto = $state(false);

	/** Número de avisos recibidos desde la última vez que se abrió el panel. */
	get sinLeer() {
		return this.avisos.filter((n) => n.createdAt > this.ultimaVezVisto).length;
	}

	/** ¿Era nuevo al abrir el panel? Se usa para resaltarlo dentro del panel. */
	esNuevo(n: AvisoRecibido) {
		return n.createdAt > this.referenciaVisto;
	}

	/** Abre el panel y marca todo como leído (los nuevos siguen resaltados hasta cerrarlo). */
	abrirPanel() {
		this.referenciaVisto = this.ultimaVezVisto;
		this.ultimaVezVisto = Date.now();
		this.abierto = true;
	}

	cargar(avisos: AvisoRecibido[]) {
		this.avisos = [...avisos].sort((a, b) => b.createdAt - a.createdAt);
	}
}

/** Crea el estado de avisos y lo comparte con los descendientes. Llamar en el layout raíz. */
export function crearContextoNotificaciones(): EstadoNotificaciones {
	const estado = new EstadoNotificaciones();
	setContext(CLAVE_CONTEXTO, estado);
	return estado;
}

/** Lee el estado de avisos creado por el layout raíz. */
export function usarNotificaciones(): EstadoNotificaciones {
	return getContext<EstadoNotificaciones>(CLAVE_CONTEXTO);
}
