<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { name: string; description?: string; children: Snippet };
	let { name, description, children }: Props = $props();
</script>

<!-- Muestra de un componente sobre su propio fondo, para que el cristal se vea igual en cualquier sitio. -->
<section id={name} aria-labelledby="{name}-h" class="mb-8">
	<h2 id="{name}-h" class="type-title-lg">{name}</h2>
	{#if description}<p class="mb-3 mt-1 max-w-2xl text-[14px] leading-[19px] text-ink-muted">{description}</p>{/if}
	<div data-specimen={name} class="wall-blobs rounded-sheet p-6">
		{@render children()}
	</div>
</section>
