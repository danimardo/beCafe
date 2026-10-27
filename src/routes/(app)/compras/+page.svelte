<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import {
		Badge,
		Banner,
		Button,
		CapsuleImage,
		ConfirmDialog,
		CounterField,
		DosColumnas,
		EmptyState,
		ListRow,
		Money,
		MoneyField,
		PageHeader,
		PhotoField,
		Section,
		usarMascota,
	} from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import { parseMoney } from '#lib/shared/dinero';
	import { campoImporteDe, IMPORTE_OBLIGATORIO } from '#lib/shared/contratos/economia';
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

	// Tras un rechazo o una confirmación pendiente, `valores.lineas` trae lo escrito para rellenar la cuadrícula sin JavaScript.
	function lineasPrevias(respuesta: typeof form): LineaPrevia[] {
		const valores: unknown = respuesta && 'valores' in respuesta ? respuesta.valores : undefined;
		const lista: unknown = typeof valores === 'object' && valores !== null && 'lineas' in valores ? valores.lineas : undefined;
		return Array.isArray(lista) ? lista.filter(esLineaPrevia) : [];
	}

	function estadoInicial() {
		const previas = lineasPrevias(form);
		const cantidades: Record<string, number> = {};
		const importes: Record<string, number | null> = {};
		for (const tipo of data.tipos) {
			const previa = previas.find((linea) => linea.tipoCapsulaId === tipo.id);
			const cantidad = Number(previa?.cantidad ?? '0');
			cantidades[tipo.id] = Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 0;
			importes[tipo.id] = parseMoney(previa?.importe ?? '');
		}
		return { cantidades, importes };
	}

	const inicial = untrack(estadoInicial);
	let cantidades = $state(inicial.cantidades);
	let importes = $state(inicial.importes);
	// Sin JavaScript, todos los importes están visibles; con JavaScript, solo los de cantidad mayor que 0.
	let conJavaScript = $state(false);
	onMount(() => {
		conJavaScript = true;
	});

	const lineas = $derived(data.tipos.filter((tipo) => (cantidades[tipo.id] ?? 0) > 0));
	const total = $derived(lineas.reduce((suma, tipo) => suma + (importes[tipo.id] ?? 0), 0));
	const resultadoPrevisto = $derived(data.saldoHucha - total);

	const errores: Partial<Record<string, { codigo: string; mensaje: string }>> = $derived(
		(form && 'errores' in form ? form.errores : undefined) ?? {},
	);
	// RF-211: los importes que faltan se marcan en su campo. El cliente los detecta antes de enviar; el servidor, sin JavaScript.
	let erroresCliente = $state<Record<string, { codigo: string; mensaje: string }>>({});
	// Un error del cliente desaparece en cuanto la línea tiene importe.
	const erroresImporte = $derived({
		...Object.fromEntries(Object.entries(errores).filter(([campo]) => campo.startsWith('importe-'))),
		...Object.fromEntries(Object.entries(erroresCliente).filter(([campo]) => campo in importesQueFaltan())),
	});
	const hayErroresImporte = $derived(Object.keys(erroresImporte).length > 0);
	const errorGeneral = $derived(
		hayErroresImporte
			? textos.economia.revisaImportes
			: Object.entries(errores).find(([campo]) => !campo.startsWith('importe-'))?.[1]?.mensaje,
	);
	let resumenErrores: HTMLElement | undefined = $state();

	/** Líneas con cantidad y sin un importe mayor que 0 (RF-211). */
	function importesQueFaltan(): Record<string, { codigo: string; mensaje: string }> {
		return Object.fromEntries(
			lineas
				.filter((tipo) => (importes[tipo.id] ?? 0) <= 0)
				.map((tipo) => [campoImporteDe(tipo.id), { codigo: IMPORTE_OBLIGATORIO, mensaje: textos.economia.importeObligatorio }]),
		);
	}

	// RF-212: ningún error queda detrás de un diálogo; el foco va al resumen para que se lea y se vea.
	async function mostrarErrores() {
		await tick();
		resumenErrores?.focus();
	}
	// RF-198: la confirmación que pide el servidor (sin JavaScript o si el saldo cambió desde que se mostró).
	const confirmacionServidor = $derived(form && 'confirmacion' in form ? form.confirmacion : undefined);
	const confirmacionRegistrada = $derived(form && 'id' in form ? textos.economia.compraRegistrada : undefined);

	let formulario: HTMLFormElement | undefined = $state();
	let dialogoAbierto = $state(false);
	let confirmadaEnCliente = false;

	function confirmarEnCliente() {
		dialogoAbierto = false;
		confirmadaEnCliente = true;
		formulario?.requestSubmit();
	}
