<script lang="ts">
	import { resolve } from '$app/paths';
	import { Banner, BackLink, Button, EmptyState, ListRow, Money, PageHeader, SelectField } from '#lib/ui';
	import { formatDate } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const opcionesQuien = [
		{ value: 'todo', label: textos.historial.quienTodo },
		{ value: 'mios', label: textos.historial.quienMios },
	];
	const opcionesTipo = [
		{ value: 'todos', label: textos.historial.tipoTodos },
		{ value: 'consumos', label: textos.historial.tipoConsumos },
		{ value: 'aportaciones', label: textos.historial.tipoAportaciones },
		{ value: 'compras', label: textos.historial.tipoCompras },
		{ value: 'control', label: textos.historial.tipoControl },
	];
</script>

<svelte:head>
	<title>{textos.historial.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)')} label={textos.consumos.inicio} />
	<PageHeader title={textos.historial.titulo} />

	{#if !data.consultaValida}
		<Banner tone="info">{textos.historial.avisoConsulta}</Banner>
	{/if}

	<form method="get" class="flex flex-col gap-4">
		<SelectField label={textos.historial.quien} name="quien" value={data.consulta.quien} options={opcionesQuien} />
		<SelectField label={textos.historial.tipo} name="tipo" value={data.consulta.tipo} options={opcionesTipo} />
		<label class="flex items-center gap-2 text-[15px]">
			<input type="checkbox" name="anulados" value="on" checked={data.consulta.anulados === 'on'} class="size-5 accent-accent" />
			{textos.historial.anulados}
		</label>
		<Button type="submit">{textos.historial.aplicar}</Button>
	</form>

	{#if data.filas.length === 0}
		<EmptyState title={textos.historial.vacio} />
	{:else}
		<ul class="flex flex-col">
			{#each data.filas as fila (fila.tipo + fila.id)}
				<ListRow
					title={[fila.etiqueta, fila.persona].filter(Boolean).join(' · ')}
					subtitle={[formatDate(fila.fecha), fila.anulado ? textos.historial.anulado : ''].filter(Boolean).join(' · ')}
					href={fila.enlace}
					voided={fila.anulado}
				>
					{#snippet trailing()}
						<Money cents={fila.importe} signed tone />
					{/snippet}
				</ListRow>
			{/each}
		</ul>
	{/if}

	<!-- La paginación es un `GET` que conserva los filtros con campos ocultos: funciona sin JavaScript (plan F5 D6). -->
	<nav class="flex items-center justify-between text-[15px]" aria-label={textos.historial.paginas}>
		{#if data.pagina > 1}
			<form method="get">
				<input type="hidden" name="quien" value={data.consulta.quien} />
				<input type="hidden" name="tipo" value={data.consulta.tipo} />
				{#if data.consulta.anulados === 'on'}<input type="hidden" name="anulados" value="on" />{/if}
				<button type="submit" name="pagina" value={data.pagina - 1} class="text-accent underline">{textos.historial.anterior}</button>
			</form>
		{:else}
			<span></span>
		{/if}
		<span class="text-ink-muted">{textos.historial.pagina} {data.pagina} / {data.paginas}</span>
		{#if data.pagina < data.paginas}
			<form method="get">
				<input type="hidden" name="quien" value={data.consulta.quien} />
				<input type="hidden" name="tipo" value={data.consulta.tipo} />
				{#if data.consulta.anulados === 'on'}<input type="hidden" name="anulados" value="on" />{/if}
				<button type="submit" name="pagina" value={data.pagina + 1} class="text-accent underline">{textos.historial.siguiente}</button>
			</form>
		{:else}
			<span></span>
		{/if}
	</nav>
</main>
