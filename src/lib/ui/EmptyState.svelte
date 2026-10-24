<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MomentoId } from '#lib/shared/mascota/momentos';
	import Capsulito from './Capsulito.svelte';

	type Props = {
		title: string;
		description?: string;
		/** Icono Lucide: se ve si no hay `momento` o si la persona ha desactivado la mascota. */
		icon?: Snippet;
		/** Capsulito en lugar del icono (vacíos de Inicio, Saldos, Compras, Historial, Estadísticas y Avisos). */
		momento?: MomentoId;
		action?: Snippet;
	};
	let { title, description, icon, momento, action }: Props = $props();
</script>

{#snippet iconCircle()}
	{#if icon}
		<span class="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
{/snippet}

<div class="flex flex-col items-center gap-3 px-6 py-10 text-center">
	{#if momento}
		<Capsulito {momento} mensaje={null} size="md" fallback={iconCircle} />
	{:else}
		{@render iconCircle()}
	{/if}
	<h2 class="type-title">{title}</h2>
	{#if description}<p class="max-w-xs text-[15px] leading-5 text-ink-muted">{description}</p>{/if}
	{#if action}<div class="mt-1">{@render action()}</div>{/if}
</div>
