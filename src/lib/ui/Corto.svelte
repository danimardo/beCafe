<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Dialog } from 'bits-ui';
	import { RUTAS_CORTO } from '#lib/shared/corto';
	import { textos } from '#lib/shared/textos';
	import Button from './Button.svelte';
	import { usarMascota } from './contextos/mascota.svelte';

	type Props = {
		/** `antesDeEntrar` (RF-249): portada con «Ver el corto» y «Saltar». `dialogo` (RF-250): el mismo corto con «Cerrar». */
		modo?: 'antesDeEntrar' | 'dialogo';
		/** El vídeo llegó al final. */
		onTerminar?: () => void;
		/** La persona saltó el corto, lo cerró o pulsó Escape. */
		onSaltar?: () => void;
		video?: string;
		portada?: string;
		subtitulos?: string;
	};
	let {
		modo = 'antesDeEntrar',
		onTerminar = () => {},
		onSaltar = () => {},
		video = RUTAS_CORTO.video,
		portada = RUTAS_CORTO.portada,
		subtitulos = RUTAS_CORTO.subtitulos,
	}: Props = $props();

	const mascota = usarMascota();
	const antes = $derived(modo === 'antesDeEntrar');
	let open = $state(true);
	let reproductor = $state<HTMLVideoElement>();
	let empezado = $state(false);
	let fallo = $state(false);

	// «Ver el corto» es el gesto que permite el sonido: `play()` se llama dentro del clic (política de reproducción de los navegadores).
	async function ver() {
		fallo = false;
		empezado = true;
		mascota.detenerVoz();
		if (!reproductor) return;
		// El `src` se asigna aquí, dentro del clic: WebKit descarga el vídeo aunque tenga `preload="none"` si el `src` ya está puesto,
		// y mantiene el gesto que permite el sonido solo si `play()` se llama sin esperar antes (RF-251).
		reproductor.src = video;
		for (const pista of reproductor.textTracks) pista.mode = 'showing';
		try {
			await reproductor.play();
		} catch {
			fallo = true;
			empezado = false;
		}
	}

	// Un `onerror` en línea lo bloquea la CSP cuando se renderiza en el servidor: se escucha con un attach (como `Avatar`).
	function vigilarVideo(nodo: HTMLVideoElement) {
		const alFallar = () => {
			fallo = true;
			empezado = false;
		};
		nodo.addEventListener('error', alFallar);
		return () => nodo.removeEventListener('error', alFallar);
	}

	function saltar() {
		open = false;
		onSaltar();
	}
</script>

<Dialog.Root bind:open onOpenChange={(v) => !v && saltar()}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-fade-in fixed inset-0 z-50 bg-scrim" />
		<Dialog.Content
			interactOutsideBehavior={antes ? 'ignore' : 'close'}
			class="animate-sheet-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto rounded-none bg-wall-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-center text-ink md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[92dvh] md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:pb-6 md:pt-5"
		>
			{#if !antes}
				<div class="mb-2 flex w-full justify-end">
					<button
						type="button"
						onclick={saltar}
						aria-label={textos.corto.cerrar}
						class="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-ink hover:brightness-95"
					>
						<X class="size-5" aria-hidden="true" />
					</button>
				</div>
			{/if}

			<Dialog.Title class="type-title-lg mt-1">{textos.corto.titulo}</Dialog.Title>
			<Dialog.Description class="mt-1 max-w-xs text-[15px] leading-5 text-ink-muted">{textos.corto.resumen}</Dialog.Description>

			<!-- Superficie estable: el vídeo y los controles no van sobre cristal (constitución XVIII). -->
			<div class="mt-4 aspect-[9/16] h-[min(52dvh,30rem)] overflow-hidden rounded-tile border border-hairline bg-wall-1">
				<!-- Sin `src` hasta pulsar «Ver el corto»: no se descarga nada antes (plan F13 §7). -->
				<video
					bind:this={reproductor}
					{@attach vigilarVideo}
					poster={portada}
					preload="none"
					playsinline
					controls={empezado}
					aria-label={textos.corto.portadaAlt}
					class="size-full object-cover"
					onended={() => {
						open = false;
						onTerminar();
					}}
				>
					<track kind="captions" src={subtitulos} srclang="es" label={textos.corto.subtitulos} default />
				</video>
			</div>

			{#if fallo}
				<p role="alert" class="mt-3 text-[15px] text-negative">{textos.corto.sinConexion}</p>
			{/if}

			<div class="mt-4 grid w-full max-w-xs grid-cols-1 justify-items-center gap-1">
				{#if !empezado}
					<Button size="lg" block onclick={ver}>{textos.corto.ver}</Button>
				{/if}
				{#if antes}
					<!-- Secundario y pequeño, pero visible: contraste de 4,5:1 y objetivo de 24 × 24 px como mínimo (RF-252). -->
					<button
						type="button"
						onclick={saltar}
						class="type-caption inline-flex min-h-6 min-w-6 items-center px-3 py-1.5 text-ink-muted underline"
					>
						{textos.corto.saltar}
					</button>
				{/if}
			</div>

			<details class="mt-3 w-full max-w-xs text-left" open={!mascota.animar}>
				<summary class="type-caption cursor-pointer py-2 text-accent underline">{textos.corto.transcripcion}</summary>
				<div class="mt-1 flex flex-col gap-2 text-[14px] leading-5 text-ink-muted">
					<h2 class="sr-only">{textos.corto.transcripcionTitulo}</h2>
					{#each textos.corto.pasos as paso, i (i)}
						<p>
							{#if paso.tipo === 'voz'}<strong class="font-semibold text-ink">Capsulito: </strong>{/if}<span>{paso.texto}</span>
						</p>
					{/each}
				</div>
			</details>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
