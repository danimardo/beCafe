<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '#lib';
	import type { ErrorKind } from '#lib';

	// Ruta de demostración para ver 403 y 500 sin provocarlos: /errores/sin-permiso · /errores/servidor · /errores/sin-conexion
	const valid = ['no-encontrada', 'sin-permiso', 'servidor', 'sin-conexion'];
	const kind = $derived((valid.includes(page.params.tipo ?? '') ? page.params.tipo : 'no-encontrada') as ErrorKind);
</script>

<div class="wall-blobs flex min-h-dvh items-center justify-center px-5 py-10">
	<main class="w-full"><ErrorPage {kind} /></main>
</div>
