<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/fraunces';
	import { onMount } from 'svelte';
	import { crearContextoAvisos, crearContextoNotificaciones, crearContextoTema, ToastRegion } from '#lib/ui';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Estado de la aplicación por petición de navegador: se comparte con los componentes por contexto (no por módulo).
	const tema = crearContextoTema();
	crearContextoAvisos();
	crearContextoNotificaciones();

	// Sincroniza el tema con el que ya aplicó el script de app.html y sigue los cambios del sistema.
	onMount(() => {
		tema.iniciar();
		return () => tema.destruir();
	});
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

{@render children()}

<ToastRegion />
