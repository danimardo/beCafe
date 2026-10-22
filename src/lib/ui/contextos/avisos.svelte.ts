import { getContext, setContext } from 'svelte';

export interface AvisoDeshacer {
	/** Identificador único; cambia en cada aviso para reiniciar el temporizador. */
	id: string;
	title: string;
	detail?: string;
	/** Color de la cápsula (hex) para el icono. */
	color?: string;
	photoUrl?: string | null;
	/** Si se indica, el aviso lleva el botón «Deshacer». Sin él es un aviso informativo. */
	onundo?: () => void;
	/** Icono: «capsula» (por defecto, miniatura de la cápsula), «ok» (hecho) o «warning» (aviso). */
	kind?: 'capsula' | 'ok' | 'warning';
	/** Línea de advertencia bajo el detalle, p. ej. el descuadre de stock (RF-017). */
	warning?: string;
	/** Milisegundos hasta desaparecer. RF-013: 5000. */
	duration?: number;
}

const CLAVE_CONTEXTO = Symbol('avisos');

export class EstadoAvisos {
	actual = $state<AvisoDeshacer | null>(null);

	/** Muestra el aviso «Deshacer». Sustituye al anterior si lo había. */
	mostrarDeshacer(datos: Omit<AvisoDeshacer, 'id'>) {
		this.actual = { ...datos, id: crypto.randomUUID() };
	}

	/** Aviso informativo sin «Deshacer» (p. ej. «Rol cambiado»). */
	informar(datos: Omit<AvisoDeshacer, 'id' | 'onundo'>) {
		this.actual = { kind: 'ok', ...datos, id: crypto.randomUUID() };
	}

	cerrar() {
		this.actual = null;
	}
}

/** Crea la cola de avisos y la comparte con los descendientes. Llamar en el layout raíz. */
export function crearContextoAvisos(): EstadoAvisos {
	const estado = new EstadoAvisos();
	setContext(CLAVE_CONTEXTO, estado);
	return estado;
}

/** Lee la cola de avisos creada por el layout raíz. */
export function usarAvisos(): EstadoAvisos {
	return getContext<EstadoAvisos>(CLAVE_CONTEXTO);
}
