import { browser } from '$app/env';
import type { Rive as InstanciaRive } from '@rive-app/canvas';
import { esquemaPistaLipSync } from '#lib/shared/contratos/apariencia';
import { bocaEnInstante, type FormaBoca } from '#lib/shared/mascota/lip-sync';
import { srcRiv, type Pose, type PoseRiv } from '#lib/shared/mascota/momentos';
import type { GestoReposo } from '#lib/shared/mascota/reposo';

/**
 * Único archivo que importa `@rive-app/canvas` (ARCHITECTURE.md §11, ADR-0006, regla `rive-solo-en-adaptador`).
 * Conecta con la máquina de estados `Capsulito` y la instancia `Default` del ViewModel (Rive Data Binding):
 * - `play` (trigger), `cancel` (trigger)
 * - `autoPlay` (boolean), `reducedMotion` (boolean), `speechDemo` (boolean)
 * - `mouth` (number 0..7)
 */

export interface ControladorRiveCapsulito {
	dispararPlay(): void;
	dispararCancel(): void;
	fijarReducedMotion(reducido: boolean): void;
	fijarAutoPlay(activo: boolean): void;
	fijarBoca(boca: FormaBoca): void;
	fijarSpeechDemo(activo: boolean): void;
	redimensionar(): void;
	destruir(): void;
}

export interface OpcionesMontajeRive {
	pose: Pose | PoseRiv;
	reducedMotion: boolean;
	autoPlay?: boolean;
	speechDemo?: boolean;
	inmediato?: boolean;
	onListo?: (controlador: ControladorRiveCapsulito) => void;
	onError?: () => void;
}

/** Monta un archivo `.riv` de Capsulito sobre el `<canvas>` dado. Devuelve una función de limpieza. */
export function montarCapsulitoRive(canvas: HTMLCanvasElement, opciones: OpcionesMontajeRive): () => void {
	if (!browser) return () => undefined;

	const ciclo = { cancelado: false };
	const estaCancelado = (): boolean => ciclo.cancelado;
	let instancia: InstanciaRive | null = null;
	const retardo = opciones.inmediato ? 150 : 220;

	const temporizador = setTimeout(() => {
		if (estaCancelado()) return;
		if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
		if (!navigator.onLine) {
			opciones.onError?.();
			return;
		}

		void (async () => {
			try {
				const modulo = await import('@rive-app/canvas');
				if (estaCancelado() || !navigator.onLine) return;

				modulo.RuntimeLoader.setWasmUrl('/mascota/riv/rive.wasm');
				modulo.RuntimeLoader.setWasmFallbackUrl(null);

				const respuestaRiv = await fetch(srcRiv(opciones.pose));
				if (!respuestaRiv.ok || estaCancelado()) {
					if (!estaCancelado()) opciones.onError?.();
					return;
				}
				const buffer = await respuestaRiv.arrayBuffer();
				if (estaCancelado()) return;

				const rive = new modulo.Rive({
					buffer,
					canvas,
					stateMachine: 'Capsulito',
					autoBind: true,
					autoplay: !opciones.reducedMotion,
					onLoad: () => {
						if (estaCancelado()) {
							rive.cleanup();
							return;
						}
						rive.resizeDrawingSurfaceToCanvas();
						const vmi = rive.viewModelInstance;
						const propPlay = vmi?.trigger('play') ?? null;
						const propCancel = vmi?.trigger('cancel') ?? null;
						const propAutoPlay = vmi?.boolean('autoPlay') ?? null;
						const propReduced = vmi?.boolean('reducedMotion') ?? null;
						const propMouth = vmi?.number('mouth') ?? null;
						const propSpeechDemo = vmi?.boolean('speechDemo') ?? null;

						if (propReduced) propReduced.value = opciones.reducedMotion;
						if (propAutoPlay) propAutoPlay.value = opciones.autoPlay ?? !opciones.reducedMotion;
						if (propSpeechDemo) propSpeechDemo.value = opciones.speechDemo ?? false;
						if (propMouth) propMouth.value = 0;

						if (!opciones.reducedMotion && propPlay) {
							propPlay.trigger();
						}

						const controlador: ControladorRiveCapsulito = {
							dispararPlay() {
								propPlay?.trigger();
							},
							dispararCancel() {
								propCancel?.trigger();
								if (propMouth) propMouth.value = 0;
							},
							fijarReducedMotion(reducido: boolean) {
								if (propReduced) propReduced.value = reducido;
								if (propAutoPlay) propAutoPlay.value = !reducido;
								if (reducido && propMouth) propMouth.value = 0;
							},
							fijarAutoPlay(activo: boolean) {
								if (propAutoPlay) propAutoPlay.value = activo;
							},
							fijarBoca(boca: FormaBoca) {
								if (propSpeechDemo && boca !== 0) propSpeechDemo.value = false;
								if (propMouth) propMouth.value = boca;
							},
							fijarSpeechDemo(activo: boolean) {
								if (propSpeechDemo) propSpeechDemo.value = activo;
								if (!activo && propMouth) propMouth.value = 0;
							},
							redimensionar() {
								rive.resizeDrawingSurfaceToCanvas();
							},
							destruir() {
								rive.cleanup();
							},
						};
						opciones.onListo?.(controlador);
					},
					onLoadError: () => {
						if (!estaCancelado()) opciones.onError?.();
					},
				});
				instancia = rive;
			} catch {
				if (!estaCancelado()) opciones.onError?.();
			}
		})();
	}, retardo);

	return () => {
		ciclo.cancelado = true;
		clearTimeout(temporizador);
		instancia?.cleanup();
		instancia = null;
	};
}

