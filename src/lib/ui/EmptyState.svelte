<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { title: string; description?: string; icon?: Snippet; action?: Snippet };
	let { title, description, icon, action }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 px-6 py-10 text-center">
	{#if icon}<span class="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true"
			>{@render icon()}</span
		>{/if}
	<h2 class="type-title">{title}</h2>
	{#if description}<p class="max-w-xs text-[15px] leading-5 text-ink-muted">{description}</p>{/if}
	{#if action}<div class="mt-1">{@render action()}</div>{/if}
</div>
