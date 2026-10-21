<script lang="ts">
	import type { Snippet } from 'svelte';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { cn } from '#lib/utils';

	type Props = {
		tone?: 'info' | 'warning' | 'negative' | 'offline';
		title?: string;
		class?: string;
		/** Acciones (botones o enlaces) bajo el texto. */
		actions?: Snippet;
		children?: Snippet;
	};
	let { tone = 'info', title, class: className, actions, children }: Props = $props();

	const tones = {
		info: 'bg-accent-soft text-ink',
		offline: 'bg-warning-soft text-ink',
		warning: 'bg-warning-soft text-ink',
		negative: 'bg-negative-soft text-ink'
	};
	const iconTone = { info: 'text-accent', offline: 'text-warning', warning: 'text-warning', negative: 'text-negative' };
</script>

<!-- negative usa role=alert (se anuncia al instante); el resto, role=status (se anuncia sin interrumpir). -->
<div
	role={tone === 'negative' ? 'alert' : 'status'}
	class={cn('glass flex gap-3 rounded-tile p-3.5', tones[tone], className)}
>
	<span class={cn('mt-0.5 shrink-0', iconTone[tone])} aria-hidden="true">
		{#if tone === 'offline'}<WifiOff class="size-5" />
		{:else if tone === 'warning'}<TriangleAlert class="size-5" />
		{:else if tone === 'negative'}<CircleAlert class="size-5" />
		{:else}<Info class="size-5" />{/if}
	</span>
	<div class="min-w-0 flex-1 text-[14px] leading-[19px]">
		{#if title}<p class="font-semibold">{title}</p>{/if}
		{#if children}<div class={title ? 'mt-0.5 text-ink-muted' : ''}>{@render children()}</div>{/if}
		{#if actions}<div class="mt-2 flex flex-wrap gap-2">{@render actions()}</div>{/if}
	</div>
</div>
