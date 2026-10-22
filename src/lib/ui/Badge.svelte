<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils';

	type Props = {
		tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'warning';
		/** Icono opcional (componente de Lucide). Decorativo: el significado debe estar en el texto. */
		icon?: Snippet;
		class?: string;
		children: Snippet;
	};
	let { tone = 'neutral', icon, class: className, children }: Props = $props();
	const tones = {
		neutral: 'bg-accent-soft text-ink',
		accent: 'bg-accent-soft text-accent',
		positive: 'bg-positive-soft text-positive',
		negative: 'bg-negative-soft text-negative',
		warning: 'bg-warning-soft text-warning',
	};
</script>

<span class={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-4', tones[tone], className)}>
	{#if icon}<span class="inline-flex size-3.5 items-center justify-center" aria-hidden="true">{@render icon()}</span>{/if}
	{@render children()}
</span>
