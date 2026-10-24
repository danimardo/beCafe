<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';
	import { ulid } from 'ulid';
	import type { ElementoCola } from '#lib/shared/contratos/consumos';
	import { Banner, Button, CapsuleRow, Glass, ListRow, Money, Section, WaterRefillCard, usarAvisos } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import { instanteDesdeFecha } from '#lib/shared/fechas/tipos';
	import { anadirElemento, borrarElemento, enviarPendientes, limpiarRechazados, listarElementos } from '#lib/client/cola-consumos/index';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();

	// Con JavaScript, el formulario lo gestiona `use:enhance`; sin él, la página muestra la respuesta del servidor (principio XVII).
	let conJs = $state(false);
	let enLinea = $state(true);
	let pendientes = $state<ElementoCola[]>([]);
	let sesionCaducada = $state(false);
	let consumoADeshacer = $state('');
	let formularioDeshacer: HTMLFormElement | undefined = $state();
	let temporizador: ReturnType<typeof setTimeout> | undefined;

	const enCola = $derived(pendientes.filter((elemento) => elemento.estado === 'pendiente'));
	const rechazados = $derived(pendientes.filter((elemento) => elemento.estado === 'rechazado'));
	const consumoRegistrado = $derived(form && 'consumo' in form ? form.consumo : undefined);
	const errorGeneral = $derived(
		form && 'errores' in form && form.errores && 'general' in form.errores ? form.errores.general.mensaje : undefined,
	);
	const deshechoAhora = $derived(Boolean(form && 'deshecho' in form));
	// Rechazo por intervalo (RF-172): el servidor responde 409 con quién y hace cuánto.
	const rechazoRelleno = $derived(form && 'codigo' in form && form.codigo === 'RELLENO_RECIENTE' ? form : null);
	const rellenoRegistrado = $derived(form && 'rellenoId' in form ? form.rellenoId : undefined);
	let rellenoADeshacer = $state('');
	let formularioDeshacerRelleno: HTMLFormElement | undefined = $state();
	// Sin conexión al enviar el relleno: el botón se desactiva y nunca se encola (RN-081).
	let rellenoFallido = $state(false);

	function nombreDe(tipoCapsulaId: string): string {
		return data.tipos.find((tipo) => tipo.id === tipoCapsulaId)?.nombre ?? '';
	}

	function mensajeDeRechazo(codigo: string | undefined): string {
		if (codigo === 'USUARIO_DE_BAJA') return textos.errores.USUARIO_DE_BAJA;
		if (codigo === 'TIPO_SIN_COSTE') return textos.errores.TIPO_SIN_COSTE;
		return textos.errores.VALIDACION;
	}

	async function cargarPendientes(): Promise<void> {
		pendientes = await listarElementos(data.usuarioId);
	}

	// Envía la cola de esta persona y, si algo falla por red o por el servidor, vuelve a intentarlo con su espera (plan D5).
	async function sincronizar(): Promise<void> {
		if (!navigator.onLine) return;
		const resultado = await enviarPendientes(data.usuarioId);
		sesionCaducada = resultado.sesionCaducada;
		await cargarPendientes();
		if (resultado.reintentoEnMs !== null) temporizador = setTimeout(() => void sincronizar(), resultado.reintentoEnMs);
	}

	$effect(() => {
		enLinea = navigator.onLine;
		void cargarPendientes().then(sincronizar);
		const intervalo = setInterval(() => void sincronizar(), 30_000);
		return () => {
			clearInterval(intervalo);
			clearTimeout(temporizador);
		};
	});

	// Un toque sin red (o con la red caída durante el envío) va a la cola con el mismo identificador (plan D2).
	async function encolar(elemento: ElementoCola): Promise<void> {
		await anadirElemento(elemento);
		await cargarPendientes();
		void sincronizar();
	}

	function enviarToque(formulario: HTMLFormElement) {
		return enhance(formulario, ({ formData, cancel }) => {
			conJs = true;
			// Cada toque tiene su propio identificador: dos toques seguidos registran dos consumos (RF-016).
			const clienteId = ulid();
			const campoTipo = formData.get('tipoCapsulaId');
			const tipoCapsulaId = typeof campoTipo === 'string' ? campoTipo : '';
			const invitado = formData.get('invitado') === '1';
			const horaGesto = instanteDesdeFecha(new Date());
			const elemento: ElementoCola = {
				version: 1,
				clienteId,
				usuarioId: data.usuarioId,
				tipoCapsulaId,
				invitado,
				horaGesto,
				estado: 'pendiente',
			};
			formData.set('clienteId', clienteId);
			if (!enLinea) {
				cancel();
				void encolar(elemento);
				return;
			}
			formData.set('horaGesto', horaGesto);
			return async ({ result, update }) => {
				if (result.type === 'error') {
					await encolar(elemento);
					return;
				}
				await update();
				const consumo = form && 'consumo' in form ? form.consumo : undefined;
				if (consumo) {
					avisos.mostrarDeshacer({
						title: textos.consumos.registrado(nombreDe(consumo.tipoCapsulaId)),
						warning: consumo.descuadre ? textos.consumos.descuadre : undefined,
						onundo: () => void deshacer(consumo.id),
					});
				}
			};
		});
	}

	// «Deshacer» (RF-013): envía el formulario oculto, que la acción valida con el servidor.
	async function deshacer(id: string): Promise<void> {
		consumoADeshacer = id;
		await tick();
		formularioDeshacer?.requestSubmit();
	}

	function enviarDeshacer(formulario: HTMLFormElement) {
		return enhance(formulario, () => async ({ update }) => {
			await update({ reset: false });
			if (form && 'deshecho' in form) avisos.informar({ title: textos.consumos.deshecho });
			else if (form && 'errores' in form && form.errores)
				avisos.informar({
					title: 'general' in form.errores ? form.errores.general.mensaje : textos.consumos.noDeshecho,
					kind: 'warning',
				});
		});
	}

	// «He rellenado el agua»: formulario del servidor con mejora de JavaScript; «Deshacer» durante 5 s (RF-171).
	function enviarRelleno(formulario: HTMLFormElement) {
		return enhance(formulario, ({ formData }) => {
			conJs = true;
			rellenoFallido = false;
			// Cada pulsación tiene su identificador: el servidor ignora un reenvío del mismo.
			formData.set('clienteId', ulid());
			return async ({ result, update }) => {
				if (result.type === 'error') {
					rellenoFallido = true;
					return;
				}
				await update({ reset: false });
				const id = form && 'rellenoId' in form ? form.rellenoId : undefined;
				if (id) {
					avisos.mostrarDeshacer({
						title: textos.rellenos.registrado,
						onundo: () => void deshacerRelleno(id),
					});
				}
			};
		});
	}

	async function deshacerRelleno(id: string): Promise<void> {
		rellenoADeshacer = id;
		await tick();
		formularioDeshacerRelleno?.requestSubmit();
	}

	function enviarDeshacerRelleno(formulario: HTMLFormElement) {
		return enhance(formulario, () => async ({ update }) => {
			await update({ reset: false });
			if (form && 'deshechoRelleno' in form) avisos.informar({ title: textos.rellenos.anuladoOk });
		});
	}

	async function quitarPendiente(elemento: ElementoCola): Promise<void> {
		await borrarElemento(elemento.clienteId);
		avisos.informar({ title: textos.consumos.deshecho });
		await cargarPendientes();
	}

	async function entenderRechazados(): Promise<void> {
		await limpiarRechazados(data.usuarioId);
		await cargarPendientes();
	}
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

