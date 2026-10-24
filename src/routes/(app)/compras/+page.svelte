<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import {
		Banner,
		Button,
		EmptyState,
		ListRow,
		Money,
		MoneyField,
		PageHeader,
		PhotoField,
		SelectField,
		Section,
		TextField,
		usarMascota,
	} from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import { parseMoney } from '#lib/shared/dinero';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const mascota = usarMascota();

	type LineaPrevia = { tipoCapsulaId: string; cantidad: string; importe: string };

	function esLineaPrevia(valor: unknown): valor is LineaPrevia {
		return (
			typeof valor === 'object' &&
			valor !== null &&
			'tipoCapsulaId' in valor &&
			'cantidad' in valor &&
			'importe' in valor &&
			typeof valor.tipoCapsulaId === 'string' &&
			typeof valor.cantidad === 'string' &&
			typeof valor.importe === 'string'
		);
	}

	// Las líneas escritas vuelven en `lineas` (añadir o quitar) o en `valores.lineas` (rechazo) para rellenar las filas sin JavaScript.
	function lineasPrevias(respuesta: typeof form): LineaPrevia[] {
		if (!respuesta) return [];
		const valores: unknown = 'valores' in respuesta ? respuesta.valores : undefined;
		const candidatas: unknown =
			'lineas' in respuesta
				? respuesta.lineas
				: typeof valores === 'object' && valores !== null && 'lineas' in valores
					? valores.lineas
					: undefined;
		const lista: unknown[] = Array.isArray(candidatas) ? candidatas : [];
		return lista.filter(esLineaPrevia);
	}

	function numeroLineasDeValores(valores: unknown): number | undefined {
		return typeof valores === 'object' && valores !== null && 'numeroLineas' in valores && typeof valores.numeroLineas === 'number'
			? valores.numeroLineas
			: undefined;
	}
	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);

	// Importes escritos en el cliente. Si no hay, se usa el de la respuesta del servidor (sin JavaScript o tras un rechazo).
	let importes = $state<(number | null)[]>([]);
	const previas = $derived(lineasPrevias(form));
	const importeDeFila = (indice: number): number | null => importes[indice] ?? parseMoney(previas[indice]?.importe ?? '');

	// Tras un rechazo, `valores` conserva las líneas escritas; sin esto la vista volvería a una sola línea.
	const numeroLineas = $derived(
		(form && 'numeroLineas' in form && typeof form.numeroLineas === 'number' ? form.numeroLineas : undefined) ??
			(form && 'valores' in form ? numeroLineasDeValores(form.valores) : undefined) ??
			data.numeroLineas,
	);
	const total = $derived(Array.from({ length: numeroLineas }, (_valor, indice) => importeDeFila(indice) ?? 0).reduce((a, b) => a + b, 0));
	const filas = $derived(Array.from({ length: numeroLineas }, (_valor, indice: number) => indice));
	const opciones = $derived(data.tipos.map((tipo) => ({ value: tipo.id, label: tipo.nombre })));
	const errorGeneral = $derived(errores.general?.mensaje);
	const codigo = $derived(errores.general?.codigo);
	const confirmacionPendiente = $derived(codigo === 'CONFIRMACION_REQUERIDA');
	const confirmacion = $derived(form && 'id' in form ? textos.economia.compraRegistrada : undefined);
</script>

<svelte:head>
	<title>{textos.economia.compras} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.economia.compras} />

	{#if confirmacion}
		<div role="status"><Banner tone="info">{confirmacion}</Banner></div>
	{/if}
	{#if errorGeneral}
		<div role="alert"><Banner tone={confirmacionPendiente ? 'warning' : 'negative'}>{errorGeneral}</Banner></div>
	{/if}

	{#if data.tipos.length === 0}
		<p class="text-[15px] text-ink-muted">{textos.economia.sinTipos}</p>
	{:else}
		<form
			method="post"
			action="?/registrar"
			enctype="multipart/form-data"
			use:enhance={() =>
				async ({ update }) => {
					await update({ reset: false });
					if (form && 'id' in form) {
						const frase = mascota.elegirFrase('compra.confirmada');
						if (frase.conAudio) mascota.hablar(frase.id);
					}
				}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="clienteId" value={data.clienteId} />
			<input type="hidden" name="numeroLineas" value={numeroLineas} />

			{#each filas as indice (indice)}
				<fieldset class="flex flex-col gap-3 rounded-card border border-ink-muted/40 p-3">
					<legend class="px-1 text-sm font-semibold">{textos.economia.linea} {indice + 1}</legend>
					<SelectField label={textos.economia.tipo} name="tipo" options={opciones} value={previas[indice]?.tipoCapsulaId ?? ''} />
					<TextField
						label={textos.economia.cantidad}
						name="cantidad"
						type="number"
						inputmode="numeric"
						min="1"
						step="1"
						value={previas[indice]?.cantidad ?? ''}
					/>
					<MoneyField
						label={textos.economia.importe}
						name="importe"
						bind:cents={() => importeDeFila(indice), (valor: number | null) => (importes[indice] = valor)}
					/>
				</fieldset>
			{/each}

			<p class="text-[15px]">{textos.economia.total}: <Money cents={total} /></p>

			<PhotoField label={textos.economia.fotoTicket} name="foto" />

			<label class="flex min-h-11 items-center gap-3 text-[15px]">
				<input type="checkbox" name="confirmoHuchaNegativa" value="on" class="size-5" checked={confirmacionPendiente} />
				<span>{textos.economia.confirmarHuchaNegativa}</span>
			</label>

			<div class="flex flex-wrap gap-3">
				<Button type="submit" formaction="?/anadirLinea" variant="soft">{textos.economia.nuevaLinea}</Button>
				{#if numeroLineas > 1}
					<Button type="submit" formaction="?/quitarLinea" variant="ghost">{textos.economia.quitarLinea}</Button>
				{/if}
				<Button type="submit">{textos.economia.registrarCompra}</Button>
			</div>
		</form>
	{/if}

	<Section title={textos.economia.compras}>
		{#if data.compras.length === 0}
			<EmptyState momento="vacio-compras" title={textos.economia.sinCompras} />
		{:else}
			<ul class="flex flex-col">
				{#each data.compras as compra (compra.id)}
					<ListRow
						title={`${compra.fecha.slice(0, 10)} · ${compra.autor}`}
						href={resolve('/(app)/compras/[compraId=ulid]', { compraId: compra.id })}
					>
						{#snippet trailing()}
							<Money cents={compra.importe} />
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
	</Section>
</div>
