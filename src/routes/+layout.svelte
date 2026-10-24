<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/fraunces';
	import { onMount } from 'svelte';
	import { crearContextoAvisos, crearContextoMascota, crearContextoNotificaciones, crearContextoTema, ToastRegion } from '#lib/ui';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Estado de la aplicación por petición de navegador: se comparte con los componentes por contexto (no por módulo).
	const tema = crearContextoTema();
	const mascota = crearContextoMascota();
	crearContextoAvisos();
	crearContextoNotificaciones();

	// Sincroniza el tema y las preferencias de Capsulito con lo que ya aplicó el script de app.html.
	onMount(() => {
		tema.iniciar();
		mascota.iniciar();
		return () => {
			tema.destruir();
			mascota.destruir();
		};
	});
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

{@render children()}

<ToastRegion />
