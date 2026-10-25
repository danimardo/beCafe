<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, EmptyState, ListRow, Money, PageHeader, Paginacion, Section } from '#lib/ui';
	import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const ruta = $derived(resolve('/(app)/saldos/personas/[usuarioId=ulid]', { usuarioId: data.usuarioId }));
</script>

<svelte:head>
	<title>{textos.economia.aportacionesDe(data.nombre)} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/saldos')} label={textos.economia.saldos} />
	<PageHeader title={textos.economia.aportacionesDe(data.nombre)} />

	<Section title={textos.economia.totalAportado}>
		<p class="text-2xl font-semibold"><Money cents={data.totalAportado} /></p>
	</Section>

	<Section title={textos.economia.aportaciones}>
		{#if data.filas.length === 0}
			<EmptyState momento="vacio-movimientos" title={textos.economia.sinAportacionesPersona} />
		{:else}
			<ul class="flex flex-col">
				{#each data.filas as fila (fila.id)}
					<ListRow
						title={formatearFechaHoraMadrid(fila.registradaEn)}
						subtitle={fila.estado === 'anulado'
							? `${textos.historial.anulado} · ${textos.economia.registradaPor(fila.registradaPorNombre)}`
							: textos.economia.registradaPor(fila.registradaPorNombre)}
						voided={fila.estado === 'anulado'}
					>
						{#snippet trailing()}
							<Money cents={fila.importe} />
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
		<Paginacion
			pagina={data.pagina}
			paginas={data.paginas}
			etiqueta={textos.economia.paginasAportaciones}
			anterior={textos.economia.masRecientes}
			siguiente={textos.economia.masAntiguas}
			action={ruta}
		/>
	</Section>
</div>
