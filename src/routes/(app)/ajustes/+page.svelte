<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { Button, PageHeader, Section, Switch, TarjetaInstalacion, ThemeToggle, usarMascota, usarTema } from '#lib/ui';
	import { crearInstalacion, type DiagnosticoInstalacion, type EstadoInstalacion } from '#lib/client/instalacion';
	import { textos } from '#lib/shared/textos';
	import SeccionAvisos from './SeccionAvisos.svelte';

	type Formulario = {
		errores?: Partial<Record<string, { mensaje: string }>>;
		confirmacion?: string;
	} | null;

	let { data, form }: PageProps = $props();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});

	const tema = usarTema();
	const mascota = usarMascota();

	// RF-206: la opción de instalar está siempre disponible, aunque se haya descartado la tarjeta de Inicio.
	let estadoInstalacion = $state<EstadoInstalacion>('no_disponible');
	let instalacion: ReturnType<typeof crearInstalacion> | undefined;
	let diagnostico = $state<DiagnosticoInstalacion | undefined>();
	onMount(() => {
		instalacion = crearInstalacion(window, (estado) => {
			estadoInstalacion = estado;
			diagnostico = instalacion?.diagnostico();
		});
		// La emisión inicial ocurre antes de asignar `instalacion`: el diagnóstico se lee ya con ella creada.
		diagnostico = instalacion.diagnostico();
		return () => instalacion?.destruir();
	});
</script>

<svelte:head>
	<title>{textos.ajustes.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.ajustes.titulo} />
	<p class="text-[15px] text-ink-muted">{textos.ajustes.subtitulo}</p>

	{#if errores.general}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
	{/if}
	{#if formulario?.confirmacion}
		<p role="status" class="text-[15px] text-ink">{formulario.confirmacion}</p>
	{/if}

	<Section title={textos.apariencia.titulo}>
		<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5">
			<ThemeToggle />
			<Switch
				label={textos.apariencia.reducirTransparencia}
				description={textos.apariencia.ayudaTransparencia}
				checked={tema.transparencia === 'reducida'}
				onchange={(marcado: boolean) => tema.cambiarTransparencia(marcado ? 'reducida' : 'normal')}
			/>
		</div>
	</Section>

	<Section title={textos.ajustes.capsulito}>
		<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5">
			<Switch
				label="Mostrar a Capsulito"
				description="Muestra u oculta la mascota del departamento en este dispositivo."
				checked={mascota.visible}
				onchange={(marcado: boolean) => mascota.setVisible(marcado)}
			/>
			<Switch
				label="Voz de Capsulito"
				description="Activa las locuciones de voz de Capsulito en este dispositivo."
				checked={mascota.vozActiva}
				onchange={(marcado: boolean) => mascota.setVozActiva(marcado)}
			/>
			<Button type="button" variant="soft" block onclick={() => mascota.repetirBienvenida()}>Ver la bienvenida otra vez</Button>
			<Button type="button" variant="soft" block onclick={() => mascota.repetirCorto()}>{textos.corto.verOtraVez}</Button>
		</div>
	</Section>

	<SeccionAvisos preferencias={data.preferencias} />

	<Section title={textos.ajustes.instalar}>
		{#if estadoInstalacion === 'instalable' || estadoInstalacion === 'ios'}
			<TarjetaInstalacion compacta estado={estadoInstalacion} oninstalar={() => void instalacion?.instalar()} />
		{:else if estadoInstalacion === 'instalada'}
			<p class="rounded-panel border border-hairline bg-wall-base p-4 text-[15px] leading-6 text-ink-muted">
				{textos.instalacion.yaInstalada}
			</p>
		{:else}
			<div class="rounded-panel border border-hairline bg-wall-base p-4 text-[15px] leading-6 text-ink-muted">
				<p class="font-semibold text-ink">{textos.instalacion.manualTitulo}</p>
				<p>{textos.instalacion.manual}</p>
				<p>{textos.instalacion.otroNavegador}</p>
			</div>
		{/if}
		{#if diagnostico}
			{@const si = (valor: boolean) => (valor ? textos.instalacion.si : textos.instalacion.no)}
			<div class="mt-4 rounded-panel border border-hairline bg-wall-base p-4 text-[15px] leading-6">
				<h3 class="font-semibold text-ink">{textos.instalacion.diagnosticoTitulo}</h3>
				<p class="text-[13px] text-ink-muted">{textos.instalacion.diagnosticoAyuda}</p>
				<dl class="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
					<dt>{textos.instalacion.conexionSegura}</dt>
					<dd class="font-semibold">{si(diagnostico.conexionSegura)}</dd>
					<dt>{textos.instalacion.trabajadorActivo}</dt>
					<dd class="font-semibold">{si(diagnostico.trabajadorActivo)}</dd>
					<dt>{textos.instalacion.avisoRecibido}</dt>
					<dd class="font-semibold">{si(diagnostico.avisoRecibido)}</dd>
					<dt>{textos.instalacion.instalada}</dt>
					<dd class="font-semibold">{si(diagnostico.instalada)}</dd>
					<dt>{textos.instalacion.resultado}</dt>
					<dd class="font-semibold">
						{diagnostico.resultado ? textos.instalacion.resultados[diagnostico.resultado] : textos.instalacion.resultadoNinguno}
					</dd>
				</dl>
			</div>
		{/if}
	</Section>
</div>