export interface ControladorRiveEntrada {
	/** Hacia dónde mira Capsulito: 0 izquierda, 50 centro, 100 derecha. */
	mirar(x: number): void;
	taparOjos(tapados: boolean): void;
	fallo(): void;
	exito(): void;
	fijarReducedMotion(reducido: boolean): void;
	destruir(): void;
}

export interface OpcionesMontajeEntrada {
	reducedMotion: boolean;
	onListo?: (controlador: ControladorRiveEntrada) => void;
	onError?: () => void;
}

/** Ruta del archivo de la pantalla de entrada (F11, RF-225); su fuente está en `docs/diseno/f11/rive/entrada/`. */
export const SRC_RIV_ENTRADA = '/mascota/riv/capsulito-entrada.riv';

/**
 * Monta la animación de la entrada sobre el `<canvas>` dado. Máquina de estados `Entrada`
 * y propiedades del ViewModel `Entrada` (instancia `Default`): `mirarX` (número 0–100), `taparOjos` (booleano),
 * `fallo` y `exito` (disparadores) y `reducedMotion` (booleano).
 * Devuelve una función de limpieza. Si algo falla, llama a `onError` y la pantalla se queda con la imagen estática.
 */
export function montarRiveEntrada(canvas: HTMLCanvasElement, opciones: OpcionesMontajeEntrada): () => void {
	if (!browser) return () => undefined;

	const ciclo = { cancelado: false };
	const estaCancelado = (): boolean => ciclo.cancelado;
	let instancia: InstanciaRive | null = null;

	void (async () => {
		try {
			if (!navigator.onLine) {
				opciones.onError?.();
				return;
			}
			const modulo = await import('@rive-app/canvas');
			if (estaCancelado()) return;
			modulo.RuntimeLoader.setWasmUrl('/mascota/riv/rive.wasm');
			modulo.RuntimeLoader.setWasmFallbackUrl(null);

			const respuesta = await fetch(SRC_RIV_ENTRADA);
			if (!respuesta.ok || estaCancelado()) {
				if (!estaCancelado()) opciones.onError?.();
				return;
			}
			const buffer = await respuesta.arrayBuffer();
			if (estaCancelado()) return;

			const rive = new modulo.Rive({
				buffer,
				canvas,
				stateMachine: 'Entrada',
				autoBind: true,
				autoplay: true,
				onLoad: () => {
					if (estaCancelado()) {
						rive.cleanup();
						return;
					}
					rive.resizeDrawingSurfaceToCanvas();
					const vmi = rive.viewModelInstance;
					const mirarX = vmi?.number('mirarX') ?? null;
					const taparOjos = vmi?.boolean('taparOjos') ?? null;
					const fallo = vmi?.trigger('fallo') ?? null;
					const exito = vmi?.trigger('exito') ?? null;
					const reducido = vmi?.boolean('reducedMotion') ?? null;
					if (reducido) reducido.value = opciones.reducedMotion;

					opciones.onListo?.({
						mirar(x) {
							if (mirarX) mirarX.value = Math.min(100, Math.max(0, x));
						},
						taparOjos(tapados) {
							if (taparOjos) taparOjos.value = tapados;
						},
						fallo() {
							fallo?.trigger();
						},
						exito() {
							exito?.trigger();
						},
						fijarReducedMotion(valor) {
							if (reducido) reducido.value = valor;
						},
						destruir() {
							rive.cleanup();
						},
					});
				},
				onLoadError: () => {
					if (!estaCancelado()) opciones.onError?.();
				},
			});
			instancia = rive;
		} catch {
			if (!estaCancelado()) opciones.onError?.();
		}
	})();

	return () => {
		ciclo.cancelado = true;
		instancia?.cleanup();
		instancia = null;
	};
}

