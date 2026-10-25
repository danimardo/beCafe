<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils';
	import { spotlight } from './movimiento';

	type Props = {
		title?: string;
		/** Acciones junto al título (p. ej. «Ver todo»). */ actions?: Snippet;
		/** Panel con borde y superficie algo más clara; el borde brilla alrededor del puntero fino (RF-231, RF-235). */
		panel?: boolean;
		class?: string;
		children: Snippet;
	};
	let { title, actions, panel = false, class: className, children }: Props = $props();
</script>

<section class={cn('mt-6', panel && 'mt-0 rounded-panel border border-hairline bg-wall-raised p-4', className)} use:spotlight={panel}>
	{#if title}
		<div class="mb-3 flex items-baseline justify-between gap-3">
			<h2 class="type-title-lg">{title}</h2>
			{#if actions}<div>{@render actions()}</div>{/if}
		</div>
	{/if}
	{@render children()}
</section>
