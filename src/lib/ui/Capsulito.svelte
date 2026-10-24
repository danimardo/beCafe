<script lang="ts">
	import { browser } from '$app/env';
	import type { Snippet } from 'svelte';
	import { montarCapsulitoRive, type ControladorRiveCapsulito } from '#lib/client/rive';
	import type { FormaBoca } from '#lib/shared/mascota/lip-sync';
	import {
		MOMENTOS,
		POSE_A_RIV,
		RIV_A_POSE,
		srcPose,
		srcSvg,
		textoDe,
		type Expresion,
		type MomentoId,
		type Pose,
		type PoseRiv,
	} from '#lib/shared/mascota/momentos';
	import { usarMascota } from './contextos/mascota.svelte';
	import { cn } from './utils';

	type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type Props = {
		/** Momento o evento del catálogo (pose + expresión + texto + tono). */
		momento?: MomentoId;
		/** Fuerza la pose WebP o Rive (gana a la del momento). */
		pose?: Pose;
		poseRiv?: PoseRiv;
		/** Fuerza la expresión facial (para el respaldo SVG de `static/mascota/svg/variantes/`). */
		expresion?: Expresion;
		/** Texto del bocadillo. Por defecto el del momento. `null` = sin bocadillo. */
		mensaje?: string | null;
		/** Sustituye `{nombre}` en el texto del momento. */
		nombre?: string;
		/** xs 40 px (avisos flotantes) · sm 64 · md 112 (vacíos, errores) · lg 160 (panel de escritorio) · xl 240 (bienvenida y laboratorio). */
		size?: Size;
		/** Dónde va el bocadillo respecto a la mascota. */
		bocadillo?: 'derecha' | 'arriba';
		/** Animación de entrada y reproducción Rive (solo si el sistema no pide reducir movimiento). */
		animar?: boolean;
		/** Modo de renderizado: `'auto'` (Rive en lg/xl y SVG/WebP en xs/sm/md), `'rive'` (fuerza Rive) o `'svg'` (fuerza SVG estático). */
		modo?: 'auto' | 'rive' | 'svg';
		/** Forma de boca explícita (`0..7`); si no se indica, sigue `mascota.bocaActual`. */
		boca?: FormaBoca;
		/** Demostración de habla sin audio en el laboratorio (`speechDemo` del ViewModel). */
		speechDemo?: boolean;
		/** Qué pintar si la persona ha desactivado la mascota en Perfil. */
		fallback?: Snippet;
		class?: string;
	};
	let {
		momento,
		pose,
		poseRiv,
		expresion,
		mensaje,
		nombre,
		size = 'md',
		bocadillo = 'derecha',
		animar = true,
		modo = 'auto',
		boca,
		speechDemo = false,
		fallback,
		class: className,
	}: Props = $props();

	const mascota = usarMascota();

	const px: Record<Size, number> = { xs: 40, sm: 64, md: 112, lg: 160, xl: 240 };
	const entradaMomento = $derived(momento ? MOMENTOS[momento] : null);
	const poseResuelta = $derived<Pose>(pose ?? (poseRiv ? RIV_A_POSE[poseRiv] : (entradaMomento?.pose ?? 'saludando')));
	const poseRivResuelta = $derived<PoseRiv>(poseRiv ?? (pose ? POSE_A_RIV[pose] : (entradaMomento?.poseRiv ?? 'saludo')));
	const expresionResuelta = $derived<Expresion>(expresion ?? entradaMomento?.expresion ?? 'feliz');
	const texto = $derived(mensaje === null ? null : (mensaje ?? (momento ? textoDe(momento, { nombre }) : null)));
	const tono = $derived(entradaMomento?.tono ?? 'neutro');
	const w = $derived(px[size]);
	const bocaEfectiva = $derived<FormaBoca>(boca ?? mascota.bocaActual);
	const usarRive = $derived(
		browser && animar && mascota.animar && (modo === 'rive' || (modo === 'auto' && (size === 'lg' || size === 'xl'))),
	);

	// Imagen estática de respaldo inmediato: usa el SVG vectorial cuando se pide modo SVG o una expresión específica, o el WebP.
	const srcEstatico = $derived(
		modo === 'svg' || expresion !== undefined
			? srcSvg(poseResuelta, expresionResuelta)
			: srcPose(poseResuelta, w <= 64 ? 128 : w <= 128 ? 256 : 512),
	);
	const srcset = $derived(
		modo === 'svg' || expresion !== undefined
			? undefined
			: ([128, 256, 512, 1024] as const).map((s) => `${srcPose(poseResuelta, s)} ${s}w`).join(', '),
	);
	const animClase = $derived(animar && mascota.animar ? (tono === 'celebracion' ? 'capsulito-salto' : 'capsulito-entrada') : '');

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let controladorRive = $state<ControladorRiveCapsulito | null>(null);
	let riveListo = $state(false);

	$effect(() => {
		const elemento = canvasEl;
		const poseActual = poseResuelta;
		const habilitado = usarRive;
		riveListo = false;
		controladorRive = null;
		if (!elemento || !habilitado) return;

		const limpiar = montarCapsulitoRive(elemento, {
			pose: poseActual,
			reducedMotion: !mascota.animar || !animar,
			autoPlay: animar && mascota.animar,
			speechDemo,
			inmediato: modo === 'rive' || size === 'xl',
			onListo(ctrl) {
				controladorRive = ctrl;
				riveListo = true;
			},
			onError() {
				controladorRive = null;
				riveListo = false;
			},
		});
		return () => {
			riveListo = false;
			controladorRive = null;
			limpiar();
		};
	});

	$effect(() => {
		controladorRive?.fijarBoca(bocaEfectiva);
	});

	$effect(() => {
		controladorRive?.fijarSpeechDemo(speechDemo);
	});

	$effect(() => {
		controladorRive?.fijarReducedMotion(!mascota.animar || !animar);
	});
