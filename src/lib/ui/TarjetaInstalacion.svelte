<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import Button from './Button.svelte';

	type Props = {
		/** `instalable`: botón del sistema (Android, Chrome). `ios`: instrucciones de Safari. */
		estado: 'instalable' | 'ios';
		oninstalar?: () => void;
		/** Sin esta función no se muestra «Ahora no» (en Perfil la opción es permanente). */
		ondescartar?: () => void;
		/** En Perfil, el título lo pone la sección. */
		compacta?: boolean;
	};
	let { estado, oninstalar, ondescartar, compacta = false }: Props = $props();
</script>

<!-- Tarjeta de instalación (RF-206). Superficie estable, no cristal: lleva botones y texto de pasos (constitución XVIII). -->
<section
	class="flex flex-col gap-3 rounded-panel border border-hairline bg-wall-base p-4 text-ink"
	aria-labelledby={compacta ? undefined : 'instalar-titulo'}
>
	{#if !compacta}
		<h2 id="instalar-titulo" class="flex items-center gap-2 text-[17px] font-semibold">
			<Download class="size-5 text-accent" aria-hidden="true" />
			Instalar beCafé
		</h2>
	{/if}
	{#if estado === 'instalable'}
		<p class="text-[15px] leading-6 text-ink-muted">
			Ábrela desde tu pantalla de inicio, como una aplicación más, y registra tu café más rápido.
		</p>
	{:else}
		<p class="text-[15px] leading-6 text-ink-muted">En el iPhone y el iPad se instala desde Safari:</p>
		<ol class="list-decimal pl-5 text-[15px] leading-6">
			<li>Pulsa «Compartir» en la barra de Safari.</li>
			<li>Elige «Añadir a pantalla de inicio».</li>
			<li>Pulsa «Añadir».</li>
		</ol>
	{/if}
	{#if estado === 'instalable' || ondescartar}
		<div class="flex flex-wrap gap-2">
			{#if estado === 'instalable'}<Button onclick={oninstalar}>Instalar</Button>{/if}
			{#if ondescartar}<Button variant="ghost" onclick={ondescartar}>Ahora no</Button>{/if}
		</div>
	{/if}
</section>
