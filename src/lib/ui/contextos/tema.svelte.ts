import { browser } from '$app/env';
import { getContext, setContext } from 'svelte';

export type PreferenciaTema = 'auto' | 'claro' | 'oscuro';
export type TemaResuelto = 'claro' | 'oscuro';

const CLAVE_ALMACEN = 'becafe-tema';
const CLAVE_CONTEXTO = Symbol('tema');

/**
 * Preferencia de tema del dispositivo (RF-180). «auto» sigue a `prefers-color-scheme` durante la sesión;
 * «claro» y «oscuro» lo fuerzan. Se guarda solo en `localStorage` del dispositivo (DEC-095).
 * El script de app.html aplica el tema antes de pintar; esta clase lo mantiene después.
 */
export class EstadoTema {
	preferencia = $state<PreferenciaTema>('auto');
	resuelto = $state<TemaResuelto>('claro');
	#mql: MediaQueryList | null = null;
	#alCambiarSistema = () => this.#aplicar();

	/** Lee la preferencia guardada y sigue los cambios del sistema. Llamar una vez en el layout raíz. */
	iniciar() {
		if (!browser) return;
		let guardada: string | null;
		try {
			guardada = localStorage.getItem(CLAVE_ALMACEN);
		} catch {
			guardada = null;
		}
		this.preferencia = guardada === 'claro' || guardada === 'oscuro' ? guardada : 'auto';
		this.#mql = matchMedia('(prefers-color-scheme: dark)');
		this.#mql.addEventListener('change', this.#alCambiarSistema);
		this.#aplicar();
	}

	/** Deja de seguir los cambios del sistema. */
	destruir() {
		this.#mql?.removeEventListener('change', this.#alCambiarSistema);
	}

	cambiar(preferencia: PreferenciaTema) {
		this.preferencia = preferencia;
		try {
			localStorage.setItem(CLAVE_ALMACEN, preferencia);
		} catch {
			// Sin almacenamiento el tema vale para esta visita: no es un error que bloquee nada.
		}
		this.#aplicar();
	}

	#aplicar() {
		const oscuro = this.preferencia === 'oscuro' || (this.preferencia === 'auto' && !!this.#mql?.matches);
		this.resuelto = oscuro ? 'oscuro' : 'claro';
		if (browser) document.documentElement.setAttribute('data-theme', this.resuelto);
	}
}

/** Crea el estado del tema y lo comparte con los componentes descendientes. Llamar en el layout raíz. */
export function crearContextoTema(): EstadoTema {
	const estado = new EstadoTema();
	setContext(CLAVE_CONTEXTO, estado);
	return estado;
}

/** Lee el estado del tema creado por el layout raíz. */
export function usarTema(): EstadoTema {
	return getContext<EstadoTema>(CLAVE_CONTEXTO);
}
