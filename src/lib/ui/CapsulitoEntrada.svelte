<script lang="ts">
	import { browser } from '$app/env';
	import { montarRiveEntrada, type ControladorRiveEntrada } from '#lib/client/rive';
	import { srcPose } from '#lib/shared/mascota/momentos';
	import { usarMascota } from './contextos/mascota.svelte';
	import { cn } from './utils';

	// Capsulito de la pantalla de entrada (F11, RF-225, CA-225). Decorativo: el formulario y sus mensajes lo dicen todo.
	// Muestra la imagen estática de inmediato y la sustituye por la animación Rive cuando carga. Sin movimiento reducido,
	// sin JavaScript o si el archivo no carga, se queda la imagen.
	type Props = {
		/** Hacia dónde mira: 0 izquierda, 50 centro, 100 derecha. */
		mirarX?: number;
		taparOjos?: boolean;
		/** `fallo` pone cara triste y `exito` celebra. `reposo` no hace nada. */
		estado?: 'reposo' | 'fallo' | 'exito';
		/** Fuerza el modo quieto además de `prefers-reduced-motion`. */
		reducido?: boolean;
		size?: number;
		class?: string;
	};
	let { mirarX = 50, taparOjos = false, estado = 'reposo', reducido = false, size = 176, class: className }: Props = $props();

	const mascota = usarMascota();
	const quieto = $derived(reducido || !mascota.animar);

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let controlador = $state<ControladorRiveEntrada | null>(null);
	let listo = $state(false);

	$effect(() => {
		const elemento = canvasEl;
		listo = false;
		controlador = null;
		if (!elemento || !browser) return;
		const limpiar = montarRiveEntrada(elemento, {
			reducedMotion: false,
			onListo(ctrl) {
				controlador = ctrl;
				listo = true;
			},
			onError() {
				controlador = null;
				listo = false;
			},
		});
		return () => {
			listo = false;
			controlador = null;
			limpiar();
		};
	});

	$effect(() => controlador?.mirar(mirarX));
	$effect(() => controlador?.taparOjos(taparOjos));
	$effect(() => controlador?.fijarReducedMotion(quieto));
	$effect(() => {
		if (estado === 'fallo') controlador?.fallo();
		else if (estado === 'exito') controlador?.exito();
	});
</script>

{#if mascota.visible}
	<span
		class={cn('capsulito-entrada relative inline-block shrink-0', className)}
		style="width:{size}px;height:{size}px"
		data-testid="capsulito-entrada"
		data-estado={estado}
		data-mirar={Math.round(mirarX)}
		data-tapados={taparOjos}
		data-listo={listo}
	>
		<img
			src={srcPose('saludando', 512)}
			width={size}
			height={size}
			alt=""
			aria-hidden="true"
			decoding="async"
			loading="eager"
			class={cn('select-none object-contain', listo && !quieto && 'opacity-0')}
			style="width:{size}px;height:{size}px"
			draggable="false"
		/>
		{#if browser && !quieto}
			<canvas
				bind:this={canvasEl}
				width={size * 2}
				height={size * 2}
				aria-hidden="true"
				class={cn('pointer-events-none absolute inset-0 select-none object-contain', !listo && 'opacity-0')}
				style="width:{size}px;height:{size}px"
			></canvas>
		{/if}
	</span>
{/if}
