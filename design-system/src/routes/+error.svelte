<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '#lib';

	// 404 → no encontrada · 403/401 → sin permiso (RF-122, RN-061) · resto → fallo del servidor.
	const kind = $derived(page.status === 404 ? 'no-encontrada' : page.status === 403 || page.status === 401 ? 'sin-permiso' : 'servidor');
</script>

<div class="wall-blobs flex min-h-dvh items-center justify-center px-5 py-10">
	<main class="w-full"><ErrorPage {kind} code={page.status} /></main>
</div>
