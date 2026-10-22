import { browser } from '$app/env';
import { getContext, setContext } from 'svelte';
import { registrarDatoInvalido } from '#lib/client/registro';
import {
	CLAVE_TEMA,
	CLAVE_TRANSPARENCIA,
	interpretarTema,
	interpretarTransparencia,
	type PreferenciaTema,
	type PreferenciaTransparencia,
} from '#lib/shared/contratos/apariencia';

export type { PreferenciaTema, PreferenciaTransparencia };
export type TemaResuelto = 'claro' | 'oscuro';

const CLAVE_CONTEXTO = Symbol('tema');

/**
 * Apariencia del dispositivo (RF-180, RF-181; DEC-095). «auto» sigue a `prefers-color-scheme` durante la sesión.
 * «Reducir transparencia» añade `data-transparencia="reducida"`; la reducción del sistema se aplica siempre (app.css).
 * Se guarda solo en `localStorage` del dispositivo, con `try/catch`: sin almacenamiento, la preferencia vale para esta visita.
 * El script de app.html aplica ambos atributos antes de pintar; esta clase los mantiene después.
 */
export class EstadoTema {
	preferencia = $state<PreferenciaTema>('auto');
	transparencia = $state<PreferenciaTransparencia>('normal');
	resuelto = $state<TemaResuelto>('claro');
	#mql: MediaQueryList | null = null;
	#alCambiarSistema = () => this.#aplicarTema();

	/** Lee las preferencias guardadas y sigue los cambios del sistema. Llamar una vez en el layout raíz. */
	iniciar() {
		if (!browser) return;
		this.preferencia = interpretarTema(this.#leer(CLAVE_TEMA));
		this.transparencia = interpretarTransparencia(this.#leer(CLAVE_TRANSPARENCIA));
		this.#mql = matchMedia('(prefers-color-scheme: dark)');
		this.#mql.addEventListener('change', this.#alCambiarSistema);
		this.#aplicarTema();
		this.#aplicarTransparencia();
	}

	/** Deja de seguir los cambios del sistema. */
	destruir() {
		this.#mql?.removeEventListener('change', this.#alCambiarSistema);
	}

	cambiar(preferencia: PreferenciaTema) {
		this.preferencia = preferencia;
		this.#guardar(CLAVE_TEMA, preferencia);
		this.#aplicarTema();
	}

	cambiarTransparencia(transparencia: PreferenciaTransparencia) {
		this.transparencia = transparencia;
		this.#guardar(CLAVE_TRANSPARENCIA, transparencia);
		this.#aplicarTransparencia();
	}

	#leer(clave: string): unknown {
		try {
			const valor = localStorage.getItem(clave);
			if (valor !== null && !this.#esValido(clave, valor)) {
				// Se registra el campo, nunca el valor (constitución XVI).
				registrarDatoInvalido('apariencia', clave);
			}
			return valor;
		} catch {
			return null;
		}
	}

	#guardar(clave: string, valor: string) {
		try {
			localStorage.setItem(clave, valor);
		} catch {
			// Sin almacenamiento la preferencia vale para esta visita: no bloquea nada.
		}
	}

	#esValido(clave: string, valor: string): boolean {
		return clave === CLAVE_TEMA ? interpretarTema(valor) === valor : interpretarTransparencia(valor) === valor;
	}

	#aplicarTema() {
		const oscuro = this.preferencia === 'oscuro' || (this.preferencia === 'auto' && !!this.#mql?.matches);
		this.resuelto = oscuro ? 'oscuro' : 'claro';
		if (browser) document.documentElement.setAttribute('data-theme', this.resuelto);
	}

	#aplicarTransparencia() {
		if (browser) document.documentElement.setAttribute('data-transparencia', this.transparencia);
	}
}

/** Crea el estado de la apariencia y lo comparte con los componentes descendientes. Llamar en el layout raíz. */
export function crearContextoTema(): EstadoTema {
	const estado = new EstadoTema();
	setContext(CLAVE_CONTEXTO, estado);
	return estado;
}

/** Lee el estado de la apariencia creado por el layout raíz. */
export function usarTema(): EstadoTema {
	return getContext<EstadoTema>(CLAVE_CONTEXTO);
}
