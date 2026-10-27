<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Download from '@lucide/svelte/icons/download';
	import Badge from './Badge.svelte';

	// Una copia de la lista del bucket (RF-253, RF-284, RF-287, RF-289). Presentacional: la pantalla le pasa los textos ya resueltos.
	type Props = {
		fecha: string;
		/** Tamaño ya formateado. */
		tamano: string;
		/** Etiquetas de tipo («Manual», «Copia de resguardo»). El texto, no el color, distingue la copia. */
		etiquetas?: string[];
		/** Origen ya formateado, con su rótulo («Origen: Local»). */
		origen: string;
		/** Destino de la descarga, ya resuelto con `resolve()`. Sin él, no se ofrece. */
		descargarHref?: ResolvedPathname;
		descargarTexto: string;
		descargarNombre: string;
	};
	let { fecha, tamano, etiquetas = [], origen, descargarHref, descargarTexto, descargarNombre }: Props = $props();
</script>

<li class="flex flex-col gap-1">
	<span class="font-semibold">{fecha}</span>
	<span class="text-ink-muted">{tamano}</span>
	<span class="flex flex-wrap items-center gap-2">
		{#each etiquetas as etiqueta (etiqueta)}
			<Badge tone="accent">{etiqueta}</Badge>
		{/each}
		<span class="text-ink-muted">{origen}</span>
	</span>
	{#if descargarHref}
		<!-- El servidor responde con un archivo adjunto: el enlace sale del enrutador de SvelteKit con una navegación normal. -->
		<a
			href={descargarHref}
			data-sveltekit-reload
			aria-label={descargarNombre}
			class="inline-flex min-h-11 w-fit items-center gap-2 rounded-chip border border-hairline px-4 text-ink underline"
		>
			<Download class="size-4 shrink-0" aria-hidden="true" />
			<span>{descargarTexto}</span>
		</a>
	{/if}
</li>
