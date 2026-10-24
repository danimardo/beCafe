<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils';

	type Props = {
		/** Resumen: lo primero que se lee (cifras, estado, Capsulito). Móvil: arriba. Escritorio: columna derecha, arriba. */
		resumen?: Snippet;
		/** Contenido principal: la acción de la pantalla (cápsulas, lista de saldos, gráficos). Móvil: en medio. Escritorio: columna izquierda ancha. */
		principal: Snippet;
		/** Secundario: lo que se consulta después (agua, últimos movimientos…). Móvil: al final. Escritorio: columna derecha, debajo del resumen. */
		secundario?: Snippet;
		class?: string;
	};
	let { resumen, principal, secundario, class: className }: Props = $props();
</script>

<!-- Rejilla de panel para AppShell width="panel" (RF-182, DEC-106).
     El ORDEN DEL DOM es el de móvil y el de lectura (resumen → principal → secundario); en ≥ lg solo cambia la colocación:
       ┌──────────────────────────┬──────────────┐
       │ principal                │ resumen      │
       │ (rejilla de cápsulas…)   ├──────────────┤
       │                          │ secundario   │
       └──────────────────────────┴──────────────┘ -->
<div
	class={cn(
		'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_24rem]',
		className,
	)}
>
	{#if resumen}
		<div class="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-1">{@render resumen()}</div>
	{/if}
	<div class="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">{@render principal()}</div>
	{#if secundario}
		<div class="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-2">{@render secundario()}</div>
	{/if}
</div>
