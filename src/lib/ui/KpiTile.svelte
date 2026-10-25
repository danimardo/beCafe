<script lang="ts">
	import type { Snippet } from 'svelte';
	import Glass from './Glass.svelte';
	import { cifraAnimada } from './movimiento';

	type Props = {
		label: string;
		value: string | Snippet;
		hint?: string;
		/** Número del modelo y su formato: la cifra pasa del valor anterior al nuevo y el lector recibe solo el final (RF-236). */
		numero?: { valor: number; formato: (n: number) => string };
	};
	let { label, value, hint, numero }: Props = $props();
	const cifra = cifraAnimada(() => numero?.valor ?? 0);
</script>

<Glass radius="tile" class="px-3 py-3">
	<p class="font-serif text-[22px] font-semibold leading-[26px] tracking-tight tabular-nums">
		{#if numero && cifra.animando}<span aria-hidden="true">{numero.formato(cifra.visible)}</span><span class="sr-only"
				>{numero.formato(numero.valor)}</span
			>{:else if typeof value === 'string'}{value}{:else}{@render value()}{/if}
	</p>
	<p class="text-[13px] leading-[18px] text-ink-muted">{label}</p>
	{#if hint}<p class="text-xs leading-4 text-ink-muted">{hint}</p>{/if}
</Glass>
