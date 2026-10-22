<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from './Button.svelte';

	type Props = {
		/** Página actual, empezando en 1. */
		page?: number;
		/** Número total de páginas. Con 1 o menos no se pinta nada. */
		pages: number;
		/** Nombre accesible de la navegación (p. ej. «Páginas del historial»). */
		label?: string;
		onchange?: (page: number) => void;
	};
	let { page = $bindable(1), pages, label = 'Paginación', onchange }: Props = $props();

	function go(p: number) {
		page = Math.min(Math.max(1, p), pages);
		onchange?.(page);
	}
</script>

{#if pages > 1}
	<nav aria-label={label} class="mt-3 flex flex-col items-center gap-2">
		<p class="text-[14px] leading-5 text-ink-muted" aria-live="polite">Página {page} de {pages}</p>
		<div class="grid w-full grid-cols-2 gap-3">
			<Button variant="soft" disabled={page <= 1} onclick={() => go(page - 1)}
				><ChevronLeft class="size-4" aria-hidden="true" /> Anterior</Button
			>
			<Button variant="soft" disabled={page >= pages} onclick={() => go(page + 1)}
				>Siguiente <ChevronRight class="size-4" aria-hidden="true" /></Button
			>
		</div>
	</nav>
{/if}
