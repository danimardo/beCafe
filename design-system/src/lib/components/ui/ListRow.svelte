<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils';

	type Props = {
		title: string;
		subtitle?: string;
		leading?: Snippet;
		trailing?: Snippet;
		/** Si se indica, la fila entera es un enlace. */
		href?: string;
		/** Si se indica (y no hay href), la fila entera es un botón. */
		onclick?: () => void;
		/** Registro anulado: texto tachado y atenuado (RN-062). */
		voided?: boolean;
		/** En móvil, el contenido de la derecha pasa a una segunda línea (útil con acciones). */
		stackTrailing?: boolean;
		class?: string;
	};
	let { title, subtitle, leading, trailing, href, onclick, voided = false, stackTrailing = false, class: className }: Props = $props();
	const base = $derived(cn('flex min-h-14 w-full items-center gap-3 py-2.5 text-left', stackTrailing && 'max-md:flex-wrap'));
</script>

{#snippet inner()}
	{#if leading}{@render leading()}{/if}
	<span class="min-w-0 flex-1">
		<span class={cn('block truncate text-[15px] font-semibold leading-5', voided && 'line-through opacity-70')}>{title}</span>
		{#if subtitle}<span class="block text-[13px] leading-[17px] text-ink-muted">{subtitle}</span>{/if}
	</span>
	{#if trailing}
		{#if stackTrailing}
			<span class="max-md:flex max-md:basis-full max-md:justify-end">{@render trailing()}</span>
		{:else}{@render trailing()}{/if}
	{/if}
{/snippet}

<!-- Se usa dentro de <ul class="divide-y divide-hairline"> -->
<li class={className}>
	{#if href}
		<a {href} class={base}>{@render inner()}</a>
	{:else if onclick}
		<button type="button" {onclick} class={base}>{@render inner()}</button>
	{:else}
		<div class={base}>{@render inner()}</div>
	{/if}
</li>
