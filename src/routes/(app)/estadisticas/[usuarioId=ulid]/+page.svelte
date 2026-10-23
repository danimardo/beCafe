<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import PanelEstadisticas from '../PanelEstadisticas.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.estadisticas.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)/estadisticas')} label={textos.estadisticas.titulo} />
	<PanelEstadisticas titulo={data.persona} resumen={data.resumen} consulta={data.consulta} consultaValida={data.consultaValida} />
</main>
