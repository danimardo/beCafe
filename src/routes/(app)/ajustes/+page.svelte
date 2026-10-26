<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { Button, PageHeader, Section, Switch, TarjetaInstalacion, ThemeToggle, usarMascota, usarTema } from '#lib/ui';
	import { crearInstalacion, type EstadoInstalacion } from '#lib/client/instalacion';
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
	onMount(() => {
		instalacion = crearInstalacion(window, (estado) => (estadoInstalacion = estado));
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
		{:else}
			<p class="rounded-panel border border-hairline bg-wall-base p-4 text-[15px] leading-6 text-ink-muted">
				{estadoInstalacion === 'instalada'
					? 'beCafé ya está instalada en este dispositivo.'
					: 'Este navegador no ofrece instalar la aplicación. Prueba con Chrome en Android o con Safari en iPhone y iPad.'}
			</p>
		{/if}
	</Section>
</div>
