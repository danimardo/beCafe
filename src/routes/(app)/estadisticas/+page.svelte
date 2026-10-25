<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import PanelEstadisticas from './PanelEstadisticas.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.estadisticas.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)')} label={textos.consumos.inicio} />
	<PanelEstadisticas
		titulo={textos.estadisticas.titulo}
		subtitulo={textos.estadisticas.subtitulo}
		resumen={data.resumen}
		consulta={data.consulta}
		consultaValida={data.consultaValida}
	/>
</div>
