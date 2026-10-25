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
	const errorGeneral = $derived(errores.general?.mensaje);
	const confirmacion = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
	// Tras anular, el servidor devuelve el resumen por persona; si no, se muestran las regularizaciones ya guardadas.
	const regularizaciones = $derived.by(() => {
		if (form && 'resumen' in form && form.resumen) {
			return form.resumen.map((fila) => ({ usuario: 'usuario' in fila ? fila.usuario : '', importe: fila.importe }));
		}
		return data.compra.regularizaciones;
	});
	const anulada = $derived(data.compra.estado === 'anulado' || (form !== null && 'anulada' in form));
</script>

<svelte:head>
	<title>{textos.economia.detalleCompra} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/compras')} label={textos.economia.compras} />
	<PageHeader title={textos.economia.detalleCompra} />

	{#if confirmacion}
		<div role="status"><Banner tone="info">{confirmacion}</Banner></div>
	{/if}
	{#if errorGeneral}
		<div role="alert"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
		<Section class="mt-0" title={data.compra.autor}>
			<p class="text-sm text-ink-muted">{data.compra.fecha.slice(0, 16).replace('T', ' ')} UTC</p>
			<ul class="flex flex-col gap-1 text-[15px]">
				{#each data.compra.lineas as linea, indice (indice)}
					<li class="flex justify-between gap-3">
						<span>{linea.tipo} · {linea.cantidad}</span>
						<Money cents={linea.importe} />
					</li>
				{/each}
			</ul>
			<p class="font-semibold">{textos.economia.total}: <Money cents={data.compra.importe} /></p>
			{#if data.compra.tieneFoto}
				<img src={`/fotos/compras/${data.compra.id}`} alt={textos.economia.fotoTicket} class="max-h-72 rounded-card" />
			{/if}
			{#if anulada}
				<p class="font-semibold">{textos.economia.compraAnulada}</p>
			{/if}
		</Section>

		<div class="flex flex-col gap-6">
			{#if regularizaciones.length > 0}
				<Section class="mt-0" title={textos.economia.regularizaciones}>
					<ul class="flex flex-col gap-1 text-[15px]">
						{#each regularizaciones as fila, indice (indice)}
							<li class="flex justify-between gap-3">
								<span>{fila.usuario}</span>
								<Money cents={fila.importe} signed tone />
							</li>
						{/each}
					</ul>
				</Section>
			{/if}

			{#if !anulada}
				<form method="post" action="?/anular" use:enhance class="flex max-w-md flex-col gap-4">
					<TextField label={textos.economia.motivoAnulacion} name="motivo" rows={2} error={errorMotivo} required />
					<Button type="submit" variant="danger" class="self-start">{textos.economia.anularCompra}</Button>
				</form>
			{/if}
		</div>
	</div>
</div>
