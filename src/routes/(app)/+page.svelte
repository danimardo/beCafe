<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import { ulid } from 'ulid';
	import type { ElementoCola } from '#lib/shared/contratos/consumos';
	import {
		AlertsPanel,
		Banner,
		Button,
		CapsuleTile,
		Capsulito,
		EmptyState,
		Glass,
		ListRow,
		Money,
		PageHeader,
		PanelGrid,
		Section,
		TourInicio,
		WaterRefillCard,
		usarAvisos,
		usarMascota,
	} from '#lib/ui';
	import { MOMENTOS, momentoInicio } from '#lib/shared/mascota/momentos';
	import { textos } from '#lib/shared/textos';
	import { instanteDesdeFecha } from '#lib/shared/fechas/tipos';
	import { anadirElemento, borrarElemento, enviarPendientes, limpiarRechazados, listarElementos } from '#lib/client/cola-consumos/index';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	const mascota = usarMascota();

	// Con JavaScript, el formulario lo gestiona `use:enhance`; sin él, la página muestra la respuesta del servidor (principio XVII).
	let conJs = $state(false);
	let enLinea = $state(true);
	let pendientes = $state<ElementoCola[]>([]);
	let sesionCaducada = $state(false);
	let consumoADeshacer = $state('');
	let formularioDeshacer: HTMLFormElement | undefined = $state();
	// RF-204: el tour aparece tras la bienvenida, con JavaScript, si la cuenta no lo ha visto o se pidió repetirlo.
	let formularioTour: HTMLFormElement | undefined = $state();
	let tourCerrado = $state(false);
	// «Repetir el tour» navega a la misma página con `tour=si`: el componente se conserva y el tour vuelve a abrirse.
	afterNavigate(() => {
		tourCerrado = false;
	});
	let montado = $state(false);
	onMount(() => {
		montado = true;
	});
	const mostrarTour = $derived(montado && data.tourPendiente && !tourCerrado && mascota.bienvenidaVista && !mascota.bienvenidaManual);
	function terminarTour() {
		tourCerrado = true;
		formularioTour?.requestSubmit();
	}
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

	const primerNombre = $derived(data.nombre.trim().split(/\s+/)[0] ?? '');
	const momentoSaludoBase = $derived(
		momentoInicio({
			rechazado: false,
			pendientes: 0,
			saldoCents: data.saldoPropio,
			limiteDeudaCents: data.limiteDeuda,
			stockBajo: data.avisos.length,
			soyAguador: data.agua.aguador?.incluyeAlUsuario,
		}),
	);
	const momentoSaludo = $derived(
		momentoInicio({
			rechazado: rechazados.length > 0,
			pendientes: enCola.length,
			saldoCents: data.saldoPropio,
			limiteDeudaCents: data.limiteDeuda,
			stockBajo: data.avisos.length,
			soyAguador: data.agua.aguador?.incluyeAlUsuario,
		}),
	);
	const poseSaludo = $derived(!enLinea ? MOMENTOS[momentoSaludoBase].pose : undefined);

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
		const previos = pendientes.filter((e) => e.estado === 'pendiente').length;
		const resultado = await enviarPendientes(data.usuarioId);
		sesionCaducada = resultado.sesionCaducada;
		await cargarPendientes();
		const actuales = pendientes.filter((e) => e.estado === 'pendiente').length;
		if (previos > 0 && actuales < previos) {
			const frase = mascota.elegirFrase('consumo.sincronizado');
			if (frase.conAudio) mascota.hablar(frase.id);
		}
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
		const frase = mascota.elegirFrase('consumo.pendiente');
		if (frase.conAudio) mascota.hablar(frase.id);
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
					const momentoEvento = consumo.descuadre
						? 'stock.negativo'
						: consumo.invitado
							? 'consumo.invitado_confirmado'
							: 'consumo.confirmado';
					const frase = mascota.elegirFrase(momentoEvento);
					if (frase.conAudio) mascota.hablar(frase.id);
					avisos.mostrarDeshacer({
						title: textos.consumos.registrado(nombreDe(consumo.tipoCapsulaId)),
						warning: consumo.descuadre ? textos.consumos.descuadre : undefined,
						momento: 'consumo.confirmado',
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
			if (form && 'deshecho' in form) {
				const frase = mascota.elegirFrase('consumo.anulado');
				if (frase.conAudio) mascota.hablar(frase.id);
				avisos.informar({ title: textos.consumos.deshecho });
			} else if (form && 'errores' in form && form.errores)
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
					const frase = mascota.elegirFrase('agua.confirmada');
					if (frase.conAudio) mascota.hablar(frase.id);
					avisos.mostrarDeshacer({
						title: textos.rellenos.registrado,
						momento: 'relleno-registrado',
						onundo: () => void deshacerRelleno(id),
					});
				} else if (form && 'codigo' in form && form.codigo === 'RELLENO_RECIENTE') {
					const frase = mascota.elegirFrase('agua.rechazada_reciente', { nombre: form.autor });
					if (frase.conAudio) mascota.hablar(frase.id);
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
	onoffline={() => {
		enLinea = false;
		const frase = mascota.elegirFrase('conexion.perdida');
		if (frase.conAudio) mascota.hablar(frase.id);
	}}
/>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.inicio.saludo(data.nombre)} />
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

	<form
		method="post"
		action="?/tourVisto"
		class="hidden"
		bind:this={formularioTour}
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false, invalidateAll: false })}
	></form>
	{#if mostrarTour}
		<TourInicio onterminar={terminarTour} />
	{/if}

	<PanelGrid>
		{#snippet resumen()}
			<div class="flex flex-col gap-4">
				{#if mascota.visible}
					<Glass class="flex items-center gap-3 p-4">
						<Capsulito momento={momentoSaludo} pose={poseSaludo} nombre={primerNombre} size="sm" bocadillo="derecha" />
					</Glass>
				{/if}
				<AlertsPanel
					huchaCents={data.hucha}
					myBalanceCents={data.saldoPropio}
					lowStock={data.avisos.map((aviso) => aviso.nombre)}
					debtors={data.deudores.map((deudor) => ({ name: deudor.nombre, cents: deudor.saldo }))}
				/>
			</div>
		{/snippet}

		{#snippet principal()}
			<Section title={textos.consumos.titulo}>
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
					<EmptyState momento="vacio-capsulas" title={textos.capsulas.vacio} description={textos.consumos.sinCapsulas} />
				{:else}
					<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each data.tipos as tipo (tipo.id)}
							<CapsuleTile
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
								ownCount={tipo.propios}
								guestCount={tipo.invitados}
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
		{/snippet}

		{#snippet secundario()}
			<div class="flex flex-col gap-6">
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

				<!-- Visitantes (plan F10 D4): acceso secundario; la acción primaria de Inicio sigue siendo el toque. -->
				<Section>
					<ul class="flex flex-col">
						<ListRow
							title={textos.visitantes.tarjetaInicio}
							subtitle={textos.visitantes.tarjetaInicioAyuda}
							href={resolve('/(app)/visitantes')}
						/>
					</ul>
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
			</div>
		{/snippet}
	</PanelGrid>
</div>