export interface ControladorRiveReposo {
	/** Lanza un gesto de reposo (RF-248). El tiempo en reposo lo cuenta quien llama, no la animación. */
	gesto(nombre: GestoReposo): void;
	/** Vuelve al neutro de inmediato, sea cual sea el gesto en curso. */
	cancelar(): void;
	fijarReducedMotion(reducido: boolean): void;
	destruir(): void;
}

export interface OpcionesMontajeReposo {
	reducedMotion: boolean;
	onListo?: (controlador: ControladorRiveReposo) => void;
	onError?: () => void;
}

/** Ruta del archivo de los gestos de reposo (F12, RF-248); su fuente está en `docs/diseno/f12/rive/reposo/`. */
export const SRC_RIV_REPOSO = '/mascota/riv/capsulito-reposo.riv';

/**
 * Monta la animación de reposo sobre el `<canvas>` dado. Máquina de estados `Reposo` y propiedades del ViewModel `Reposo`
 * (instancia `Default`): `mirarLados`, `pie`, `bostezoMano`, `tocarReloj`, `bostezo` y `cancelar` (disparadores) y `reducedMotion` (booleano).
 * Parpadea sola cada 3 s. Devuelve una función de limpieza. Si algo falla, llama a `onError` y Capsulito sigue con su pose.
 */
export function montarRiveReposo(canvas: HTMLCanvasElement, opciones: OpcionesMontajeReposo): () => void {
	if (!browser) return () => undefined;

	const ciclo = { cancelado: false };
	const estaCancelado = (): boolean => ciclo.cancelado;
	let instancia: InstanciaRive | null = null;

	void (async () => {
		try {
			if (!navigator.onLine) {
				opciones.onError?.();
				return;
			}
			const modulo = await import('@rive-app/canvas');
			if (estaCancelado()) return;
			modulo.RuntimeLoader.setWasmUrl('/mascota/riv/rive.wasm');
			modulo.RuntimeLoader.setWasmFallbackUrl(null);

			const respuesta = await fetch(SRC_RIV_REPOSO);
			if (!respuesta.ok || estaCancelado()) {
				if (!estaCancelado()) opciones.onError?.();
				return;
			}
			const buffer = await respuesta.arrayBuffer();
			if (estaCancelado()) return;

			const rive = new modulo.Rive({
				buffer,
				canvas,
				stateMachine: 'Reposo',
				autoBind: true,
				autoplay: true,
				onLoad: () => {
					if (estaCancelado()) {
						rive.cleanup();
						return;
					}
					rive.resizeDrawingSurfaceToCanvas();
					const vmi = rive.viewModelInstance;
					const disparadores = {
						mirarLados: vmi?.trigger('mirarLados') ?? null,
						pie: vmi?.trigger('pie') ?? null,
						bostezoMano: vmi?.trigger('bostezoMano') ?? null,
						tocarReloj: vmi?.trigger('tocarReloj') ?? null,
						bostezo: vmi?.trigger('bostezo') ?? null,
					} satisfies Record<GestoReposo, ReturnType<NonNullable<typeof vmi>['trigger']> | null>;
					const cancelar = vmi?.trigger('cancelar') ?? null;
					const reducido = vmi?.boolean('reducedMotion') ?? null;
					if (reducido) reducido.value = opciones.reducedMotion;

					opciones.onListo?.({
						gesto(nombre) {
							disparadores[nombre]?.trigger();
						},
						cancelar() {
							cancelar?.trigger();
						},
						fijarReducedMotion(valor) {
							if (reducido) reducido.value = valor;
						},
						destruir() {
							rive.cleanup();
						},
					});
				},
				onLoadError: () => {
					if (!estaCancelado()) opciones.onError?.();
				},
			});
			instancia = rive;
		} catch {
			if (!estaCancelado()) opciones.onError?.();
		}
	})();

	return () => {
		ciclo.cancelado = true;
		instancia?.cleanup();
		instancia = null;
	};
}