</script>

<svelte:head>
	<title>{textos.economia.compras} · beCafé</title>
</svelte:head>

{#snippet efecto(saldo: number, importe: number, resultado: number)}
	<dl class="flex flex-col gap-1 text-[15px]">
		<div class="flex justify-between gap-3">
			<dt class="text-ink-muted">{textos.economia.saldoActual}</dt>
			<dd><Money cents={saldo} /></dd>
		</div>
		<div class="flex justify-between gap-3">
			<dt class="text-ink-muted">{textos.economia.importeCompra}</dt>
			<dd><Money cents={importe} /></dd>
		</div>
		<div class="flex justify-between gap-3 font-semibold">
			<dt>{textos.economia.saldoResultante}</dt>
			<dd><Money cents={resultado} signed tone /></dd>
		</div>
	</dl>
{/snippet}

<div class="flex flex-col gap-6">
	<PageHeader title={textos.economia.compras} />

	{#if confirmacionRegistrada}
		<div role="status"><Banner tone="info">{confirmacionRegistrada}</Banner></div>
	{/if}
	{#if errorGeneral}
		<div role="alert" tabindex="-1" bind:this={resumenErrores} class="outline-none"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}

	<!-- RF-261: registrar la compra (con ticket) a la izquierda; el listado, a la derecha. -->
	<DosColumnas>
		{#snippet acciones()}
			{#if data.tipos.length === 0}
				<p class="text-[15px] text-ink-muted">{textos.economia.sinTipos}</p>
			{:else}
				<form
					bind:this={formulario}
					method="post"
					action="?/registrar"
					enctype="multipart/form-data"
					use:enhance={({ cancel, formData, submitter }) => {
						const confirmadaEnPanel = submitter?.getAttribute('name') === 'confirmarHuchaNegativa';
						erroresCliente = importesQueFaltan();
						if (Object.keys(erroresCliente).length > 0) {
							cancel();
							confirmadaEnCliente = false;
							void mostrarErrores();
							return;
						}
						if (resultadoPrevisto < 0 && !confirmadaEnCliente && !confirmadaEnPanel) {
							cancel();
							dialogoAbierto = true;
							return;
						}
						if (confirmadaEnCliente) {
							formData.set('confirmarHuchaNegativa', 'si');
							formData.set('saldoConfirmado', String(data.saldoHucha));
						}
						confirmadaEnCliente = false;
						return async ({ update }) => {
							dialogoAbierto = false;
							await update({ reset: false });
							if (form && 'errores' in form) await mostrarErrores();
							if (form && 'id' in form) {
								const frase = mascota.elegirFrase('compra.confirmada');
								if (frase.conAudio) mascota.hablar(frase.id);
							}
						};
					}}
					class="flex flex-col gap-4"
				>
					<input type="hidden" name="clienteId" value={data.clienteId} />
					<p class="text-[15px] text-ink-muted">{textos.economia.ayudaCompra}</p>

					<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each data.tipos as tipo (tipo.id)}
							{@const cantidad = cantidades[tipo.id] ?? 0}
							<li class="flex flex-col gap-3 rounded-panel border border-hairline bg-wall-base p-4">
								<div class="flex items-center gap-3">
									<CapsuleImage name={tipo.nombre} color={tipo.color} photoUrl={tipo.fotoUrl} size="md" />
									<div class="min-w-0 flex-1">
										<p class="text-[15px] font-semibold">{tipo.nombre}</p>
										<p class="text-[13px] text-ink-muted">
											{tipo.stock <= 0 ? textos.inicio.sinStock : textos.economia.quedan(tipo.stock)}
										</p>
										{#if tipo.enStockBajo && tipo.stock > 0}
											<Badge tone="warning">
												{#snippet icon()}<TriangleAlert class="size-3.5" aria-hidden="true" />{/snippet}
												{textos.inicio.quedanPocas}
											</Badge>
										{/if}
									</div>
								</div>
								<input type="hidden" name="tipo" value={tipo.id} />
								<CounterField
									label={textos.economia.cantidadDe(tipo.nombre)}
									name="cantidad"
									bind:value={() => cantidades[tipo.id] ?? 0, (valor: number) => (cantidades[tipo.id] = valor)}
									decreaseLabel={textos.economia.quitarUnaDe(tipo.nombre)}
									increaseLabel={textos.economia.anadirUnaDe(tipo.nombre)}
								/>
								{#if !conJavaScript || cantidad > 0}
									<MoneyField
										label={textos.economia.importeDe(tipo.nombre)}
										name="importe"
										hint={conJavaScript ? textos.economia.ayudaImporte : textos.economia.ayudaImporteSinJs}
										bind:cents={() => importes[tipo.id] ?? null, (valor: number | null) => (importes[tipo.id] = valor)}
										error={erroresImporte[campoImporteDe(tipo.id)]?.mensaje}
									/>
								{:else}
									<input type="hidden" name="importe" value="" />
								{/if}
							</li>
						{/each}
					</ul>

					<div class="flex flex-col gap-1 rounded-panel border border-hairline bg-wall-base p-4" aria-live="polite">
						<p class="text-[15px]">
							{textos.economia.resumenCompra(lineas.length)} · {textos.economia.total}: <Money cents={total} />
						</p>
						<p class="text-[13px] text-ink-muted">{lineas.length === 0 ? textos.economia.sinLineas : textos.economia.ayudaTotal}</p>
					</div>

					<PhotoField label={textos.economia.fotoTicket} name="foto" />

					{#if confirmacionServidor}
						<!-- RF-198 sin JavaScript: el mismo efecto como paso intermedio, con «Registrar igualmente» y «Cancelar». -->
						<div class="flex flex-col gap-3 rounded-panel border border-warning bg-wall-base p-4" role="alert">
							<h2 class="type-title-lg">{textos.economia.huchaNegativaTitulo}</h2>
							<p class="text-[15px] text-ink-muted">{textos.economia.huchaNegativaDescripcion}</p>
							{@render efecto(confirmacionServidor.saldo, confirmacionServidor.importe, confirmacionServidor.resultado)}
							<p class="text-[13px] text-ink-muted">{textos.economia.repetirFoto}</p>
							<input type="hidden" name="saldoConfirmado" value={confirmacionServidor.saldo} />
							<Button type="submit" name="confirmarHuchaNegativa" value="si" variant="danger">{textos.economia.registrarIgualmente}</Button>
							<a href={resolve('/(app)/compras')} class="text-center text-[15px] font-semibold text-accent underline"
								>{textos.economia.cancelar}</a
							>
						</div>
					{:else}
						<Button type="submit">{textos.economia.registrarCompra}</Button>
					{/if}
				</form>
			{/if}
		{/snippet}
		{#snippet listado()}
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
		{/snippet}
	</DosColumnas>
</div>

<ConfirmDialog
	bind:open={dialogoAbierto}
	title={textos.economia.huchaNegativaTitulo}
	description={textos.economia.huchaNegativaDescripcion}
	confirmLabel={textos.economia.registrarIgualmente}
	cancelLabel={textos.economia.cancelar}
	tone="danger"
	onconfirm={confirmarEnCliente}
>
	{@render efecto(data.saldoHucha, total, resultadoPrevisto)}
</ConfirmDialog>
