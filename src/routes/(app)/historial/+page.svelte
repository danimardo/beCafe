<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, EmptyState, ListRow, Money, PageHeader } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.consumos.historial} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)')} label={textos.consumos.inicio} />
	<PageHeader title={textos.consumos.historial} />

	{#if data.filas.length === 0}
		<EmptyState title={textos.consumos.sinHistorial} />
	{:else}
		<ul class="flex flex-col">
			{#each data.filas as consumo (consumo.id)}
				<ListRow
					title={`${consumo.tipo} · ${consumo.autor}`}
					subtitle={consumo.estado === 'anulado' ? `${consumo.hora} · ${textos.consumos.anulado}` : consumo.hora}
					href={resolve('/(app)/consumos/[consumoId=ulid]', { consumoId: consumo.id })}
					voided={consumo.estado === 'anulado'}
				>
					{#snippet trailing()}
						<Money cents={consumo.precio} />
					{/snippet}
				</ListRow>
			{/each}
		</ul>
	{/if}

	<nav class="flex justify-between text-[15px]" aria-label={textos.consumos.paginas}>
		{#if data.pagina > 1}
			<form method="get">
				<button type="submit" name="pagina" value={data.pagina - 1} class="text-accent underline">{textos.consumos.anterior}</button>
			</form>
		{:else}
			<span></span>
		{/if}
		{#if data.hayMas}
			<form method="get">
				<button type="submit" name="pagina" value={data.pagina + 1} class="text-accent underline">{textos.consumos.siguiente}</button>
			</form>
		{/if}
		{#if data.hayMas}
			<form method="get">
				<button type="submit" name="pagina" value={data.pagina + 1} class="text-accent underline">{textos.consumos.siguiente}</button>
			</form>
		{/if}
	</nav>
</main>
