<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const noEncontrada = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{noEncontrada ? 'Página no encontrada' : 'Error'} · beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
	<h1 class="font-serif text-2xl font-semibold text-ink">{noEncontrada ? 'No encontramos esa página' : 'Algo ha fallado'}</h1>
	<p class="text-ink-muted">
		{noEncontrada
			? 'Revisa la dirección o vuelve al inicio.'
			: 'Inténtalo de nuevo. Si vuelve a pasar, comunica el código de incidencia a la persona administradora.'}
	</p>
	{#if page.error?.codigo}
		<p class="text-sm text-ink-muted">Código de incidencia: <code>{page.error.codigo}</code></p>
	{/if}
	<a class="text-accent underline" href={resolve('/(app)')}>Volver al inicio</a>
</main>
