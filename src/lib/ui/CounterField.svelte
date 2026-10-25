<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { cn } from './utils';

	type Props = {
		/** Etiqueta del campo numérico (p. ej. «Cantidad de Lungo»). */
		label: string;
		/** Nombre del campo al enviar sin JavaScript. */
		name?: string;
		/** Cantidad actual (bindable). */
		value?: number;
		min?: number;
		max?: number;
		/** Nombres accesibles de los botones «−» y «+». */
		decreaseLabel: string;
		increaseLabel: string;
		class?: string;
	};
	let { label, name, value = $bindable(0), min = 0, max = 999, decreaseLabel, increaseLabel, class: className }: Props = $props();

	const uid = $props.id();
	const id = `c-${uid}`;
	const limitar = (n: number) => Math.min(max, Math.max(min, Math.trunc(n)));
</script>

<!-- Contador de 0 a 999 (RF-197): «−» y «+» de 44 × 44 px y la cifra escrita. Sin JavaScript solo funciona el campo. -->
<div class={cn('flex items-center gap-2', className)}>
	<button
		type="button"
		aria-label={decreaseLabel}
		aria-controls={id}
		disabled={value <= min}
		onclick={() => (value = limitar(value - 1))}
		class="inline-flex size-[44px] shrink-0 items-center justify-center rounded-full border border-ink-muted/75 bg-wall-base text-ink active:scale-95 motion-safe:transition disabled:opacity-50"
	>
		<Minus class="size-5" aria-hidden="true" />
	</button>
	<label for={id} class="sr-only">{label}</label>
	<input
		{id}
		{name}
		type="number"
		inputmode="numeric"
		{min}
		{max}
		step="1"
		{value}
		oninput={(evento) => {
			const n = Number(evento.currentTarget.value);
			value = Number.isFinite(n) ? limitar(n) : min;
		}}
		class="min-h-[44px] w-16 rounded-chip border border-ink-muted/75 bg-wall-base text-center text-[17px] font-semibold tabular-nums text-ink"
	/>
	<button
		type="button"
		aria-label={increaseLabel}
		aria-controls={id}
		disabled={value >= max}
		onclick={() => (value = limitar(value + 1))}
		class="inline-flex size-[44px] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent active:scale-95 motion-safe:transition disabled:opacity-50"
	>
		<Plus class="size-5" aria-hidden="true" />
	</button>
</div>
