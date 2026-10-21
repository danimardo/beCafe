<script lang="ts">
	import type { Snippet } from 'svelte';
	import Glass from '../ui/Glass.svelte';

	type Props = { label: string; value: string | Snippet; hint?: string };
	let { label, value, hint }: Props = $props();
</script>

<Glass radius="tile" class="px-3 py-3">
	<p class="font-serif text-[22px] font-semibold leading-[26px] tracking-tight tabular-nums">
		{#if typeof value === 'string'}{value}{:else}{@render value()}{/if}
	</p>
	<p class="text-[13px] leading-[18px] text-ink-muted">{label}</p>
	{#if hint}<p class="text-xs leading-4 text-ink-muted">{hint}</p>{/if}
</Glass>
