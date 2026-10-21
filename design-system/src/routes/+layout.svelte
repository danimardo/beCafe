<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/fraunces';
	import { onMount } from 'svelte';
	import { theme } from '#lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Sincroniza el estado del tema con el que ya aplicó el script de app.html.
	onMount(() => theme.init());
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

{@render children()}
