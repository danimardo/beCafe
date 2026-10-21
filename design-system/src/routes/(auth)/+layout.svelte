<script lang="ts">
	import { BrandMark } from '#lib';
	let { children } = $props();
</script>

<!-- Pantallas sin sesión: fondo con manchas y una tarjeta centrada. -->
<div class="wall-blobs flex min-h-dvh items-center justify-center px-5 py-10">
	<main class="w-full max-w-sm">
		<div class="mb-6 flex justify-center"><BrandMark size="lg" /></div>
		{@render children()}
	</main>
</div>
