<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { textos } from '#lib/shared/textos';

	// Solo los rechazos de permiso (403) muestran su mensaje, que es texto propio de la aplicación. Cualquier otro error
	// muestra el texto genérico y el código de incidencia, sin detalles internos (constitución XIII).
	const noEncontrada = $derived(page.status === 404);
	const sinPermiso = $derived(page.status === 403);
	const titulo = $derived(
		noEncontrada ? textos.errorPagina.noEncontrada : sinPermiso ? textos.errorPagina.sinPermiso : textos.errorPagina.titulo,
	);
	const ayuda = $derived(
		noEncontrada ? textos.errorPagina.noEncontradaAyuda : sinPermiso ? (page.error?.message ?? '') : textos.errorPagina.ayuda,
	);
</script>

<svelte:head>
	<title>{titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
	<h1 class="font-serif text-2xl font-semibold text-ink">{titulo}</h1>
	<p class="text-ink-muted">{ayuda}</p>
	{#if page.error?.codigo && !sinPermiso && !noEncontrada}
		<p class="text-sm text-ink-muted">{textos.errorPagina.codigo} <code>{page.error.codigo}</code></p>
	{/if}
	<a class="text-accent underline" href={resolve('/(app)')}>{textos.errorPagina.volverInicio}</a>
</main>
