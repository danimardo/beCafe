<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Banner, Button, ListRow, Money, MoneyField, PageHeader, Section } from '#lib/ui';
	import { formatMoneyPlain } from '#lib/shared/dinero';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);
	let importe = $state<number | null>(null);

	// Tras un rechazo, el servidor devuelve los errores por campo (constitución XVII). El formulario también funciona sin JavaScript.
	const errorImporte = $derived(errores.importe?.mensaje);
	const confirmacion = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
</script>

<svelte:head>
	<title>{textos.economia.saldos} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<PageHeader title={textos.economia.saldos} />

	{#if confirmacion}
		<div role="status">
			<Banner tone="info">{confirmacion}</Banner>
		</div>
	{/if}

	<Section title={textos.economia.tuSaldo}>
		<p class="text-2xl font-semibold">
			<Money cents={data.saldoPropio} signed tone srSuffix={data.saldoPropio >= 0 ? textos.economia.aFavor : textos.economia.debes} />
		</p>
	</Section>

	<Section title={textos.economia.hucha}>
		<p class="text-2xl font-semibold">
			<Money cents={data.hucha.saldo} tone srSuffix={data.hucha.saldo < 0 ? textos.economia.huchaNegativa : undefined} />
		</p>
		{#if data.hucha.ultimoArqueo}
			<p class="text-sm text-ink-muted">
				{textos.economia.ultimoArqueo}: {data.hucha.ultimoArqueo.realizadoEn.slice(0, 10)} · {formatMoneyPlain(
					data.hucha.ultimoArqueo.contado,
				)} €
			</p>
		{:else}
			<p class="text-sm text-ink-muted">{textos.economia.sinArqueo}</p>
		{/if}
	</Section>

	<form method="post" action="?/aportar" use:enhance class="flex flex-col gap-4">
		<input type="hidden" name="clienteId" value={data.clienteId} />
		<MoneyField label={textos.economia.importe} name="importe" bind:cents={importe} error={errorImporte} required />
		<Button type="submit">{textos.economia.aportar}</Button>
	</form>

	<Section title={textos.economia.misAportaciones}>
		{#if data.aportaciones.length === 0}
			<p class="text-sm text-ink-muted">{textos.economia.sinAportaciones}</p>
		{:else}
			<ul class="flex flex-col">
				{#each data.aportaciones as aportacion (aportacion.id)}
					<ListRow
						title={aportacion.registradaEn.slice(0, 10)}
						href={resolve('/(app)/saldos/aportaciones/[aportacionId=ulid]', { aportacionId: aportacion.id })}
					>
						{#snippet trailing()}
							<Money cents={aportacion.importe} signed tone />
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
	</Section>
</main>
