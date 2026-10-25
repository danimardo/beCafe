<script lang="ts">
	import { cn } from './utils';

	type Props = {
		/** Una barra por etiqueta (p. ej. un mes) con un valor por serie, en el orden de `series`. */
		data: { label: string; values: number[] }[];
		/** Series apiladas de abajo arriba. `className` es la clase de color de su segmento y de su leyenda. */
		series: { label: string; className: string }[];
		/** Qué mide. Es el nombre accesible. */
		title: string;
		class?: string;
	};
	let { data, series, title, class: className }: Props = $props();

	const totales = $derived(data.map((d) => d.values.reduce((a, b) => a + b, 0)));
	const maximo = $derived(Math.max(1, ...totales));
	const resumen = $derived(
		data.map((d) => `${d.label}: ${series.map((serie, i) => `${serie.label} ${d.values[i] ?? 0}`).join(', ')}`).join('; '),
	);
</script>

<!-- Imagen para el lector de pantalla con todos los valores. La leyenda nombra cada serie: el color no es la única señal. -->
<figure class={cn('flex flex-col gap-2', className)}>
	<div role="img" aria-label="{title}. {resumen}" class="flex h-40 items-end gap-1.5 pt-3">
		{#each data as d, i (d.label)}
			<div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" aria-hidden="true">
				<span class="text-[11px] font-semibold leading-none tabular-nums text-ink-muted">{totales[i]}</span>
				<span
					class="flex w-full flex-col-reverse overflow-hidden rounded-t-md"
					style="height:{Math.max(2, ((totales[i] ?? 0) / maximo) * 78)}%"
				>
					{#each series as serie, s (serie.label)}
						{@const valor = d.values[s] ?? 0}
						{#if valor > 0}
							<span class={cn('block w-full border-t border-wall-base first:border-t-0', serie.className)} style="flex-grow:{valor}"></span>
						{/if}
					{/each}
				</span>
				<span class="truncate text-[11px] leading-none text-ink-muted">{d.label}</span>
			</div>
		{/each}
	</div>
	<figcaption class="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
		{#each series as serie (serie.label)}
			<span class="inline-flex items-center gap-1.5"
				><span class={cn('size-3 rounded-sm', serie.className)} aria-hidden="true"></span>{serie.label}</span
			>
		{/each}
	</figcaption>
</figure>
