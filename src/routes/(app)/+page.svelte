<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, tick, untrack } from 'svelte';
	import { ulid } from 'ulid';
	import type { ElementoCola } from '#lib/shared/contratos/consumos';
	import {
		AlertsPanel,
		Banner,
		Button,
		CapsuleTile,
		Capsulito,
		ConfirmDialog,
		EmptyState,
		Glass,
		ListRow,
		Money,
		PageHeader,
		PanelGrid,
		Section,
		OfertaAvisos,
		TarjetaInstalacion,
		TourInicio,
		WaterRefillCard,
		usarAvisos,
		usarMascota,
		type SonidoCelebracion,
	} from '#lib/ui';
	import { MOMENTOS, momentoInicio, srcPose, type MomentoId, type Pose } from '#lib/shared/mascota/momentos';
	import { textos } from '#lib/shared/textos';
	import { ordenarSegunVisita } from '#lib/shared/capsulas/orden-visita';
	import { instanteDesdeFecha } from '#lib/shared/fechas/tipos';
	import { activarPush } from '#lib/client/push';
	import { crearInstalacion, type EstadoInstalacion } from '#lib/client/instalacion';
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
	// RF-228: con JavaScript, «Repetir el tour» de la ayuda reabre el tour sin navegar. Sin JavaScript, el formulario GET
	// lleva a `/?tour=si` y el servidor marca el tour como pendiente.
	let tourForzado = $state(false);
	function repetirTour() {
		tourForzado = true;
		tourCerrado = false;
	}
	afterNavigate(() => {
		tourCerrado = false;
	});
	let montado = $state(false);
	// RF-206: tarjeta de instalación. Solo se ofrece si el navegador puede instalar y la cuenta no la descartó.
	let estadoInstalacion = $state<EstadoInstalacion>('no_disponible');
	let instalacion: ReturnType<typeof crearInstalacion> | undefined;
	let formularioInstalacion: HTMLFormElement | undefined = $state();
	let instalacionOculta = $state(false);
	onMount(() => {
		montado = true;
		if (data.saludoDisponible && mascota.visible && mascota.bienvenidaVista && !mascota.bienvenidaManual) {
			void tick().then(() => formularioSaludo?.requestSubmit());
		}
		instalacion = crearInstalacion(window, (estado) => (estadoInstalacion = estado));
		return () => {
			instalacion?.destruir();
			clearTimeout(temporizadorSaludo);
		};
	});
	function descartarInstalacion() {
		instalacionOculta = true;
		formularioInstalacion?.requestSubmit();
	}
	const mostrarTour = $derived(
		montado && (data.tourPendiente || tourForzado) && !tourCerrado && mascota.bienvenidaVista && !mascota.bienvenidaManual,
	);
	function terminarTour() {
		tourCerrado = true;
		formularioTour?.requestSubmit();
	}

	// RF-207: tras la bienvenida y el tour, Capsulito ofrece los avisos una sola vez, si el navegador aún no ha decidido.
	let formularioOferta: HTMLFormElement | undefined = $state();
	let ofertaCerrada = $state(false);
	const mostrarOferta = $derived(
		montado &&
			!data.ofertaAvisosVista &&
			!ofertaCerrada &&
			!mostrarTour &&
			(!(data.tourPendiente || tourForzado) || tourCerrado) &&
			mascota.bienvenidaVista &&
			!mascota.bienvenidaManual &&
			typeof Notification !== 'undefined' &&
			Notification.permission === 'default',
	);
	function cerrarOferta() {
		ofertaCerrada = true;
		formularioOferta?.requestSubmit();
	}
	async function activarDesdeOferta() {
		await activarPush();
		cerrarOferta();
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
	// RF-258: el orden de las cápsulas se fija al entrar y no cambia mientras la persona sigue en Inicio, así el confeti sale sobre la
	// tarjeta pulsada. Se recalcula (RN-090) al volver a entrar o recargar, porque el componente se monta de nuevo.
	const ordenInicial = untrack(() => data.tipos.map((tipo) => tipo.id));
	const tiposEnPantalla = $derived(ordenarSegunVisita(ordenInicial, data.tipos));
	// RF-243: cada incremento lanza el confeti de esa tarjeta cuando el servidor confirma el registro.
	let celebraciones = $state<Record<string, number>>({});
	let celebracionAgua = $state(0);

	// RF-219: lo que dice Capsulito se ve también en pantalla. Un evento (café, agua, red) sustituye al mensaje base.
	let eventoMascota = $state<{ momento?: MomentoId; pose?: Pose; texto: string } | null>(null);
	let temporizadorSaludo: ReturnType<typeof setTimeout> | undefined;
	// RF-243: `celebrando` es un registro confirmado por el servidor; la locución espera al sonido de celebración. Un café pendiente de
	// enviar, un rechazo o un «Deshacer» nunca celebran.
	function decir(momento: MomentoId, vars: { nombre?: string } = {}, celebrando = false, sonido: SonidoCelebracion = 'cafe') {
		const frase = mascota.elegirFrase(momento, vars);
		eventoMascota = { momento, texto: frase.texto };
		if (celebrando) mascota.celebrar(frase.conAudio ? frase.id : null, sonido);
		else if (frase.conAudio) mascota.hablar(frase.id);
	}
	// RF-213, RF-214: una frase del anexo que entregó el servidor. `false` si no se puede mostrar (mascota oculta o frase desconocida).
	function decirFrase(fraseId: string, celebrando = false): boolean {
		const frase = mascota.mostrarFrase(fraseId, celebrando);
		if (!frase) return false;
		eventoMascota = { pose: frase.pose, texto: frase.texto };
		return true;
	}

	// RF-214: el saludo se pide tras montar (JavaScript), no en el `load`, para que una precarga no lo gaste. Después de unos
	// segundos vuelve el mensaje base, que es el aviso de stock bajo si lo hay.
	let formularioSaludo: HTMLFormElement | undefined = $state();
	const SEGUNDOS_SALUDO = 6;
	function enviarSaludo(formulario: HTMLFormElement) {
		return enhance(formulario, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: false });
			const fraseId = form && 'saludo' in form && form.saludo ? form.saludo.fraseId : null;
			if (fraseId && decirFrase(fraseId)) {
				clearTimeout(temporizadorSaludo);
				temporizadorSaludo = setTimeout(() => (eventoMascota = null), SEGUNDOS_SALUDO * 1000);
			}
		});
	}

	// RF-217: con la tarjeta «Sin stock», el toque pregunta antes de enviar. Se vuelve a enviar con `confirmarSinStock=si`.
	let dialogoSinStock = $state(false);
	let pendienteSinStock = $state<{ formulario: HTMLFormElement; submitter: HTMLElement | null; nombre: string } | null>(null);
	let sinStockConfirmado = false;
	const confirmarSinStock = $derived(form && 'confirmarSinStock' in form ? form.confirmarSinStock : undefined);
	function confirmarSinStockEnCliente() {
		const pendiente = pendienteSinStock;
		if (!pendiente) return;
		pendienteSinStock = null;
		// La acción del diálogo no lo cierra sola: sin esto quedaba abierto sobre el café ya registrado.
		dialogoSinStock = false;
		sinStockConfirmado = true;
		if (pendiente.submitter) pendiente.formulario.requestSubmit(pendiente.submitter);
		else pendiente.formulario.requestSubmit();
	}

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

	const srcsetOffline = ([128, 256, 512, 1024] as const)
		.map((tamano) => `${srcPose(MOMENTOS['conexion.perdida'].pose, tamano)} ${tamano}w`)
		.join(', ');

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
			decir('consumo.sincronizado');
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
		decir('consumo.pendiente');
		void sincronizar();
	}

	function enviarToque(formulario: HTMLFormElement) {
		return enhance(formulario, ({ formData, cancel, formElement, submitter }) => {
			conJs = true;
			// Cada toque tiene su propio identificador: dos toques seguidos registran dos consumos (RF-016).
			const clienteId = ulid();
			const campoTipo = formData.get('tipoCapsulaId');
			const tipoCapsulaId = typeof campoTipo === 'string' ? campoTipo : '';
			if (formData.get('sinStock') === '1') {
				if (!sinStockConfirmado) {
					cancel();
					pendienteSinStock = { formulario: formElement, submitter, nombre: nombreDe(tipoCapsulaId) };
					dialogoSinStock = true;
					return;
				}
				sinStockConfirmado = false;
				formData.set('confirmarSinStock', 'si');
			}
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
			// RF-213: con Capsulito visible y red, el servidor entrega una frase de registro.
			if (mascota.visible) formData.set('mascota', 'si');
			return async ({ result, update }) => {
				if (result.type === 'error') {
					await encolar(elemento);
					return;
				}
				await update();
				const consumo = form && 'consumo' in form ? form.consumo : undefined;
				if (consumo) {
					// El descuadre es un aviso y manda; si no, la frase de registro del servidor (RF-213) y, sin ella, el mensaje base.
					const celebrando = !consumo.duplicado;
					if (celebrando) celebraciones[consumo.tipoCapsulaId] = (celebraciones[consumo.tipoCapsulaId] ?? 0) + 1;
					if (consumo.descuadre) decir('stock.negativo', {}, celebrando);
					else if (!consumo.fraseId || !decirFrase(consumo.fraseId, celebrando))
						decir(consumo.invitado ? 'consumo.invitado_confirmado' : 'consumo.confirmado', {}, celebrando);
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
				decir('consumo.anulado');
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
					celebracionAgua += 1;
					decir('agua.confirmada', {}, true, 'agua');
					avisos.mostrarDeshacer({
						title: textos.rellenos.registrado,
						momento: 'relleno-registrado',
						onundo: () => void deshacerRelleno(id),
					});
				} else if (form && 'codigo' in form && form.codigo === 'RELLENO_RECIENTE') {
					decir('agua.rechazada_reciente', { nombre: form.autor });
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
	<!-- Sin red, Capsulito pasa a la pose de «pendiente» o «sin conexión»: se descarga con la página, con el mismo `srcset` y `sizes` que `Capsulito` (lg). -->
	{#if mascota.visible}
		<link rel="preload" as="image" imagesrcset={srcsetOffline} imagesizes="160px" />
	{/if}
</svelte:head>

<svelte:window
	ononline={() => {
		enLinea = true;
		void sincronizar();
	}}
	onoffline={() => {
		enLinea = false;
		decir('conexion.perdida');
	}}
/>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.inicio.saludo(data.nombre)} onrepetirtour={repetirTour} />
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

	<form method="post" action="?/saludo" class="hidden" bind:this={formularioSaludo} use:enviarSaludo></form>

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
	<form
		method="post"
		action="?/descartarInstalacion"
		class="hidden"
		bind:this={formularioInstalacion}
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false, invalidateAll: false })}
	></form>
	<form
		method="post"
		action="?/ofertaAvisosVista"
		class="hidden"
		bind:this={formularioOferta}
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false, invalidateAll: false })}
	></form>
	{#if mostrarOferta}
		<OfertaAvisos onactivar={activarDesdeOferta} onahoranoo={cerrarOferta} />
	{/if}
	{#if montado && !data.instalacionDescartada && !instalacionOculta && (estadoInstalacion === 'instalable' || estadoInstalacion === 'ios')}
		<TarjetaInstalacion estado={estadoInstalacion} oninstalar={() => void instalacion?.instalar()} ondescartar={descartarInstalacion} />
	{/if}
	{#if mostrarTour}
		<TourInicio onterminar={terminarTour} />
	{/if}

	<!-- RF-216: Capsulito grande con su mensaje arriba; el bocadillo se anuncia sin mover el foco (RF-219). -->
	{#if mascota.visible}
		<div role="group" aria-label={textos.inicio.capsulito} aria-live="polite">
			<Glass class="flex items-center gap-4 p-4 lg:p-6">
				<Capsulito
					momento={eventoMascota?.momento ?? momentoSaludo}
					mensaje={eventoMascota?.texto}
					pose={eventoMascota ? eventoMascota.pose : poseSaludo}
					nombre={primerNombre}
					size="lg"
					bocadillo="derecha"
					callado={mostrarTour}
					animar={!mostrarTour}
				/>
			</Glass>
		</div>
	{/if}

	<!-- RF-246: un recuento de stock lo ve toda la plantilla una vez; sigue en el panel de avisos. -->
	{#if data.avisoRecuento}
		<Banner tone="info" title={data.avisoRecuento.titulo}>
			<p class="text-[15px]">{data.avisoRecuento.texto}</p>
			<form method="post" action="?/verAviso" class="mt-3" use:enhance>
				<input type="hidden" name="avisoId" value={data.avisoRecuento.id} />
				<Button type="submit" variant="soft">{textos.inicio.entendido}</Button>
			</form>
		</Banner>
	{/if}

	<!-- RF-217, sin JavaScript: el servidor devuelve la pregunta como paso intermedio. -->
	{#if confirmarSinStock}
		<Banner tone="warning" title={textos.inicio.confirmarSinStockTitulo}>
			<p class="text-[15px]">{textos.inicio.confirmarSinStockPregunta(confirmarSinStock.nombre)}</p>
			<form method="post" action="?/consumir" class="mt-3 flex flex-wrap items-center gap-3">
				<input type="hidden" name="tipoCapsulaId" value={confirmarSinStock.tipoCapsulaId} />
				<input type="hidden" name="clienteId" value={confirmarSinStock.clienteId} />
				<input type="hidden" name="invitado" value={confirmarSinStock.invitado} />
				<input type="hidden" name="sinStock" value="1" />
				<input type="hidden" name="confirmarSinStock" value="si" />
				<Button type="submit">{textos.inicio.confirmarSinStockSi}</Button>
				<a href={resolve('/(app)')} class="inline-flex min-h-11 items-center px-2 font-semibold text-accent underline">
					{textos.inicio.confirmarSinStockCancelar}
				</a>
			</form>
		</Banner>
	{/if}

	<PanelGrid>
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
					<EmptyState
						momento="vacio-capsulas"
						title={textos.capsulas.vacio}
						description={textos.consumos.sinCapsulas}
						callado={mostrarTour}
					/>
				{:else}
					<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each tiposEnPantalla as tipo (tipo.id)}
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
								celebrar={celebraciones[tipo.id] ?? 0}
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
				<AlertsPanel
					huchaCents={data.hucha}
					myBalanceCents={data.saldoPropio}
					lowStock={data.avisos.map((aviso) => aviso.nombre)}
					debtors={data.deudores.map((deudor) => ({ name: deudor.nombre, cents: deudor.saldo }))}
				/>
				<WaterRefillCard
					ultimo={data.agua.ultimo}
					aguador={data.agua.aguador}
					clienteId={data.agua.clienteId}
					enConexion={enLinea && !rellenoFallido}
					rechazo={rechazoRelleno ? { nombre: rechazoRelleno.autor, hace: rechazoRelleno.hace, esPropio: rechazoRelleno.esPropio } : null}
					enhancer={enviarRelleno}
					celebrar={celebracionAgua}
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

<!-- RF-217: con JavaScript, la tarjeta «Sin stock» pregunta antes de registrar. Sin conexión, la pregunta va antes de encolar. -->
<ConfirmDialog
	bind:open={dialogoSinStock}
	title={textos.inicio.confirmarSinStockTitulo}
	description={textos.inicio.confirmarSinStockPregunta(pendienteSinStock?.nombre ?? '')}
	confirmLabel={textos.inicio.confirmarSinStockSi}
	cancelLabel={textos.inicio.confirmarSinStockCancelar}
	onconfirm={confirmarSinStockEnCliente}
/>
