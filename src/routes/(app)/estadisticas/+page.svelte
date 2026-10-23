<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, SelectField } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import PanelEstadisticas from './PanelEstadisticas.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const opcionesPersona = $derived(data.personas.map((persona) => ({ value: persona.id, label: persona.nombre })));
</script>

<svelte:head>
	<title>{textos.estadisticas.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)')} label={textos.consumos.inicio} />
	<PanelEstadisticas
		titulo={textos.estadisticas.titulo}
		resumen={data.resumen}
		consulta={data.consulta}
		consultaValida={data.consultaValida}
	>
		{#snippet cabecera()}
			{#if data.personas.length > 0}
				<!-- Solo administradores: el selector envía `persona` y el servidor redirige a su pantalla (RF-123). -->
				<form method="get" class="flex flex-col gap-3">
					<SelectField label={textos.estadisticas.persona} name="persona" value="" options={opcionesPersona} />
					<button type="submit" class="self-start text-accent underline">{textos.estadisticas.aplicar}</button>
				</form>
			{/if}
		{/snippet}
	</PanelEstadisticas>
</main>
