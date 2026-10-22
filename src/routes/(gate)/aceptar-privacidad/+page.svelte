<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button, PageHeader, PrivacyText } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.privacidad.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
	<PageHeader title={textos.privacidad.titulo} />
	<p class="text-[15px] text-ink">{data.primeraVez ? textos.privacidad.primeraVez : textos.privacidad.versionNueva}</p>

	<PrivacyText version={data.version} />

	<form method="post" action="?/aceptar" use:enhance>
		<Button type="submit" block>{textos.privacidad.aceptar}</Button>
	</form>
</main>
