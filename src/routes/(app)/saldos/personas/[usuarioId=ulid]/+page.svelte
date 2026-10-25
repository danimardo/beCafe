<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, Button, EmptyState, ListRow, Money, PageHeader, Section } from '#lib/ui';
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
		{#if data.paginas > 1}
			<!-- Paginación con un formulario GET (ARCHITECTURE.md §7): funciona igual sin JavaScript. -->
			<form method="get" action={ruta} aria-label={textos.economia.paginasAportaciones} class="flex justify-between gap-3">
				{#if data.pagina > 1}
					<Button type="submit" variant="ghost" name="pagina" value={String(data.pagina - 1)}>{textos.economia.masRecientes}</Button>
				{:else}<span></span>{/if}
				{#if data.pagina < data.paginas}
					<Button type="submit" variant="ghost" name="pagina" value={String(data.pagina + 1)}>{textos.economia.masAntiguas}</Button>
				{/if}
			</form>
		{/if}
	</Section>
</div>
