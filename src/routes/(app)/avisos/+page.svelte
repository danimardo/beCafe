<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { BackLink, EmptyState, PageHeader, Section } from '#lib/ui';
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
		{#if data.nuevos.length > 0}
			<Section title={textos.notificaciones.panel.nuevos(data.nuevos.length)}>
				{@render lista(data.nuevos)}
			</Section>
		{/if}
		{#if data.anteriores.length > 0}
			<Section title={textos.notificaciones.panel.anteriores}>
				{@render lista(data.anteriores)}
			</Section>
		{/if}
	{/if}

	<p class="text-[13px] text-ink-muted">{textos.notificaciones.panel.retencion}</p>
	<a class="text-[15px] text-accent underline" href={resolve('/(app)/perfil')}>{textos.notificaciones.panel.ajustes}</a>
</div>

{#snippet lista(avisos: PageProps['data']['nuevos'])}
	<ul class="flex flex-col gap-3">
		{#each avisos as aviso (aviso.id)}
			<li class="rounded-panel border border-hairline bg-wall-base p-4">
				<p class="text-[15px] font-medium text-ink">{aviso.titulo}</p>
				<p class="text-[14px] leading-5 text-ink">{aviso.texto}</p>
				<p class="mt-1 text-[13px] text-ink-muted">{aviso.cuando}</p>
			</li>
		{/each}
	</ul>
{/snippet}
