<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Download from '@lucide/svelte/icons/download';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Badge from './Badge.svelte';

	// Una copia del listado único (RF-253, RF-284, RF-287, RF-289). Presentacional: la pantalla le pasa los textos ya resueltos.
	type Props = {
		fecha: string;
		/** Tamaño ya formateado. Una copia fallida no lo tiene. */
		tamano?: string;
		/** Etiquetas de tipo («Diaria», «Manual», «Copia de resguardo»). El texto, no el color, distingue la copia. */
		etiquetas?: string[];
		/** Origen ya formateado («Origen: Local» u «Origen no registrado»). Una copia fallida no lo tiene. */
		origen?: string;
		/** Motivo de una copia fallida, ya formateado. Con él la fila muestra la etiqueta de fallo y no ofrece botones. */
		fallida?: string;
		/** Destino de la descarga, ya resuelto con `resolve()`. Sin él, no se ofrece. */
		descargarHref?: ResolvedPathname;
		descargarTexto: string;
		descargarNombre: string;
		/** Destino de la confirmación de restaurar, ya resuelto con `resolve()`. Sin él, no se ofrece. */
		restaurarHref?: ResolvedPathname;
		restaurarTexto: string;
		restaurarNombre: string;
	};
	let {
		fecha,
		tamano,
		etiquetas = [],
		origen,
		fallida,
		descargarHref,
		descargarTexto,
		descargarNombre,
		restaurarHref,
		restaurarTexto,
		restaurarNombre,
	}: Props = $props();
</script>

<li class="flex flex-col gap-1">
	<span class="font-semibold">{fecha}</span>
	{#if tamano}<span class="text-ink-muted">{tamano}</span>{/if}
	<span class="flex flex-wrap items-center gap-2">
		{#each etiquetas as etiqueta (etiqueta)}
			<Badge tone="accent">{etiqueta}</Badge>
		{/each}
		{#if fallida}
			<Badge tone="warning">
				<TriangleAlert class="size-3.5 shrink-0" aria-hidden="true" />
				{fallida}
			</Badge>
		{/if}
		{#if origen}<span class="text-ink-muted">{origen}</span>{/if}
	</span>
	{#if descargarHref || restaurarHref}
		<span class="mt-1 flex flex-wrap items-center gap-2">
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
			{#if restaurarHref}
				<a
					href={restaurarHref}
					aria-label={restaurarNombre}
					class="inline-flex min-h-11 w-fit items-center gap-2 rounded-chip border border-warning/50 px-4 text-ink underline"
				>
					<RotateCcw class="size-4 shrink-0" aria-hidden="true" />
					<span>{restaurarTexto}</span>
				</a>
			{/if}
		</span>
	{/if}
</li>
