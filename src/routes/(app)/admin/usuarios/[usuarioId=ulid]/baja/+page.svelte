<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Banner, BackLink, Button, Money, PageHeader, PasswordField, Section, SelectField } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);

	const errorGeneral = $derived(errores.general?.mensaje);
	const errorContrasena = $derived(errores.contrasenaActual?.mensaje);
	const errorModo = $derived(errores.modo?.mensaje);
	const etiquetas: Record<string, string> = {
		ninguna: textos.economia.modoNinguna,
		pago: textos.economia.modoPago,
		incobrable: textos.economia.modoIncobrable,
		devolucion: textos.economia.modoDevolucion,
	};
	const opciones = $derived(data.modos.map((modo) => ({ value: modo, label: etiquetas[modo] ?? modo })));
	const hayDevolucion = $derived(data.modos.includes('devolucion'));
	const pendiente = $derived(data.estado !== 'baja');
	const prevision = $derived(form && 'prevision' in form ? form.prevision : undefined);
	const etiquetaModo = $derived(prevision ? (etiquetas[prevision.modo] ?? '') : '');
</script>

<svelte:head>
	<title>{textos.economia.darDeBaja} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<BackLink href={resolve('/(app)/admin/usuarios/[usuarioId=ulid]', { usuarioId: data.usuarioId })} label={textos.economia.volverFicha} />
	<PageHeader title={textos.economia.liquidacionBaja} eyebrow={data.nombre} />

	{#if errorGeneral}
		<div role="alert"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}

	<Section title={textos.economia.saldoDeLaPersona}>
		<p class="text-[15px]"><Money cents={data.saldo} signed /></p>
	</Section>

	{#if !pendiente}
		<Banner tone="info">{textos.economia.yaDeBaja}</Banner>
	{:else}
		<form method="post" action="?/baja" use:enhance class="flex flex-col gap-4">
			<input type="hidden" name="saldoPrevisto" value={data.saldo} />
			<SelectField
				label={textos.economia.modoBaja}
				name="modo"
				options={opciones}
				value={data.modos.length === 1 ? (data.modos[0] ?? '') : ''}
				error={errorModo}
			/>
			{#if hayDevolucion}
				<label class="flex items-start gap-3 text-[15px]">
					<input type="checkbox" name="confirmoHuchaNegativa" value="on" class="mt-1" />
					<span>{textos.economia.huchaNegativaBaja}</span>
				</label>
			{/if}
			<PasswordField
				label={textos.admin.contrasenaActual}
				name="contrasenaActual"
				autocomplete="current-password"
				error={errorContrasena}
			/>
			{#if prevision}
				<dl class="grid grid-cols-2 gap-2 text-[15px]">
					<dt>{textos.economia.efectoBaja}</dt>
					<dd>{etiquetaModo}</dd>
					<dt>{textos.economia.huchaDespues}</dt>
					<dd><Money cents={prevision.huchaDespues} signed /></dd>
					<dt>{textos.economia.reparteEntre}</dt>
					<dd>{prevision.personasReparto} · <Money cents={prevision.importeReparto} /></dd>
				</dl>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button type="submit" variant="soft" formaction="?/previsualizar">{textos.economia.verEfecto}</Button>
				{#if prevision}
					<Button type="submit" variant="danger">{textos.economia.confirmarBaja}</Button>
				{/if}
			</div>
		</form>
	{/if}
</main>
