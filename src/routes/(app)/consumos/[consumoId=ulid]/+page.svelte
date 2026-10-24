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
	const errorGeneral = $derived(errores.general);
	// CA-062: un miembro que no puede anular recibe el texto que lo deriva a un administrador.
	const mensajeGeneral = $derived(
		errorGeneral ? (errorGeneral.codigo === 'SIN_PERMISO' ? textos.consumos.pideAdmin : errorGeneral.mensaje) : undefined,
	);
	const anulado = $derived(data.consumo.estado === 'anulado' || (form !== null && 'anulado' in form));
</script>

<svelte:head>
	<title>{textos.consumos.detalle} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)')} label={textos.consumos.inicio} />
	<PageHeader title={data.consumo.tipo} />

	{#if mensajeGeneral}
		<div role="alert"><Banner tone="negative">{mensajeGeneral}</Banner></div>
	{/if}

	<Section title={textos.consumos.detalle}>
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
			<dt class="text-ink-muted">{textos.consumos.autor}</dt>
			<dd>{data.consumo.autor}{data.consumo.invitado ? ` · ${textos.consumos.invitado}` : ''}</dd>
			<dt class="text-ink-muted">{textos.consumos.horaDelToque}</dt>
			<dd>{data.consumo.horaGesto}</dd>
			<dt class="text-ink-muted">{textos.consumos.horaDeRegistro}</dt>
			<dd>{data.consumo.horaRegistro}</dd>
			<dt class="text-ink-muted">{textos.consumos.precio}</dt>
			<dd><Money cents={data.consumo.precio} /></dd>
			<dt class="text-ink-muted">{textos.consumos.estado}</dt>
			<dd>{anulado ? textos.consumos.anulado : textos.consumos.vigente}</dd>
		</dl>
	</Section>

	{#if anulado}
		<p class="text-[15px] text-ink-muted">
			{textos.consumos.motivo}: {data.consumo.motivoAnulacion ?? ''}
		</p>
	{:else}
		<form method="post" action="?/anular" use:enhance class="flex flex-col gap-4">
			<TextField label={textos.consumos.motivo} name="motivo" error={errorMotivo} />
			<Button type="submit" variant="soft">{textos.consumos.anular}</Button>
		</form>
	{/if}
</div>
