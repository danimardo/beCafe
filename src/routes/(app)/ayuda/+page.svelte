<script lang="ts">
	import { resolve } from '$app/paths';
	import { BackLink, Button, Capsulito, PageHeader, Section, usarMascota } from '#lib/ui';
	import { ESCENAS_BIENVENIDA } from '#lib/shared/mascota/bienvenida';
	import { textos } from '#lib/shared/textos';

	const mascota = usarMascota();
</script>

<svelte:head>
	<title>{textos.notificaciones.ayuda.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
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

	<Section title="Cómo funciona beCafé">
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center gap-3">
				<Button type="button" variant="soft" onclick={() => mascota.repetirBienvenida()}>Ver la bienvenida</Button>
				<a class="text-[15px] font-medium text-accent underline" href={resolve('/(app)/ayuda/capsulito')}> Laboratorio de Capsulito </a>
			</div>

			<ol class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each ESCENAS_BIENVENIDA as escena, indice (escena.id)}
					<li class="flex items-start gap-3 rounded-panel border border-hairline bg-wall-base p-4">
						<Capsulito momento={escena.momento} poseRiv={escena.poseRiv} expresion={escena.expresion} size="sm" modo="svg" mensaje={null} />
						<div class="min-w-0 flex-1">
							<p class="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
								Paso {indice + 1} de {ESCENAS_BIENVENIDA.length}
							</p>
							<h3 class="mt-0.5 text-[16px] font-semibold leading-5 text-ink">{escena.titulo}</h3>
							<p class="mt-1 text-[14px] leading-5 text-ink-muted">{escena.texto}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</Section>
</div>