</script>

<!--
	La imagen y el lienzo Rive son DECORATIVOS (`alt=""` y `aria-hidden="true"`, constitución XI y XVIII):
	la información completa siempre está en el texto del bocadillo o en el texto de la pantalla.
-->
{#if mascota.visible}
	<div
		class={cn('flex items-center gap-3', bocadillo === 'arriba' && 'flex-col-reverse gap-2', className)}
		data-momento={momento}
		data-pose={poseResuelta}
		data-pose-riv={poseRivResuelta}
		data-expresion={expresionResuelta}
		data-boca={bocaEfectiva}
	>
		<span class="capsulito-halo relative shrink-0" style="width:{w}px;height:{w}px">
			<img
				src={srcEstatico}
				{srcset}
				sizes={srcset ? `${w}px` : undefined}
				width={w}
				height={w}
				alt=""
				aria-hidden="true"
				decoding="async"
				loading="eager"
				class={cn('relative select-none object-contain', animClase, riveListo && usarRive && 'opacity-0')}
				style="width:{w}px;height:{w}px"
				draggable="false"
			/>
			{#if usarRive}
				<canvas
					bind:this={canvasEl}
					width={w * 2}
					height={w * 2}
					aria-hidden="true"
					class={cn('pointer-events-none absolute inset-0 select-none object-contain', !riveListo && 'opacity-0')}
					style="width:{w}px;height:{w}px"
				></canvas>
			{/if}
		</span>
		{#if texto}
			<p
				class={cn(
					'capsulito-bocadillo glass-strong relative max-w-[17rem] rounded-tile px-3.5 py-2.5 text-[15px] font-medium leading-5 text-ink',
					bocadillo === 'arriba' ? 'capsulito-bocadillo--arriba text-center' : 'capsulito-bocadillo--derecha',
					tono === 'aviso' && 'border-warning/40',
					tono === 'problema' && 'border-negative/30',
				)}
			>
				{texto}
			</p>
		{/if}
	</div>
{:else if fallback}
	{@render fallback()}
{/if}

<style>
	/* Halo detrás de la mascota: en claro casi invisible; en oscuro separa el marrón de Capsulito del fondo marrón (contraste ≥ 3:1 del contorno). */
	.capsulito-halo::before {
		content: '';
		position: absolute;
		inset: 6%;
		border-radius: 9999px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%);
	}
	:global([data-theme='oscuro']) .capsulito-halo::before {
		background: radial-gradient(circle, rgba(245, 222, 196, 0.34) 0%, rgba(245, 222, 196, 0.1) 50%, rgba(245, 222, 196, 0) 72%);
	}
	/* Pico del bocadillo: un cuadrado girado con el mismo cristal. */
	.capsulito-bocadillo::before {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		background: inherit;
		border: inherit;
		border-right: 0;
		border-top: 0;
	}
	.capsulito-bocadillo--derecha::before {
		left: -7px;
		top: calc(50% - 6px);
		transform: rotate(45deg);
	}
	.capsulito-bocadillo--arriba::before {
		bottom: -7px;
		left: calc(50% - 6px);
		transform: rotate(-45deg);
	}
	@keyframes capsulito-entrada {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.92);
		}
		70% {
			transform: translateY(-2px) scale(1.02);
		}
	}
	@keyframes capsulito-salto {
		0% {
			opacity: 0;
			transform: translateY(10px) scale(0.9);
		}
		40% {
			opacity: 1;
			transform: translateY(-12px) scale(1.04) rotate(-3deg);
		}
		70% {
			transform: translateY(0) scale(0.98) rotate(2deg);
		}
		100% {
			transform: none;
		}
	}
	:global(.capsulito-entrada) {
		animation: capsulito-entrada 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	:global(.capsulito-salto) {
		animation: capsulito-salto 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.capsulito-entrada),
		:global(.capsulito-salto) {
			animation: none;
		}
	}
</style>
