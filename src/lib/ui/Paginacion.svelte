<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Button from './Button.svelte';

	type Props = {
		pagina: number;
		paginas: number;
		/** Nombre accesible del formulario. */
		etiqueta: string;
		anterior: string;
		siguiente: string;
		/** Ruta de destino; sin ella, la propia página. */
		action?: ResolvedPathname;
		/** Parámetros que se conservan al cambiar de página (por ejemplo, la vista elegida). */
		conservar?: Record<string, string>;
	};
	let { pagina, paginas, etiqueta, anterior, siguiente, action, conservar = {} }: Props = $props();
</script>

<!-- Paginación con un formulario GET (ARCHITECTURE.md §7): funciona igual sin JavaScript. -->
{#if paginas > 1}
	<form method="get" {action} aria-label={etiqueta} class="flex justify-between gap-3">
		{#each Object.entries(conservar) as [nombre, valor] (nombre)}
			<input type="hidden" name={nombre} value={valor} />
		{/each}
		{#if pagina > 1}
			<Button type="submit" variant="ghost" name="pagina" value={String(pagina - 1)}>{anterior}</Button>
		{:else}<span></span>{/if}
		{#if pagina < paginas}
			<Button type="submit" variant="ghost" name="pagina" value={String(pagina + 1)}>{siguiente}</Button>
		{/if}
	</form>
{/if}
