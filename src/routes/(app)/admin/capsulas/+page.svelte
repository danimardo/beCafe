<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge, Button, CapsuleImage, EmptyState, ListRow, PageHeader, Section, StockBadge } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.capsulas.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.capsulas.titulo}>
		{#snippet actions()}
			<Button href={resolve('/(app)/admin/capsulas/nueva')}>{textos.capsulas.nuevo}</Button>
		{/snippet}
	</PageHeader>
	<p class="text-[15px] text-ink-muted">{textos.capsulas.ayuda}</p>

	{#if data.tipos.length === 0}
		<EmptyState momento="vacio-capsulas" title={textos.capsulas.vacio} description={textos.capsulas.vacioAyuda} />
	{:else}
		<Section>
			<ul class="flex flex-col">
				{#each data.tipos as tipo (tipo.id)}
					<ListRow
						title={tipo.nombre}
						subtitle={tipo.marca}
						href={resolve('/(app)/admin/capsulas/[capsulaId=ulid]', { capsulaId: tipo.id })}
						voided={tipo.estado === 'retirado'}
					>
						{#snippet leading()}
							<CapsuleImage name={tipo.nombre} color={tipo.color} photoUrl={tipo.fotoUrl} size="sm" />
						{/snippet}
						{#snippet trailing()}
							<span class="text-[14px] tabular-nums">{tipo.stock}</span>
							{#if tipo.enStockBajo}<StockBadge level={tipo.stock <= 0 ? 'out' : 'low'} />{/if}
							<Badge tone={tipo.estado === 'activo' ? 'positive' : 'neutral'}>
								{tipo.estado === 'activo' ? textos.capsulas.estadoActivo : textos.capsulas.estadoRetirado}
							</Badge>
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		</Section>
	{/if}
</div>
