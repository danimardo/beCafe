<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Banner, BackLink, Button, Money, PageHeader, Section, TextField } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);

	const errorMotivo = $derived(errores.motivo?.mensaje);
	const confirmacion = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
	const anulada = $derived(data.aportacion.estado === 'anulado' || (form !== null && 'anulada' in form));
</script>

<svelte:head>
	<title>{textos.economia.detalleAportacion} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)/saldos')} label={textos.economia.saldos} />
	<PageHeader title={textos.economia.detalleAportacion} />

	{#if confirmacion}
		<div role="status"><Banner tone="info">{confirmacion}</Banner></div>
	{/if}

	<Section title={textos.economia.importe}>
		<p class="text-2xl font-semibold"><Money cents={data.aportacion.importe} /></p>
		<p class="text-sm text-ink-muted">{data.aportacion.registradaEn.slice(0, 16).replace('T', ' ')} UTC</p>
		{#if anulada}
			<p class="font-semibold">{textos.economia.aportacionAnulada}</p>
		{/if}
	</Section>

	{#if !anulada}
		<form method="post" action="?/anular" use:enhance class="flex flex-col gap-4">
			<TextField label={textos.economia.motivoAnulacion} name="motivo" rows={2} error={errorMotivo} required />
			<Button type="submit" variant="danger">{textos.economia.anularAportacion}</Button>
		</form>
	{/if}
</main>
