<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { BackLink, Badge, DosColumnas, EmptyState, PageHeader, Section } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
	const total = $derived(data.nuevos.length + data.anteriores.length);
</script>

<svelte:head>
	<title>{textos.notificaciones.panel.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)')} label={textos.notificaciones.panel.volver} />
	<PageHeader title={textos.notificaciones.panel.titulo} bell={false} />

	{#if total === 0}
		<EmptyState momento="vacio-avisos" title={textos.notificaciones.panel.vacio} />
	{:else}
		<!-- RF-261: pendientes a la izquierda, vistos a la derecha. -->
		<DosColumnas>
			{#snippet acciones()}
				<Section title={textos.notificaciones.panel.nuevos(data.nuevos.length)}>
					{#if data.nuevos.length > 0}
						{@render lista(data.nuevos, true)}
					{:else}
						<p class="text-[15px] text-ink-muted">{textos.notificaciones.panel.sinNuevos}</p>
					{/if}
				</Section>
			{/snippet}
			{#snippet listado()}
				<Section title={textos.notificaciones.panel.anteriores}>
					{#if data.anteriores.length > 0}
						{@render lista(data.anteriores, false)}
					{:else}
						<p class="text-[15px] text-ink-muted">{textos.notificaciones.panel.sinAnteriores}</p>
					{/if}
				</Section>
			{/snippet}
		</DosColumnas>
	{/if}

	<p class="text-[13px] text-ink-muted">{textos.notificaciones.panel.retencion}</p>
	<a class="text-[15px] text-accent underline" href={resolve('/(app)/perfil')}>{textos.notificaciones.panel.ajustes}</a>
</div>

{#snippet lista(avisos: PageProps['data']['nuevos'], pendientes: boolean)}
	<ul class="flex flex-col gap-3">
		{#each avisos as aviso (aviso.id)}
			<li class={['rounded-panel border p-4', pendientes ? 'border-accent bg-accent-soft' : 'border-hairline bg-wall-base']}>
				{#if pendientes}<Badge tone="accent">{textos.notificaciones.panel.etiquetaNuevo}</Badge>{/if}
				<p class="text-[15px] font-medium text-ink">{aviso.titulo}</p>
				<p class="text-[14px] leading-5 text-ink">{aviso.texto}</p>
				<p class="mt-1 text-[13px] text-ink-muted">{aviso.cuando}</p>
			</li>
		{/each}
	</ul>
{/snippet}
