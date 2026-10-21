<script lang="ts">
	import { Banner, Button, Glass, PageHeader, Section } from '#lib';
</script>

<PageHeader eyebrow="Ayuda" title="Instalar la app" />

<Banner tone="info" title="En iPhone y iPad hace falta instalarla primero">
	Los avisos solo funcionan si añades la app a la pantalla de inicio (iOS 16.4 o superior).
</Banner>

<Section title="iPhone y iPad (Safari)">
	<Glass as="div">
		<ol class="list-decimal space-y-2 pl-5 text-[15px] leading-5 marker:font-semibold marker:text-accent">
			<li>Abre la app en Safari.</li>
			<li>Toca el botón <b>Compartir</b>.</li>
			<li>Elige <b>Añadir a pantalla de inicio</b> y confirma.</li>
			<li>Abre «beCafé» desde el icono nuevo y activa los avisos.</li>
		</ol>
	</Glass>
</Section>

<Section title="Android (Chrome)">
	<Glass as="div">
		<ol class="list-decimal space-y-2 pl-5 text-[15px] leading-5 marker:font-semibold marker:text-accent">
			<li>Abre la app en Chrome.</li>
			<li>Toca el menú <b>⋮</b> y elige <b>Instalar aplicación</b>.</li>
			<li>Abre «beCafé» desde el icono nuevo y activa los avisos.</li>
		</ol>
	</Glass>
</Section>

<div class="mt-6"><Button size="lg" block>Activar notificaciones</Button></div>
