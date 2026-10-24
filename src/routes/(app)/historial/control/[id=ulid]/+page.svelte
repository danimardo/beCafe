<script lang="ts">
	import { resolve } from '$app/paths';
	import { Banner, BackLink, EmptyState, ListRow, Money, PageHeader, Section } from '#lib/ui';
	import { formatDate } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const etiqueta = $derived(data.registro.tipo === 'arqueo' ? textos.historial.etiquetas.arqueo : textos.historial.etiquetas.recuento);
</script>

<svelte:head>
	<title>{textos.historial.control.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/historial')} label={textos.historial.titulo} />
	<PageHeader title={`${etiqueta} · ${formatDate(data.registro.fecha)}`} />

	{#if data.registro.anulado}
		<Banner tone="info">
			{textos.historial.anulado}{data.registro.motivo ? `: ${data.registro.motivo}` : ''}
		</Banner>
	{/if}

	<Section title={textos.historial.control.titulo}>
		<dl class="flex flex-col gap-2 text-[15px]">
			<div class="flex justify-between gap-4">
				<dt class="text-ink-muted">{textos.historial.anuladoPor}</dt>
				<dd>{data.registro.autorNombre ?? ''}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-ink-muted">{etiqueta}</dt>
				<dd><Money cents={data.registro.diferencia} signed tone /></dd>
			</div>
		</dl>
	</Section>

	<Section title={textos.historial.control.reparto}>
		{#if data.registro.repartos.length === 0}
			<EmptyState momento="vacio-movimientos" title={textos.historial.control.sinReparto} />
		{:else}
			<ul class="flex flex-col">
				{#each data.registro.repartos as reparto (reparto.usuarioId)}
					<ListRow title={reparto.nombre}>
						{#snippet trailing()}
							<Money cents={reparto.importe} signed tone />
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
	</Section>
</div>
