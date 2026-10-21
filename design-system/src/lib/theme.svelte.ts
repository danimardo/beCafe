import { browser } from '$app/env';

export type ThemePreference = 'auto' | 'claro' | 'oscuro';
export type ResolvedTheme = 'claro' | 'oscuro';

const KEY = 'capsulas-tema';

/**
 * Estado del tema. «auto» sigue al dispositivo (prefers-color-scheme); «claro» y «oscuro» lo fuerzan.
 * El script de app.html aplica el tema antes de pintar; esta clase lo mantiene después.
 *
 * PERSISTENCIA: aquí se guarda en localStorage (por dispositivo). Para que la preferencia viaje con la
 * cuenta, asigna `theme.onPersist` y guarda el valor en el perfil del usuario en el servidor.
 */
class ThemeState {
	preference = $state<ThemePreference>('auto');
	resolved = $state<ResolvedTheme>('claro');
	onPersist: ((pref: ThemePreference) => void) | null = null;
	#mql: MediaQueryList | null = null;

	/** Llamar una vez en el layout raíz (onMount). */
	init(serverPreference?: ThemePreference) {
		if (!browser) return;
		let stored: string | null = null;
		try {
			stored = localStorage.getItem(KEY);
		} catch {}
		const pref = (serverPreference ?? stored ?? 'auto') as ThemePreference;
		this.preference = pref === 'claro' || pref === 'oscuro' ? pref : 'auto';
		this.#mql = matchMedia('(prefers-color-scheme: dark)');
		this.#mql.addEventListener('change', () => this.#apply());
		this.#apply();
	}

	set(pref: ThemePreference) {
		this.preference = pref;
		try {
			localStorage.setItem(KEY, pref);
		} catch {}
		this.#apply();
		this.onPersist?.(pref);
	}

	#apply() {
		const dark = this.preference === 'oscuro' || (this.preference === 'auto' && !!this.#mql?.matches);
		this.resolved = dark ? 'oscuro' : 'claro';
		document.documentElement.setAttribute('data-theme', this.resolved);
	}
}

export const theme = new ThemeState();
