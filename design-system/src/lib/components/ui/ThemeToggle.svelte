<script lang="ts">
	import { theme, type ThemePreference } from '#lib/theme.svelte';
	import SegmentedControl from './SegmentedControl.svelte';

	// Selector de apariencia del perfil: Automático (sigue al dispositivo), Claro u Oscuro.
	let value = $state<ThemePreference>(theme.preference);
	$effect(() => {
		value = theme.preference;
	});
</script>

<SegmentedControl
	bind:value
	label="Apariencia"
	options={[
		{ value: 'auto', label: 'Automático' },
		{ value: 'claro', label: 'Claro' },
		{ value: 'oscuro', label: 'Oscuro' }
	]}
	onchange={(v) => theme.set(v)}
/>
