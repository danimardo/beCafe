<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { SvelteMap } from 'svelte/reactivity';
	import { textos } from '#lib/shared/textos';
	import { acotarVista, disposicion, encuadreDeVista, ZOOM_MAXIMO, zoomMaximo, type Vista } from '#lib/shared/fotos/zona-encuadre';
	import PhotoField from './PhotoField.svelte';
	import { cn } from './utils';

	type Props = {
		label: string;
		/** Archivo elegido (bindable). */
		file?: File | null;
		/** Nombre del campo del archivo. Los tres campos de encuadre se llaman `encuadreX`, `encuadreY` y `encuadreLado`. */
		name?: string;
		hint?: string;
		maxBytes?: number;
		/** `redonda` muestra el círculo del avatar; `ninguna`, solo el cuadrado de la cápsula (RF-273). */
		guia?: 'redonda' | 'ninguna';
		class?: string;
	};
	let { label, file = $bindable(null), name = 'foto', hint, maxBytes, guia = 'ninguna', class: className }: Props = $props();

	const uid = $props.id();
	const idAyuda = `ef-${uid}-ayuda`;
	const PASO = 0.02;
	const PASO_GRANDE = 0.1;
	const FACTOR_ZOOM = 1.25;

	let urlFoto = $state<string | null>(null);
	let ancho = $state(0);
	let alto = $state(0);
	let marco = $state(0);
	let vista = $state<Vista>({ cx: 0.5, cy: 0.5, zoom: 1 });

	// Sincroniza con algo externo (URL de objeto del navegador): la foto elegida se carga sin subirla.
	$effect(() => {
		const actual = file;
		ancho = 0;
		alto = 0;
		vista = { cx: 0.5, cy: 0.5, zoom: 1 };
		if (!actual) {
			urlFoto = null;
			return;
		}
		const url = URL.createObjectURL(actual);
		urlFoto = url;
		return () => URL.revokeObjectURL(url);
	});

	const listo = $derived(urlFoto !== null && ancho > 0 && alto > 0 && marco > 0);
	const colocacion = $derived(listo ? disposicion(vista, ancho, alto, marco) : null);
	const zona = $derived(listo ? encuadreDeVista(vista, ancho, alto) : null);
	const porcentaje = $derived(Math.round(vista.zoom * 100));
	const maximo = $derived(listo ? zoomMaximo(ancho, alto, marco) : 1);

	function alCargar(evento: Event) {
		if (!(evento.currentTarget instanceof HTMLImageElement)) return;
		ancho = evento.currentTarget.naturalWidth;
		alto = evento.currentTarget.naturalHeight;
	}

	function aplicar(siguiente: Vista) {
		if (listo) vista = acotarVista(siguiente, ancho, alto, marco);
	}

	function mover(dx: number, dy: number) {
		// dx y dy en fracciones de la zona visible.
		const lado = Math.min(ancho, alto) / vista.zoom;
		aplicar({ ...vista, cx: vista.cx + (dx * lado) / ancho, cy: vista.cy + (dy * lado) / alto });
	}

	function cambiarZoom(factor: number) {
		aplicar({ ...vista, zoom: vista.zoom * factor });
	}

	// Punteros activos: uno arrastra, dos hacen pellizco.
	const punteros = new SvelteMap<number, { x: number; y: number }>();
	let distanciaPrevia = 0;

	function distancia(): number {
		const puntos = [...punteros.values()];
		const a = puntos.at(0);
		const b = puntos.at(1);
		return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
	}

	function alBajar(evento: PointerEvent) {
		if (!listo || !(evento.currentTarget instanceof HTMLElement)) return;
		evento.currentTarget.setPointerCapture(evento.pointerId);
		punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
		distanciaPrevia = distancia();
	}

	function alMover(evento: PointerEvent) {
		const previo = punteros.get(evento.pointerId);
		if (!previo || !colocacion) return;
		punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
		if (punteros.size === 1) {
			aplicar({ ...vista, cx: vista.cx - (evento.clientX - previo.x) / colocacion.escala / ancho, cy: vista.cy - (evento.clientY - previo.y) / colocacion.escala / alto });
		} else if (punteros.size === 2) {
			const actual = distancia();
			if (distanciaPrevia > 0 && actual > 0) cambiarZoom(actual / distanciaPrevia);
			distanciaPrevia = actual;
		}
	}

	function alSoltar(evento: PointerEvent) {
		punteros.delete(evento.pointerId);
		distanciaPrevia = distancia();
	}

	function alRodar(evento: WheelEvent) {
		if (!listo) return;
		evento.preventDefault();
		cambiarZoom(evento.deltaY < 0 ? FACTOR_ZOOM : 1 / FACTOR_ZOOM);
	}

	function alPulsar(evento: KeyboardEvent) {
		const paso = evento.shiftKey ? PASO_GRANDE : PASO;
		const movimientos: Partial<Record<string, [number, number]>> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
		const movimiento = movimientos[evento.key];
		if (movimiento) {
			evento.preventDefault();
			mover(movimiento[0], movimiento[1]);
		} else if (evento.key === '+' || evento.key === '=') {
			evento.preventDefault();
			cambiarZoom(FACTOR_ZOOM);
		} else if (evento.key === '-') {
			evento.preventDefault();
			cambiarZoom(1 / FACTOR_ZOOM);
		}
	}

	const redondear = (valor: number) => valor.toFixed(5);
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<PhotoField {label} {name} {hint} {maxBytes} bind:file />

	{#if urlFoto}
		<div class="flex flex-col items-center gap-2">
			<!-- Marco cuadrado: arrastrar mueve la foto; la rueda y el pellizco cambian el zoom; el teclado hace lo mismo. -->
			<button
				type="button"
				aria-label={textos.encuadre.grupo}
				aria-describedby={idAyuda}
				bind:clientWidth={marco}
				onpointerdown={alBajar}
				onpointermove={alMover}
				onpointerup={alSoltar}
				onpointercancel={alSoltar}
				onwheel={alRodar}
				onkeydown={alPulsar}
				class="relative block aspect-square w-full max-w-72 touch-none select-none overflow-hidden rounded-tile border border-ink-muted/75 bg-wall-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<img
					src={urlFoto}
					alt=""
					draggable="false"
					onload={alCargar}
					class="pointer-events-none absolute max-w-none"
					style={colocacion
						? `width:${colocacion.anchoPx}px;height:${colocacion.altoPx}px;left:${colocacion.izquierda}px;top:${colocacion.arriba}px`
						: 'visibility:hidden'}
				/>
				{#if guia === 'redonda'}
					<!-- La guía oscurece lo que quedará fuera del avatar y dibuja su borde; el texto de debajo explica lo mismo. -->
					<span
						class="pointer-events-none absolute inset-0 block bg-ink/45"
						style="mask-image:radial-gradient(circle closest-side,transparent calc(100% - 1px),black 100%);-webkit-mask-image:radial-gradient(circle closest-side,transparent calc(100% - 1px),black 100%)"
						aria-hidden="true"
					></span>
					<span class="pointer-events-none absolute inset-0 block rounded-full border-2 border-accent" aria-hidden="true"></span>
				{/if}
			</button>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink-muted/75 px-4 text-[14px] font-semibold text-ink disabled:opacity-60"
					disabled={vista.zoom <= 1}
					onclick={() => cambiarZoom(1 / FACTOR_ZOOM)}
				>
					<Minus class="size-4" aria-hidden="true" />{textos.encuadre.reducir}
				</button>
				<button
					type="button"
					class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink-muted/75 px-4 text-[14px] font-semibold text-ink disabled:opacity-60"
					disabled={vista.zoom >= Math.min(maximo, ZOOM_MAXIMO)}
					onclick={() => cambiarZoom(FACTOR_ZOOM)}
				>
					<Plus class="size-4" aria-hidden="true" />{textos.encuadre.ampliar}
				</button>
			</div>
			<p role="status" class="text-[13px] font-medium text-ink">{textos.encuadre.zoom(porcentaje)}</p>
			<p id={idAyuda} class="text-center text-[13px] leading-[18px] text-ink-muted">
				{textos.encuadre.ayuda}
				{guia === 'redonda' ? textos.encuadre.guiaRedonda : textos.encuadre.sinGuia}
			</p>
		</div>
		{#if zona}
			<input type="hidden" name="encuadreX" value={redondear(zona.x)} />
			<input type="hidden" name="encuadreY" value={redondear(zona.y)} />
			<input type="hidden" name="encuadreLado" value={redondear(zona.lado)} />
		{/if}
	{/if}
</div>
