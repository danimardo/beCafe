<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from '../ThemeToggle.svelte';
	import { crearContextoTema } from '../contextos/tema.svelte';

	// Monta el contexto de apariencia igual que el layout raíz, para probar `ThemeToggle` aislado (T082).
	const tema = crearContextoTema();
	onMount(() => {
		tema.iniciar();
		return () => tema.destruir();
	});
</script>

<ThemeToggle />
