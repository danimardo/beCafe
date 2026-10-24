<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { BackLink, PageHeader, PrivacyText } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.privacidad.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/perfil')} label={textos.privacidad.volver} />
	<PageHeader title={textos.privacidad.enlace} />
	<PrivacyText version={data.version} />
</div>
