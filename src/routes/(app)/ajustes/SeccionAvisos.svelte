<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Section } from '#lib/ui';
	import { activarPush, desactivarPush, estadoPush, type EstadoPush } from '#lib/client/push';
	import { textos } from '#lib/shared/textos';

	type Preferencia = {
		tipo: keyof typeof textos.notificaciones.tipos;
		activada: boolean;
		editable: boolean;
	};

	let { preferencias }: { preferencias: Preferencia[] } = $props();

	let estado = $state<EstadoPush | undefined>(undefined);
	let aviso = $state('');

	// Lee el estado del navegador en este dispositivo: es una API externa, no estado derivado.
	$effect(() => {
		void estadoPush().then((actual) => (estado = actual));
	});

	async function activar() {
		estado = await activarPush();
		aviso = estado === 'activado' ? textos.notificaciones.activadoOk : textos.notificaciones.fallo;
	}

	async function desactivar() {
		estado = await desactivarPush();
		aviso = estado === 'sin_activar' ? textos.notificaciones.desactivadoOk : textos.notificaciones.fallo;
	}

	const textoDispositivo = $derived(
		estado === 'no_compatible'
			? textos.notificaciones.dispositivo.noCompatible
			: estado === 'denegado'
				? textos.notificaciones.dispositivo.denegado
				: estado === 'activado'
					? textos.notificaciones.dispositivo.activado
					: textos.notificaciones.dispositivo.sinActivar,
	);
</script>

<Section title={textos.notificaciones.seccion}>
	<div class="flex flex-col gap-5 rounded-panel border border-hairline bg-wall-base p-5">
		<p class="text-[13px] leading-[18px] text-ink-muted">{textos.notificaciones.ayudaSeccion}</p>

		<div class="flex flex-col gap-2">
			<p class="text-[15px] text-ink">{textoDispositivo}</p>
			{#if estado === 'sin_activar'}
				<button type="button" class="self-start rounded-chip bg-accent px-4 py-2 text-[15px] text-white" onclick={activar}>
					{textos.notificaciones.activar}
				</button>
			{:else if estado === 'activado'}
				<button type="button" class="self-start rounded-chip border border-hairline px-4 py-2 text-[15px] text-ink" onclick={desactivar}>
					{textos.notificaciones.desactivar}
				</button>
			{/if}
			{#if aviso}
				<p role="status" class="text-[13px] text-ink-muted">{aviso}</p>
			{/if}
			<a class="text-[13px] text-accent underline" href={resolve('/(app)/ayuda')}>{textos.notificaciones.ayuda.titulo}</a>
		</div>

		<ul class="flex flex-col gap-4">
			{#each preferencias as preferencia (preferencia.tipo)}
				{@const textoTipo = textos.notificaciones.tipos[preferencia.tipo]}
				<li class="flex min-h-11 items-center justify-between gap-4">
					<div class="min-w-0 flex-1">
						<p id="aviso-{preferencia.tipo}" class="text-[15px] font-medium text-ink">{textoTipo.titulo}</p>
						<p class="text-[13px] leading-[18px] text-ink-muted">{textoTipo.ayuda}</p>
					</div>
					{#if preferencia.editable}
						<form method="post" action="?/preferencia" use:enhance>
							<input type="hidden" name="tipo" value={preferencia.tipo} />
							<button
								type="submit"
								name="activada"
								value={preferencia.activada ? 'no' : 'si'}
								role="switch"
								aria-checked={preferencia.activada}
								aria-labelledby="aviso-{preferencia.tipo}"
								class="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink-muted bg-transparent p-0.5 motion-safe:transition aria-checked:border-accent aria-checked:bg-accent"
							>
								<span
									class="block size-5 rounded-full bg-ink-muted motion-safe:transition group-aria-checked:translate-x-6 group-aria-checked:bg-white"
								></span>
							</button>
						</form>
					{:else}
						<p class="text-[13px] font-medium text-ink-muted">{textos.notificaciones.siempreActivado}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</Section>
