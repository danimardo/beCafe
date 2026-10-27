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
	};
	let {
		modo = 'antesDeEntrar',
		onTerminar = () => {},
		onSaltar = () => {},
		video = RUTAS_CORTO.video,
		portada = RUTAS_CORTO.portada,
	}: Props = $props();

	const mascota = usarMascota();
	const antes = $derived(modo === 'antesDeEntrar');
	let open = $state(true);
	let reproductor = $state<HTMLVideoElement>();
	let empezado = $state(false);
	let fallo = $state(false);
	let transcripcionAbierta = $state(false);

	// «Ver el corto» es el gesto que permite el sonido: `play()` se llama dentro del clic (política de reproducción de los navegadores).
	async function ver() {
		fallo = false;
		empezado = true;
		mascota.detenerVoz();
		if (!reproductor) return;
		// El `src` se asigna aquí, dentro del clic: WebKit descarga el vídeo aunque tenga `preload="none"` si el `src` ya está puesto,
		// y mantiene el gesto que permite el sonido solo si `play()` se llama sin esperar antes (RF-251).
		reproductor.src = video;
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
		<!-- Pantalla completa (RF-264): la portada difuminada rellena los lados cuando el vídeo no es 9:16. Superficie estable, sin cristal
		     (constitución XVIII); el título y la descripción solo los lee el lector de pantalla (RF-265). -->
		<Dialog.Content
			interactOutsideBehavior={antes ? 'ignore' : 'close'}
			class="animate-fade-in fixed inset-0 z-50 overflow-hidden rounded-none bg-wall-1 text-ink"
		>
			<Dialog.Title class="sr-only">{textos.corto.titulo}</Dialog.Title>
			<Dialog.Description class="sr-only">{textos.corto.resumen}</Dialog.Description>

			<img src={portada} alt="" aria-hidden="true" class="absolute inset-0 size-full scale-125 object-cover blur-2xl" />
			<div class="absolute inset-0 bg-scrim" aria-hidden="true"></div>

			<!-- Sin `src` hasta pulsar «Ver el corto»: no se descarga nada antes (plan F13 §7). Los subtítulos van grabados en el vídeo. -->
			<video
				bind:this={reproductor}
				{@attach vigilarVideo}
				poster={portada}
				preload="none"
				playsinline
				controls={empezado}
				aria-label={textos.corto.portadaAlt}
				class="absolute inset-0 size-full object-contain"
				onended={() => {
					open = false;
					onTerminar();
				}}
			></video>

			<!-- Esquina superior: pastilla opaca, contraste de 4,5:1 y objetivo de 44 × 44 px (RF-252). -->
			<div class="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
				{#if antes}
					<button
						type="button"
						onclick={saltar}
						class="type-caption inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-wall-raised px-4 text-ink underline hover:brightness-95"
					>
						{textos.corto.saltar}
					</button>
				{:else}
					<button
						type="button"
						onclick={saltar}
						aria-label={textos.corto.cerrar}
						class="inline-flex size-11 items-center justify-center rounded-full bg-wall-raised text-ink hover:brightness-95"
					>
						<X class="size-5" aria-hidden="true" />
					</button>
				{/if}
			</div>

			{#if !empezado}
				<div class="absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
					<Button size="lg" onclick={ver}>{textos.corto.ver}</Button>
				</div>
			{/if}

			{#if fallo}
				<p role="alert" class="absolute inset-x-6 top-[58%] rounded-chip bg-wall-raised px-3 py-2 text-center text-[15px] text-negative">
					{textos.corto.sinConexion}
				</p>
			{/if}

			<!-- Abajo, la transcripción en una hoja: la lectura no tapa el vídeo ni los subtítulos grabados. -->
			<div class="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center">
				<Dialog.Root bind:open={transcripcionAbierta}>
					<Dialog.Trigger
						class="type-caption inline-flex min-h-11 items-center rounded-full bg-wall-raised px-4 text-ink underline hover:brightness-95"
					>
						{textos.corto.transcripcion}
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay class="animate-fade-in fixed inset-0 z-[60] bg-scrim" />
						<Dialog.Content
							class="animate-sheet-in fixed inset-x-0 bottom-0 z-[60] max-h-[80dvh] overflow-y-auto rounded-t-sheet bg-wall-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink md:inset-x-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2"
						>
							<div class="flex items-start justify-between gap-3">
								<Dialog.Title class="type-title-lg">{textos.corto.transcripcionTitulo}</Dialog.Title>
								<Dialog.Close
									aria-label={textos.corto.cerrarTranscripcion}
									class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink hover:brightness-95"
								>
									<X class="size-5" aria-hidden="true" />
								</Dialog.Close>
							</div>
							<Dialog.Description class="sr-only">{textos.corto.resumen}</Dialog.Description>
							<div class="mt-3 flex flex-col gap-2 text-[14px] leading-5 text-ink-muted">
								{#each textos.corto.pasos as paso, i (i)}
									<p>
										{#if paso.tipo === 'voz'}<strong class="font-semibold text-ink">Capsulito: </strong>{/if}<span>{paso.texto}</span>
									</p>
								{/each}
							</div>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
