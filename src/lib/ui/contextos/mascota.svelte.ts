import { browser } from '$app/env';
import { getContext, setContext, untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { registrarDatoInvalido } from '#lib/client/registro';
import { reproducirSonido, reproducirVozSincronizada, type ReproductorVozActiva } from '#lib/client/rive';
import {
	CLAVE_BIENVENIDA,
	CLAVE_MASCOTA,
	CLAVE_VOZ,
	interpretarBienvenida,
	interpretarMascota,
	interpretarVoz,
} from '#lib/shared/contratos/apariencia';
import { buscarFrase } from '#lib/shared/mascota/frases';
import type { FormaBoca } from '#lib/shared/mascota/lip-sync';
import { elegirVariante, formatearTextoMascota, type MomentoId, type Pose, type VarianteFrase } from '#lib/shared/mascota/momentos';

const CLAVE_CONTEXTO = Symbol('mascota');
/** Sonido corto que acompaña a cada registro confirmado por el servidor (RF-243). */
export const RUTA_SONIDO_CELEBRACION = '/mascota/sonidos/celebracion.mp3';

/**
 * Estado y preferencias de Capsulito por petición/sesión de navegador (RF-185, RF-186, RF-187; DEC-110).
 * Se comparte por contexto de Svelte (nunca como variable de módulo, constitución XVII).
 */
export class EstadoMascota {
	visible = $state(true);
	vozActiva = $state(false);
	animar = $state(true);
	/** `true` en SSR y sin JS para que el diálogo modal nunca se abra solo sin JavaScript. */
	bienvenidaVista = $state(true);
	/** `true` cuando la persona pide repetir la bienvenida desde `/perfil` o `/ayuda`. */
	bienvenidaManual = $state(false);
	/** `true` cuando la persona pide «Ver el corto otra vez» desde Ajustes o Ayuda (RF-250). */
	cortoManual = $state(false);
	/** `true` cuando ya se vio o se saltó la portada del corto en esta sesión del navegador (RF-249). No se guarda: usa la marca de bienvenida. */
	cortoCerrado = $state(false);
	bocaActual = $state<FormaBoca>(0);
	audioEnCurso = $state<string | null>(null);

	#mql: MediaQueryList | null = null;
	#alCambiarMovimiento = () => {
		this.animar = !this.#mql?.matches;
	};
	#ultimasVariantes = new SvelteMap<MomentoId, string>();
	#reproductorActivo: ReproductorVozActiva | null = null;
	#sonidoActivo: ReproductorVozActiva | null = null;

	/** Lee `localStorage` validado con Zod y se suscribe a `prefers-reduced-motion`. Llamar en `onMount` del layout raíz. */
	iniciar() {
		if (!browser) return;
		const mascotaRaw = this.#leer(CLAVE_MASCOTA);
		const vozRaw = this.#leer(CLAVE_VOZ);
		const bienvenidaRaw = this.#leer(CLAVE_BIENVENIDA);

		const prefMascota = interpretarMascota(mascotaRaw);
		const prefVoz = interpretarVoz(vozRaw);
		const prefBienvenida = interpretarBienvenida(bienvenidaRaw);

		this.visible = prefMascota === 'visible';
		this.vozActiva = prefVoz === 'activa';
		this.bienvenidaVista = prefBienvenida === 'vista';

		document.documentElement.setAttribute('data-mascota', prefMascota);
		this.#mql = matchMedia('(prefers-reduced-motion: reduce)');
		this.animar = !this.#mql.matches;
		this.#mql.addEventListener('change', this.#alCambiarMovimiento);
	}

	destruir() {
		this.#mql?.removeEventListener('change', this.#alCambiarMovimiento);
		this.detenerVoz();
	}

	setVisible(visible: boolean) {
		this.visible = visible;
		const valor = visible ? 'visible' : 'oculta';
		if (browser) document.documentElement.setAttribute('data-mascota', valor);
		this.#guardar(CLAVE_MASCOTA, valor);
		if (!visible) this.detenerVoz();
	}

	setVozActiva(activa: boolean) {
		this.vozActiva = activa;
		this.#guardar(CLAVE_VOZ, activa ? 'activa' : 'silenciada');
		if (!activa) this.detenerVoz();
	}

	marcarBienvenidaVista() {
		this.bienvenidaVista = true;
		this.bienvenidaManual = false;
		this.#guardar(CLAVE_BIENVENIDA, 'vista');
		this.detenerVoz();
	}

	/**
	 * Si toca mostrar la portada del corto antes de entrar (RF-249): dispositivo sin la marca de bienvenida vista, Capsulito visible
	 * y conexión. La marca la pone la bienvenida, no el corto: no se guarda nada nuevo en el navegador (constitución V).
	 */
	get cortoPendiente(): boolean {
		return browser && this.visible && !this.bienvenidaVista && !this.cortoCerrado && navigator.onLine;
	}

	cerrarCorto() {
		this.cortoCerrado = true;
		this.cortoManual = false;
	}

	/** Abre el corto en un diálogo (RF-250). */
	repetirCorto() {
		this.cortoManual = true;
	}

	/** Abre de nuevo la historia de bienvenida (desde `/ayuda` o `/perfil`). */
	repetirBienvenida() {
		if (!this.visible) this.setVisible(true);
		this.bienvenidaVista = false;
		this.bienvenidaManual = true;
	}

	/**
	 * Elige una variante del momento sin repetir la anterior inmediata y devuelve el texto formateado
	 * y el identificador de audio (RF-186, CA-186).
	 */
	elegirFrase(momento: MomentoId, vars: { nombre?: string } = {}): { id: string; texto: string; conAudio: boolean } {
		const ultimo = this.#ultimasVariantes.get(momento) ?? null;
		const variante: VarianteFrase = elegirVariante(momento, ultimo, this.#ultimasVariantes.size);
		this.#ultimasVariantes.set(momento, variante.id);
		return {
			id: variante.id,
			texto: formatearTextoMascota(variante.texto, vars),
			conAudio: Boolean(variante.conAudio),
		};
	}

	/**
	 * Muestra una frase del anexo del servidor (RF-213, RF-214): devuelve su texto y su pose y la dice si la voz está activa.
	 * `null` si el identificador no está en el catálogo o la mascota está oculta (no se dice nada sin mascota).
	 * Con `celebrando`, la locución espera al sonido de celebración (RF-243).
	 */
	mostrarFrase(fraseId: string, celebrando = false): { texto: string; pose: Pose } | null {
		const frase = buscarFrase(fraseId);
		if (!frase || !this.visible) return null;
		if (celebrando) this.celebrar(frase.id);
		else this.hablar(frase.id);
		return { texto: frase.texto, pose: frase.pose };
	}

	/**
	 * Reproduce una locución pregenerada sincronizando `bocaActual` (`0..7`).
	 * Se ejecuta sin seguimiento: detener la locución anterior lee y escribe `audioEnCurso`, y desde un `$effect`
	 * eso creaba un bucle (`effect_update_depth_exceeded`) al cambiar de escena con la voz activa.
	 */
	hablar(audioId: string, forzar = false) {
		untrack(() => {
			if (!browser || !this.visible) return;
			if (!forzar && !this.vozActiva) return;
			this.detenerVoz();
			this.audioEnCurso = audioId;
			this.#reproductorActivo = reproducirVozSincronizada(
				audioId,
				(boca) => {
					this.bocaActual = boca;
				},
				() => {
					if (this.audioEnCurso === audioId) this.audioEnCurso = null;
					this.bocaActual = 0;
				},
			);
		});
	}

	/**
	 * Celebra un registro confirmado por el servidor (RF-243, RF-244): suena el sonido corto y, al terminar, la locución `fraseId`.
	 * Solo suena con Capsulito visible y la voz activa; sin ellas no hace nada (el mensaje de pantalla ya lo da la página).
	 * Una celebración nueva corta el sonido y la locución de la anterior.
	 */
	celebrar(fraseId: string | null) {
		untrack(() => {
			if (!browser || !this.visible || !this.vozActiva) return;
			this.detenerVoz();
			this.#sonidoActivo = reproducirSonido(RUTA_SONIDO_CELEBRACION, () => {
				this.#sonidoActivo = null;
				if (fraseId) this.hablar(fraseId);
			});
		});
	}

	detenerVoz() {
		this.#sonidoActivo?.detener();
		this.#sonidoActivo = null;
		this.#reproductorActivo?.detener();
		this.#reproductorActivo = null;
		this.audioEnCurso = null;
		this.bocaActual = 0;
	}

	#leer(clave: string): unknown {
		try {
			const valor = localStorage.getItem(clave);
			if (valor !== null && !this.#esValido(clave, valor)) {
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
			// Sin localStorage la preferencia vale solo para esta visita.
		}
	}

	#esValido(clave: string, valor: string): boolean {
		if (clave === CLAVE_MASCOTA) return interpretarMascota(valor) === valor;
		if (clave === CLAVE_VOZ) return interpretarVoz(valor) === valor;
		return interpretarBienvenida(valor) === valor;
	}
}

export function crearContextoMascota(): EstadoMascota {
	const estado = new EstadoMascota();
	setContext(CLAVE_CONTEXTO, estado);
	return estado;
}

export function usarMascota(): EstadoMascota {
	return getContext<EstadoMascota | undefined>(CLAVE_CONTEXTO) ?? new EstadoMascota();
}
