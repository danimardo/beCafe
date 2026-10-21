<script lang="ts">
	import { BrandMark } from '#lib';
	let { children } = $props();
</script>

<!-- PROPUESTO. Pantallas BLOQUEANTES: sin navegación, sin campana, sin enlaces al resto de la app. Solo se sale con la acción propia
     de la pantalla o cerrando sesión. El servidor redirige aquí desde cualquier ruta (RF-160) hasta cumplirse la condición. -->
<div class="wall-blobs min-h-dvh">
	<main id="contenido" class="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
		<div class="mb-5 mt-2"><BrandMark size="md" /></div>
		{@render children()}
	</main>
</div>
