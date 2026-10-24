import { browser } from '$app/env';
import type { Rive as InstanciaRive } from '@rive-app/canvas';
import { esquemaPistaLipSync } from '#lib/shared/contratos/apariencia';
import { bocaEnInstante, type FormaBoca } from '#lib/shared/mascota/lip-sync';
import { srcRiv, type Pose, type PoseRiv } from '#lib/shared/mascota/momentos';

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
