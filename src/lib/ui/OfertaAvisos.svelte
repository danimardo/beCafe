<script lang="ts">
	import Button from './Button.svelte';
	import Capsulito from './Capsulito.svelte';

	type Props = {
		/** Pide el permiso del navegador y suscribe el dispositivo. Solo se llama desde el clic de «Activar avisos». */
		onactivar: () => void | Promise<void>;
		/** Cierra la oferta sin activar nada. */
		onahoranoo: () => void;
	};
	let { onactivar, onahoranoo }: Props = $props();
	let enCurso = $state(false);

	async function activar() {
		enCurso = true;
		await onactivar();
	}
</script>

<!-- Oferta única de avisos (RF-207). Superficie estable; el texto contiene el mensaje completo, Capsulito es decorativo. -->
<section
	class="flex items-start gap-3 rounded-panel border border-hairline bg-wall-base p-4 text-ink"
	aria-labelledby="oferta-avisos-titulo"
>
	<Capsulito momento="acceso-hola" size="sm" modo="svg" mensaje={null} />
	<div class="flex min-w-0 flex-1 flex-col gap-3">
		<h2 id="oferta-avisos-titulo" class="text-[17px] font-semibold">¿Te aviso de las novedades?</h2>
		<p class="text-[15px] leading-6 text-ink-muted">
			Puedo avisarte cuando queden pocas cápsulas o cuando alguien te haga una aportación. Tu navegador te pedirá permiso.
		</p>
		<div class="flex flex-wrap gap-2">
			<Button onclick={activar} disabled={enCurso}>Activar avisos</Button>
			<Button variant="ghost" onclick={onahoranoo} disabled={enCurso}>Ahora no</Button>
		</div>
	</div>
</section>