<svelte:window
	ononline={() => {
		enLinea = true;
		void sincronizar();
	}}
	onoffline={() => (enLinea = false)}
/>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
	<h1 class="font-serif text-3xl font-semibold text-ink">{textos.inicio.saludo(data.nombre)}</h1>
	{#if data.privacidadAceptada}
		<p role="status" class="text-[15px] text-ink">{textos.confirmaciones.privacidadAceptada}</p>
	{/if}

	{#if errorGeneral}
		<div role="alert"><Banner tone="negative">{errorGeneral}</Banner></div>
	{/if}
	{#if deshechoAhora && !conJs}
		<p role="status" class="text-[15px] text-ink">{textos.consumos.deshecho}</p>
	{/if}
	{#if consumoRegistrado && !conJs}
		<Banner tone="info" title={textos.consumos.registrado(nombreDe(consumoRegistrado.tipoCapsulaId))}>
			{#if consumoRegistrado.descuadre}<p class="text-[14px]">{textos.consumos.descuadre}</p>{/if}
			<form method="post" action="?/deshacer" class="mt-2">
				<input type="hidden" name="consumoId" value={consumoRegistrado.id} />
				<Button type="submit" variant="soft">{textos.consumos.deshacer}</Button>
			</form>
		</Banner>
	{/if}

	<form method="post" action="?/deshacerRelleno" class="hidden" bind:this={formularioDeshacerRelleno} use:enviarDeshacerRelleno>
		<input type="hidden" name="rellenoId" value={rellenoADeshacer} />
	</form>

	<form method="post" action="?/deshacer" class="hidden" bind:this={formularioDeshacer} use:enviarDeshacer>
		<input type="hidden" name="consumoId" value={consumoADeshacer} />
	</form>

	<Section title={textos.economia.hucha}>
		<p class="text-2xl font-semibold">
			<Money cents={data.hucha} tone srSuffix={data.hucha < 0 ? textos.economia.huchaNegativa : undefined} />
		</p>
		<p class="text-[15px] text-ink-muted">
			{textos.economia.tuSaldo}: <Money cents={data.saldoPropio} signed tone />
		</p>
	</Section>

	{#if data.deudores.length > 0}
		<Section title={textos.economia.deudores}>
			<ul class="flex flex-col gap-1 text-[15px]">
				{#each data.deudores as deudor (deudor.nombre)}
					<li class="flex justify-between gap-3">
						<span>{deudor.nombre}</span>
						<Money cents={deudor.saldo} tone />
					</li>
				{/each}
			</ul>
		</Section>
	{/if}

	<Section title={textos.capsulas.avisos.titulo}>
		{#if data.avisos.length === 0}
			<p class="text-[15px] text-ink-muted">{textos.capsulas.avisos.ninguno}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each data.avisos as aviso (aviso.id)}
					<li class="flex min-h-11 flex-wrap items-center justify-between gap-2">
						<span class="text-[15px] font-semibold text-ink">{aviso.nombre}</span>
						<span class="text-[14px] text-ink-muted">
							{aviso.dias === null ? textos.capsulas.sinDatos : textos.capsulas.dias(aviso.dias)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<Section title={textos.consumos.titulo}>
		<WaterRefillCard
			ultimo={data.agua.ultimo}
			aguador={data.agua.aguador}
			clienteId={data.agua.clienteId}
			enConexion={enLinea && !rellenoFallido}
			rechazo={rechazoRelleno ? { nombre: rechazoRelleno.autor, hace: rechazoRelleno.hace, esPropio: rechazoRelleno.esPropio } : null}
			enhancer={enviarRelleno}
			historialHref={resolve('/(app)/historial')}
		/>
		{#if form && 'deshechoRelleno' in form && !conJs}
			<p role="status" class="text-[15px] text-ink">{textos.rellenos.anuladoOk}</p>
		{/if}
		{#if rellenoRegistrado && !conJs}
			<Banner tone="info" title={textos.rellenos.registrado}>
				<form method="post" action="?/deshacerRelleno" class="mt-2">
					<input type="hidden" name="rellenoId" value={rellenoRegistrado} />
					<Button type="submit" variant="soft">{textos.consumos.deshacer}</Button>
				</form>
			</Banner>
		{/if}
		{#if !enLinea}
			<Banner tone="offline">{textos.consumos.sinConexion}</Banner>
		{/if}
		{#if enCola.length > 0}
			<Banner tone="warning" title={textos.consumos.pendientes(enCola.length)}>{textos.consumos.perdidos}</Banner>
		{/if}
		{#if sesionCaducada}
			<Banner tone="negative">{textos.consumos.inicieSesion}</Banner>
		{/if}
		{#if rechazados.length > 0}
			<Banner tone="negative" title={textos.consumos.rechazados}>
				<ul class="flex flex-col gap-1 text-[14px]">
					{#each rechazados as rechazado (rechazado.clienteId)}
						<li>{nombreDe(rechazado.tipoCapsulaId)}: {mensajeDeRechazo(rechazado.codigo)}</li>
					{/each}
				</ul>
				<Button type="button" variant="soft" onclick={entenderRechazados}>{textos.consumos.entendido}</Button>
			</Banner>
		{/if}

		{#if data.tipos.length === 0}
			<p class="text-[15px] text-ink-muted">{textos.consumos.sinCapsulas}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each data.tipos as tipo (tipo.id)}
					<CapsuleRow
						tipoId={tipo.id}
						clienteId={tipo.clienteId}
						name={tipo.nombre}
						brand={tipo.marca}
						intensity={tipo.intensidad}
						stock={tipo.stock}
						threshold={tipo.umbralMinimo}
						priceCents={tipo.precio}
						color={tipo.color}
						photoUrl={tipo.fotoUrl}
						daysLeft={tipo.dias}
						enhancer={enviarToque}
					/>
				{/each}
			</ul>
		{/if}

		{#if enCola.length > 0}
			<ul class="flex flex-col gap-1">
				{#each enCola as elemento (elemento.clienteId)}
					<li class="flex min-h-11 items-center justify-between gap-3 text-[15px]">
						<span>{nombreDe(elemento.tipoCapsulaId)} · {textos.consumos.pendiente}</span>
						<Button type="button" variant="ghost" onclick={() => quitarPendiente(elemento)}>{textos.consumos.deshacer}</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<Section title={textos.consumos.ultimos}>
		{#if data.recientes.length === 0}
			<p class="text-sm text-ink-muted">{textos.consumos.sinUltimos}</p>
		{:else}
			<ul class="flex flex-col">
				{#each data.recientes as consumo (consumo.id)}
					<ListRow
						title={`${consumo.tipo}${consumo.invitado ? ` · ${textos.consumos.invitado}` : ''}`}
						href={resolve('/(app)/consumos/[consumoId=ulid]', { consumoId: consumo.id })}
					>
						{#snippet trailing()}
							<Money cents={consumo.precio} />
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
	</Section>

	<Glass class="flex flex-col gap-4">
		<a class="text-accent underline" href={resolve('/(app)/perfil')}>{textos.perfil.titulo}</a>
		<form method="post" action="/logout" use:enhance>
			<Button type="submit" variant="soft" block>{textos.inicio.cerrarSesion}</Button>
		</form>
	</Glass>
</main>
