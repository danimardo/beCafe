<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, PageHeader } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
</script>

<svelte:head>
	<title>{textos.notificaciones.ayuda.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
	<BackLink href={resolve('/(app)/perfil')} label={textos.perfil.volver} />
	<PageHeader title={textos.notificaciones.ayuda.titulo} />

	<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5 text-[15px] leading-6 text-ink">
		<p>{textos.notificaciones.ayuda.instalar}</p>
		<p>{textos.notificaciones.ayuda.android}</p>
		<p>{textos.notificaciones.ayuda.ios}</p>
		<p>{textos.notificaciones.ayuda.permiso}</p>
		<noscript>
			<p>{textos.notificaciones.ayuda.sinJs}</p>
		</noscript>
	</div>
</main>
