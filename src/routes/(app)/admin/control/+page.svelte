<script lang="ts">
	import { enhance } from '$app/forms';
	import { SvelteSet } from 'svelte/reactivity';
	import { Banner, Button, Money, MoneyField, PageHeader, PasswordField, Section, TextField } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import { parseMoney } from '#lib/shared/dinero';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);

	const errorGeneral = $derived(errores.general?.mensaje);
	const errorContrasena = $derived(errores.contrasenaActual?.mensaje);
	const errorMotivo = $derived(errores.motivo?.mensaje);
	const confirmacion = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
	const previsionArqueo = $derived(form && 'previsionArqueo' in form ? form.previsionArqueo : undefined);
	// Importe contado que volvió con la vista previa; sin JavaScript el campo se vuelve a rellenar con él.
	const contadoEscrito = $derived(form && 'contado' in form && typeof form.contado === 'string' ? parseMoney(form.contado) : null);
	const previsionRecuento = $derived(form && 'previsionRecuento' in form ? form.previsionRecuento : undefined);

	// Solo se anula el último arqueo vigente y la última línea vigente de cada tipo (CA-064). El servidor lo vuelve a comprobar.
	const ultimoArqueoVigente = $derived(data.arqueos.find((arqueo) => arqueo.estado === 'vigente'));
	const lineasAnulables = $derived.by(() => {
		const vistos = new SvelteSet<string>();
		return data.lineasRecuento.filter((linea) => {
			if (linea.estado !== 'vigente' || vistos.has(linea.tipoCapsulaId)) return false;
			vistos.add(linea.tipoCapsulaId);
			return true;
		});
	});
	const nombreTipo = (id: string) => data.tipos.find((tipo) => tipo.id === id)?.nombre ?? '';
</script>

<svelte:head>
	<title>{textos.economia.control} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
	<PageHeader title={textos.economia.control} />

	{#if confirmacion}
		<div role="status"><Banner tone="info">{confirmacion}</Banner></div>
	{/if}
	{#if errorGeneral}
		<div role="alert"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}

	<Section title={textos.economia.hucha}>
		<p class="text-[15px]">
			{textos.economia.saldoTeorico}: <Money cents={data.saldoTeorico} signed />
		</p>
	</Section>

	<!-- Arqueo: vista previa y confirmación en dos pasos (funciona sin JavaScript). -->
	<Section title={textos.economia.vistaArqueo}>
		<form
			method="post"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
			class="flex flex-col gap-4"
		>
			<MoneyField label={textos.economia.contadoEnHucha} name="contado" cents={contadoEscrito} error={errores.contado?.mensaje} />
			<input type="hidden" name="saldoTeoricoPrevisto" value={previsionArqueo?.saldoTeorico ?? ''} />
			<input type="hidden" name="contadoPrevisto" value={previsionArqueo?.contado ?? ''} />
			{#if previsionArqueo}
				<dl class="grid grid-cols-2 gap-2 text-[15px]">
					<dt>{textos.economia.efectoArqueo}</dt>
					<dd><Money cents={previsionArqueo.diferencia} signed /></dd>
					<dt>{textos.economia.parteMinimaMaxima}</dt>
					<dd><Money cents={previsionArqueo.parteMinima} /> / <Money cents={previsionArqueo.parteMaxima} /></dd>
				</dl>
				<PasswordField label={textos.economia.contrasenaParaControl} name="contrasenaActual" error={errorContrasena} />
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button type="submit" variant="soft" formaction="?/previsualizarArqueo">{textos.economia.verEfecto}</Button>
				{#if previsionArqueo}
					<Button type="submit" formaction="?/confirmarArqueo">{textos.economia.confirmarArqueo}</Button>
				{/if}
			</div>
		</form>
	</Section>

	{#if data.arqueos.length === 0}
		<p class="text-[15px] text-ink-muted">{textos.economia.sinArqueos}</p>
	{:else}
		<Section title={textos.economia.arqueo}>
			<ul class="flex flex-col gap-2 text-[15px]">
				{#each data.arqueos as arqueo (arqueo.id)}
					<li class="flex flex-wrap items-center justify-between gap-2">
						<span>{arqueo.realizadoEn.slice(0, 16).replace('T', ' ')} UTC · <Money cents={arqueo.diferencia} signed /></span>
						<span>{arqueo.estado === 'anulado' ? textos.economia.controlAnulado : ''}</span>
					</li>
				{/each}
			</ul>
			{#if ultimoArqueoVigente}
				<form method="post" use:enhance action="?/anularArqueo" class="mt-4 flex flex-col gap-3">
					<input type="hidden" name="id" value={ultimoArqueoVigente.id} />
					<TextField label={textos.economia.motivoAnulacion} name="motivo" error={errorMotivo} />
					<PasswordField label={textos.economia.contrasenaParaControl} name="contrasenaActual" error={errorContrasena} />
					<Button type="submit" variant="danger">{textos.economia.anularArqueoBoton}</Button>
				</form>
			{:else}
				<p class="mt-2 text-[15px] text-ink-muted">{textos.economia.sinArqueoVigente}</p>
			{/if}
		</Section>
	{/if}

	<!-- Recuento: una línea por tipo. Igual que el arqueo, primero se ve el efecto. -->
	<Section title={textos.economia.vistaRecuento}>
		<form
			method="post"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
			class="flex flex-col gap-4"
		>
			{#each data.tipos as tipo, indice (tipo.id)}
				<fieldset class="flex flex-col gap-2 rounded-lg border border-line p-3">
					<legend class="px-1 text-[15px] font-medium">{tipo.nombre}</legend>
					<input type="hidden" name="tipoCapsulaId" value={tipo.id} />
					<input type="hidden" name="registradoPrevisto" value={tipo.stock} />
					<TextField label={textos.economia.contadoEnUnidades} name="contado" inputmode="numeric" value={String(tipo.stock)} />
					{#if previsionRecuento?.[indice]}
						<p class="text-[15px]">{textos.economia.efectoRecuento}: <Money cents={previsionRecuento[indice].diferencia} signed /></p>
					{/if}
				</fieldset>
			{/each}
			{#if previsionRecuento}
				<PasswordField label={textos.economia.contrasenaParaControl} name="contrasenaActual" error={errorContrasena} />
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button type="submit" variant="soft" formaction="?/previsualizarRecuento">{textos.economia.verEfecto}</Button>
				{#if previsionRecuento}
					<Button type="submit" formaction="?/confirmarRecuento">{textos.economia.confirmarRecuento}</Button>
				{/if}
			</div>
		</form>
	</Section>

	{#if lineasAnulables.length > 0}
		<Section title={textos.economia.recuento}>
			{#each lineasAnulables as linea (linea.id)}
				<form method="post" use:enhance action="?/anularRecuento" class="flex flex-col gap-3">
					<input type="hidden" name="id" value={linea.id} />
					<p class="text-[15px]">{nombreTipo(linea.tipoCapsulaId)} · {linea.realizadoEn.slice(0, 16).replace('T', ' ')} UTC</p>
					<TextField label={textos.economia.motivoAnulacion} name="motivo" error={errorMotivo} />
					<PasswordField label={textos.economia.contrasenaParaControl} name="contrasenaActual" error={errorContrasena} />
					<Button type="submit" variant="danger">{textos.economia.anularLineaBoton}</Button>
				</form>
			{/each}
		</Section>
	{/if}
</main>
