<script lang="ts">
	import { cn } from './utils';

	type Props = {
		data: { label: string; value: number }[];
		/** Qué mide, p. ej. «Cafés por semana». Se usa como nombre accesible. */
		title: string;
		/** Resalta la última barra (el periodo actual). */
		highlightLast?: boolean;
		unit?: string;
		class?: string;
	};
	let { data, title, highlightLast = true, unit = '', class: className }: Props = $props();
	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const summary = $derived(data.map((d) => `${d.label}: ${d.value}${unit ? ' ' + unit : ''}`).join(', '));
</script>

<!-- El gráfico es una imagen para el lector de pantalla, con el resumen de valores como nombre. -->
<div role="img" aria-label="{title}. {summary}" class={cn('flex h-36 items-end gap-2.5 pt-3', className)}>
	{#each data as d, i (d.label)}
		{@const last = i === data.length - 1}
		<div class="flex h-full flex-1 flex-col items-center justify-end gap-1.5" aria-hidden="true">
			<span class="text-[11px] font-semibold leading-none tabular-nums text-ink-muted">{d.value}</span>
			<span
				class={cn('block w-full rounded-t-lg rounded-b-[4px] bg-accent', !(highlightLast && last) && 'opacity-40')}
				style="height:{Math.max(4, (d.value / max) * 78)}%"
			></span>
			<span class="text-[11px] leading-none text-ink-muted">{d.label}</span>
		</div>
	{/each}
</div>
