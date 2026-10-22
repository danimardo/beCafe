<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button, Glass } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
	<h1 class="font-serif text-3xl font-semibold text-ink">{textos.inicio.saludo(data.nombre)}</h1>
	{#if data.privacidadAceptada}
		<p role="status" class="text-[15px] text-ink">{textos.confirmaciones.privacidadAceptada}</p>
	{/if}
	<Glass class="flex flex-col gap-4">
		<a class="text-accent underline" href={resolve('/(app)/perfil')}>{textos.perfil.titulo}</a>
		<form method="post" action="/logout" use:enhance>
			<Button type="submit" variant="soft" block>{textos.inicio.cerrarSesion}</Button>
		</form>
	</Glass>
</main>
