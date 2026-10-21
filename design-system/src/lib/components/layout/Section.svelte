<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils';

	type Props = { title?: string; /** Acciones junto al título (p. ej. «Ver todo»). */ actions?: Snippet; class?: string; children: Snippet };
	let { title, actions, class: className, children }: Props = $props();
</script>

<section class={cn('mt-6', className)}>
	{#if title}
		<div class="mb-3 flex items-baseline justify-between gap-3">
			<h2 class="type-title-lg">{title}</h2>
			{#if actions}<div>{@render actions()}</div>{/if}
		</div>
	{/if}
	{@render children()}
</section>
