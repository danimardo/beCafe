<!-- Página de reserva que el service worker sirve al abrir una pantalla sin conexión y sin caché (RF-019). -->
<script lang="ts">
	import { ErrorPage } from '#lib';
</script>

<svelte:head><title>Sin conexión · beCafé</title></svelte:head>
<div class="wall-blobs flex min-h-dvh items-center justify-center px-5 py-10">
	<main class="w-full"><ErrorPage kind="sin-conexion" /></main>
</div>
