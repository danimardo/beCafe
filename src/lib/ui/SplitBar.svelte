<script lang="ts">
	import { estiloColorCapsula } from './utils';

	type Props = {
		segments: { label: string; value: number; color: string }[];
		/** Nombre accesible, p. ej. «Tus cápsulas favoritas». */
		title: string;
	};
	let { segments, title }: Props = $props();
	const total = $derived(segments.reduce((a, s) => a + s.value, 0) || 1);
	const summary = $derived(segments.map((s) => `${s.label} ${s.value}`).join(', '));
</script>

<div>
	<div role="img" aria-label="{title}. {summary}" class="my-3 flex h-3.5 gap-0.5 overflow-hidden rounded-full">
		{#each segments as s (s.label)}
			<span class="block h-full" style="flex:{s.value / total};{estiloColorCapsula(s.color)};background:var(--cap-color)"></span>
		{/each}
	</div>
	<!-- La leyenda repite los datos en texto: el color no es la única señal. -->
	<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] leading-[18px] text-ink-muted">
		{#each segments as s (s.label)}
			<li class="flex items-center gap-1.5">
				<span
					aria-hidden="true"
					class="size-2.5 rounded-full ring-1 ring-black/10"
					style="{estiloColorCapsula(s.color)};background:var(--cap-color)"
				></span>
				{s.label} <span class="font-semibold text-ink tabular-nums">{s.value}</span>
			</li>
		{/each}
	</ul>
</div>
