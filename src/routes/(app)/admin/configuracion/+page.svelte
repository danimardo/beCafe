<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Banner, Button, crearExito, Money, PageHeader, PasswordField, Section, TextField } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import { parsearLimite, tramos } from '#lib/shared/deuda/tramos';
	import { formatMoneyPlain } from '#lib/shared/dinero';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const exito = crearExito();

	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		form && 'errores' in form && form.errores ? form.errores : {},
	);
	const guardado = $derived(Boolean(form && 'guardado' in form));
	// Texto del límite (importe de la deuda). Los umbrales se recalculan al escribir (RN-074).
	// Valor inicial: la lectura no sigue a `data`, porque el campo es la fuente tras la edición.
	let limiteTexto = $state(untrack(() => formatMoneyPlain(data.valores.limiteDeudaCentimos)));
	const limiteCents = $derived(parsearLimite(limiteTexto));
	const umbrales = $derived(limiteCents === null ? null : tramos(limiteCents));
</script>

<svelte:head>
	<title>{textos.configuracion.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.configuracion.titulo} />

	{#if guardado}
		<Banner tone="info">{textos.configuracion.guardado}</Banner>
	{/if}

	<Section title={textos.configuracion.titulo}>
		<form
			method="post"
			action="?/guardar"
			use:enhance={() =>
				async ({ result, update }) => {
					await update();
					if (result.type === 'success') exito.marcar();
				}}
			class="grid gap-5 md:grid-cols-3 md:items-start"
		>
			<div class="flex flex-col gap-1">
				<TextField
					label={textos.configuracion.plazo}
					name="plazoAutoanulacionMin"
					inputmode="numeric"
					hint={textos.configuracion.plazoAyuda}
					value={String(data.valores.plazoAutoanulacionMin)}
					error={errores.plazoAutoanulacionMin?.mensaje}
				/>
				<p class="text-[13px] text-ink-muted">{data.ultimos.plazo_autoanulacion_min ?? textos.configuracion.sinCambios}</p>
			</div>

			<div class="flex flex-col gap-1">
				<TextField
					label={textos.configuracion.limite}
					name="limiteDeudaCentimos"
					inputmode="decimal"
					hint={textos.configuracion.limiteAyuda}
					bind:value={limiteTexto}
					error={errores.limiteDeudaCentimos?.mensaje}
					required
				/>
				<p class="text-[13px] text-ink-muted">{data.ultimos.limite_deuda_centimos ?? textos.configuracion.sinCambios}</p>
			</div>

			<div class="flex flex-col gap-1">
				<TextField
					label={textos.configuracion.intervalo}
					name="intervaloRellenosMin"
					inputmode="numeric"
					hint={textos.configuracion.intervaloAyuda}
					value={String(data.valores.intervaloRellenosMin)}
					error={errores.intervaloRellenosMin?.mensaje}
				/>
				<p class="text-[13px] text-ink-muted">{data.ultimos.intervalo_rellenos_min ?? textos.configuracion.sinCambios}</p>
			</div>

			<PasswordField
				class="md:col-span-3 md:max-w-sm"
				label={textos.configuracion.contrasena}
				name="contrasenaActual"
				hint={textos.configuracion.contrasenaAyuda}
				error={errores.contrasenaActual?.mensaje}
				autocomplete="current-password"
			/>

			<div class="md:col-span-3"><Button type="submit" success={exito.activo}>{textos.configuracion.guardar}</Button></div>
		</form>
	</Section>

	{#if umbrales}
		<Section title={textos.configuracion.tramos}>
			<ul class="flex flex-col gap-2 text-[15px]">
				<li>{textos.configuracion.tramoAviso}: <Money cents={umbrales.aviso} /></li>
				<li>{textos.configuracion.tramoFrecuente}: <Money cents={umbrales.frecuente} /></li>
				<li>{textos.configuracion.tramoDiario}: <Money cents={umbrales.diario} /></li>
			</ul>
		</Section>
	{/if}

	<p class="text-[15px]">
		<a class="text-accent underline" href={resolve('/(app)/admin')}>{textos.admin.titulo}</a>
	</p>
</div>
