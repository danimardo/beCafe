<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Banner, BackLink, Button, PageHeader, Section, TextField } from '#lib/ui';
	import { formatDate } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errores = $derived(form && 'errores' in form && form.errores ? form.errores : {});
	const anulado = $derived(data.relleno.estado === 'anulado' || (form !== null && 'anulado' in form));
	const mensajeGeneral = $derived.by(() => {
		if (!('general' in errores)) return undefined;
		return errores.general.codigo === 'FUERA_DE_PLAZO' ? textos.rellenos.fueraDePlazo : errores.general.mensaje;
	});
</script>

<svelte:head>
	<title>{textos.rellenos.detalle} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)/historial')} label={textos.historial.titulo} />
	<PageHeader title={textos.rellenos.detalle} bell={false} />

	{#if mensajeGeneral}
		<div role="alert"><Banner tone="negative">{mensajeGeneral}</Banner></div>
	{/if}
	{#if form && 'anulado' in form}
		<div role="status"><Banner tone="info">{textos.rellenos.anuladoOk}</Banner></div>
	{/if}

	<Section title={textos.rellenos.detalle}>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
			<dt class="text-ink-muted">{textos.rellenos.registradoPor}</dt>
			<dd>{data.relleno.nombre}{data.relleno.esPropio ? ` ${textos.rellenos.tu}` : ''}</dd>
			<dt class="text-ink-muted">{textos.rellenos.fecha}</dt>
			<dd>{formatDate(data.relleno.registradoEn, true)}</dd>
			<dt class="text-ink-muted">{textos.rellenos.estado}</dt>
			<dd>{anulado ? textos.rellenos.anulado : textos.rellenos.vigente}</dd>
			{#if data.relleno.motivo}
				<dt class="text-ink-muted">{textos.rellenos.motivo}</dt>
				<dd>{data.relleno.motivo}</dd>
			{/if}
		</dl>
		<p class="mt-3 text-[14px] text-ink-muted">{textos.rellenos.noMueveDinero}</p>
	</Section>

	{#if !anulado && data.relleno.puedeAnular}
		<form method="post" action="?/anular" use:enhance class="flex flex-col gap-4">
			<TextField label={textos.rellenos.anularMotivo} name="motivo" error={'motivo' in errores ? errores.motivo.mensaje : undefined} />
			<Button type="submit" variant="soft">{textos.rellenos.anular}</Button>
		</form>
	{/if}
</main>
