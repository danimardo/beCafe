<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import {
		Avatar,
		Banner,
		Button,
		EmptyState,
		ListRow,
		Money,
		MoneyField,
		PanelGrid,
		PageHeader,
		Section,
		SelectField,
		usarMascota,
	} from '#lib/ui';
	import { formatMoney, formatMoneyPlain } from '#lib/shared/dinero';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const mascota = usarMascota();
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);
	let importe = $state<number | null>(null);

	// Tras un rechazo, el servidor devuelve los errores por campo (constitución XVII). El formulario también funciona sin JavaScript.
	const errorImporte = $derived(errores.importe?.mensaje);
	const confirmacion = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
	const errorGeneral = $derived(errores.general?.mensaje ?? errores.beneficiarioId?.mensaje);
	// RF-200: el administrador elige para quién es la aportación; «Yo» por defecto.
	const opcionesPara = $derived([
		{ value: '', label: textos.economia.paraYo },
		...data.saldos.filter((persona) => !persona.esPropia).map((persona) => ({ value: persona.usuarioId, label: persona.nombre })),
	]);
</script>

<svelte:head>
	<title>{textos.economia.saldos} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.economia.saldos} />

	{#if confirmacion}
		<div role="status">
			<Banner tone="info">{confirmacion}</Banner>
		</div>
	{/if}
	{#if errorGeneral}
		<div role="alert"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}

	<PanelGrid>
		{#snippet resumen()}
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
		{/snippet}

		{#snippet principal()}
			<Section title={textos.economia.aportar} class="mt-0">
				<form
					method="post"
					action="?/aportar"
					use:enhance={() =>
						async ({ update }) => {
							await update();
							if (form && 'confirmacion' in form) {
								const frase = mascota.elegirFrase('aportacion.confirmada');
								if (frase.conAudio) mascota.hablar(frase.id);
							}
						}}
					class="flex flex-col gap-3 sm:flex-row sm:items-end"
				>
					<input type="hidden" name="clienteId" value={data.clienteId} />
					{#if data.esAdministrador}
						<SelectField
							class="sm:w-56"
							label={textos.economia.para}
							name="beneficiarioId"
							options={opcionesPara}
							hint={textos.economia.ayudaPara}
						/>
					{/if}
					<MoneyField class="sm:w-56" label={textos.economia.importe} name="importe" bind:cents={importe} error={errorImporte} required />
					<Button type="submit" class="sm:min-w-40">{textos.economia.aportar}</Button>
				</form>
			</Section>

			<Section title={textos.historial.saldosTitulo}>
				{#if data.saldos.length === 0}
					<EmptyState momento="vacio-movimientos" title={textos.historial.sinSaldos} />
				{:else}
					<ul class="flex flex-col">
						{#each data.saldos as persona (persona.usuarioId)}
							<ListRow
								title={persona.esPropia ? `${persona.nombre} ${textos.historial.tuMarca}` : persona.nombre}
								subtitle={textos.economia.aportado(formatMoney(persona.totalAportado))}
								href={resolve('/(app)/saldos/personas/[usuarioId=ulid]', { usuarioId: persona.usuarioId })}
							>
								{#snippet leading()}<Avatar name={persona.nombre} usuarioId={persona.usuarioId} fotoUrl={persona.fotoUrl} />{/snippet}
								{#snippet trailing()}
									<Money cents={persona.saldo} signed tone srSuffix={persona.saldo >= 0 ? textos.economia.aFavor : textos.economia.debes} />
								{/snippet}
							</ListRow>
						{/each}
					</ul>
				{/if}
				<form method="get" action={resolve('/(app)/historial')}>
					<input type="hidden" name="quien" value="mios" />
					<button type="submit" class="text-accent underline">{textos.economia.misMovimientos}</button>
				</form>
			</Section>

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
		{/snippet}

		{#snippet secundario()}
			<Section title={textos.historial.ultimos}>
				{#if data.recientes.length === 0}
					<p class="text-sm text-ink-muted">{textos.historial.vacio}</p>
				{:else}
					<ul class="flex flex-col">
						{#each data.recientes as fila (fila.tipo + fila.id)}
							<ListRow
								title={[fila.etiqueta, fila.persona].filter(Boolean).join(' · ')}
								subtitle={fila.anulado ? textos.historial.anulado : undefined}
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
				<a href={resolve('/(app)/historial')} class="text-accent underline">{textos.historial.verHistorial}</a>
			</Section>
		{/snippet}
	</PanelGrid>
</div>
