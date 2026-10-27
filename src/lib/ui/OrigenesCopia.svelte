<script lang="ts">
	import Banner from './Banner.svelte';

	// Origen de la copia y origen del sistema en la confirmación de restaurar (RF-290). Presentacional: los textos llegan resueltos.
	type Props = {
		etiquetaCopia: string;
		origenCopia: string;
		etiquetaSistema: string;
		origenSistema: string;
		/** Texto del aviso cuando los orígenes difieren. Sin él, no se muestra aviso. */
		aviso?: string;
	};
	let { etiquetaCopia, origenCopia, etiquetaSistema, origenSistema, aviso }: Props = $props();
</script>

<dl class="flex max-w-xl flex-col gap-1 text-[15px]">
	<div class="flex gap-2">
		<dt class="font-semibold">{etiquetaCopia}:</dt>
		<dd>{origenCopia}</dd>
	</div>
	<div class="flex gap-2">
		<dt class="font-semibold">{etiquetaSistema}:</dt>
		<dd>{origenSistema}</dd>
	</div>
</dl>
{#if aviso}
	<!-- Texto e icono del aviso: el color no es la única señal (constitución XI). No impide restaurar. -->
	<Banner tone="warning" class="mt-3 max-w-xl">{aviso}</Banner>
{/if}
