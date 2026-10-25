<script lang="ts">
	import { resolve } from '$app/paths';
	import Capsulito from './Capsulito.svelte';
	import Sheet from './Sheet.svelte';
	import { CATALOGO_AYUDA, type IdPantalla } from '#lib/shared/ayuda/pantallas';

	type Props = {
		open?: boolean;
		pantalla: IdPantalla;
	};
	let { open = $bindable(false), pantalla }: Props = $props();
	const entrada = $derived(CATALOGO_AYUDA[pantalla]);
</script>

<!-- Ayuda de Capsulito para la pantalla actual (RF-203). Hoja inferior en móvil y diálogo en escritorio, sobre superficie estable. -->
<Sheet bind:open title={`Ayuda: ${entrada.titulo}`}>
	<div class="flex flex-col gap-4 rounded-panel bg-wall-base p-4 text-[15px] leading-6 text-ink">
		<div class="flex items-start gap-3">
			<Capsulito momento="acceso-hola" size="sm" modo="svg" mensaje={null} />
			<p class="min-w-0 flex-1">{entrada.proposito}</p>
		</div>
		{#if entrada.acciones.length > 0}
			<section>
				<h3 class="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Qué puedes hacer</h3>
				<dl class="mt-1 flex flex-col gap-2">
					{#each entrada.acciones as accion (accion.nombre)}
						<div>
							<dt class="font-semibold">{accion.nombre}</dt>
							<dd class="text-ink-muted">{accion.explicacion}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}
		{#if entrada.campos.length > 0}
			<section>
				<h3 class="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Campos</h3>
				<dl class="mt-1 flex flex-col gap-2">
					{#each entrada.campos as campo (campo.nombre)}
						<div>
							<dt class="font-semibold">{campo.nombre}</dt>
							<dd class="text-ink-muted">{campo.explicacion}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}
		{#if pantalla === 'inicio'}
			<!-- RF-204: el tour se repite desde aquí. Es una navegación a Inicio con `tour=si`, con un formulario GET. -->
			<form method="get" action={resolve('/(app)')}>
				<input type="hidden" name="tour" value="si" />
				<button type="submit" class="min-h-6 font-semibold text-accent underline">Repetir el tour</button>
			</form>
		{/if}
	</div>
</Sheet>