export interface ReproductorVozActiva {
	detener(): void;
}

/**
 * Reproduce `/mascota/voces/{audioId}.mp3` sincronizando las formas de boca `0..7` desde `/mascota/voces/{audioId}.json`.
 * Si el archivo no existe o el navegador bloquea la reproducción automática, finaliza en silencio sin lanzar error.
 */
export function reproducirVozSincronizada(audioId: string, onBoca: (boca: FormaBoca) => void, onFin?: () => void): ReproductorVozActiva {
	if (!browser || !navigator.onLine) return { detener: () => undefined };

	const sesion = { detenido: false };
	const estaDetenido = (): boolean => sesion.detenido;
	let raf = 0;
	let audio: HTMLAudioElement | null = null;

	const limpiar = () => {
		if (estaDetenido()) return;
		sesion.detenido = true;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		if (audio) {
			audio.pause();
			audio.src = '';
			audio = null;
		}
		onBoca(0);
		onFin?.();
	};

	void (async () => {
		try {
			const respuesta = await fetch(`/mascota/voces/${audioId}.json`);
			if (!respuesta.ok || estaDetenido()) {
				limpiar();
				return;
			}
			const json: unknown = await respuesta.json();
			const validado = esquemaPistaLipSync.safeParse(json);
			if (!validado.success || estaDetenido()) {
				limpiar();
				return;
			}
			const pista = validado.data;
			const reproductor = new Audio(`/mascota/voces/${audioId}.mp3`);
			audio = reproductor;

			const actualizarBoca = () => {
				if (estaDetenido() || !audio) return;
				if (audio.paused || audio.ended) {
					onBoca(0);
					return;
				}
				onBoca(bocaEnInstante(pista.cues, audio.currentTime));
				raf = requestAnimationFrame(actualizarBoca);
			};

			reproductor.addEventListener('play', () => {
				if (!estaDetenido()) raf = requestAnimationFrame(actualizarBoca);
			});
			reproductor.addEventListener('ended', limpiar);
			reproductor.addEventListener('error', limpiar);

			await reproductor.play();
		} catch {
			limpiar();
		}
	})();

	return { detener: limpiar };
}

/**
 * Reproduce un efecto de sonido corto (la celebración de un registro, RF-243). `onFin` se llama cuando el sonido termina solo o no se
 * puede reproducir (el navegador lo bloquea, el archivo falta): así lo que sigue, la locución, se dice igual. `detener()` lo corta SIN
 * llamar a `onFin`, para que una celebración nueva no deje hablar a la anterior.
 */
export function reproducirSonido(ruta: string, onFin?: () => void): ReproductorVozActiva {
	if (!browser) {
		onFin?.();
		return { detener: () => undefined };
	}
	const sesion = { detenido: false };
	const reproductor = new Audio(ruta);
	const terminar = () => {
		if (sesion.detenido) return;
		sesion.detenido = true;
		onFin?.();
	};
	reproductor.addEventListener('ended', terminar);
	reproductor.addEventListener('error', terminar);
	// Una promesa rechazada es un bloqueo de reproducción: no es un error de la aplicación y no se registra.
	reproductor.play().catch(terminar);
	return {
		detener() {
			if (sesion.detenido) return;
			sesion.detenido = true;
			reproductor.pause();
			reproductor.src = '';
		},
	};
}
