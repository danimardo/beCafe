<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils';

	type Props = {
		/** Acciones y formularios. Van primero en el DOM, así que en móvil y en el orden de lectura van arriba. */
		acciones: Snippet;
		/** Listados e historial. En escritorio, columna derecha sobre otro fondo y con borde. */
		listado: Snippet;
		class?: string;
	};
	let { acciones, listado, class: className }: Props = $props();
</script>

<!-- Dos columnas para AppShell width="wide" o "panel" (RF-261). El ORDEN DEL DOM es el de móvil y el de lectura (acciones → listado);
     en ≥ lg se colocan lado a lado. Sin cristal: la columna del listado usa una superficie estable (constitución XVIII).
     Móvil: una columna, sin marco. -->
<div class={cn('flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8', className)}>
	<div class="flex min-w-0 flex-col gap-6 [&>section]:mt-0">{@render acciones()}</div>
	<div class="flex min-w-0 flex-col gap-6 lg:rounded-panel lg:border lg:border-hairline lg:bg-wall-raised lg:p-4 [&>section]:mt-0">
		{@render listado()}
	</div>
</div>
