<script lang="ts">
	import SegmentedControl from './SegmentedControl.svelte';
	import { usarTema, type PreferenciaTema } from './contextos/tema.svelte';

	// Selector de apariencia: Automático (sigue al dispositivo), Claro u Oscuro (RF-180).
	const tema = usarTema();

	function alCambiar(valor: PreferenciaTema) {
		tema.cambiar(valor);
	}
</script>

<SegmentedControl
	value={tema.preferencia}
	label="Apariencia"
	options={[
		{ value: 'auto', label: 'Automático' },
		{ value: 'claro', label: 'Claro' },
		{ value: 'oscuro', label: 'Oscuro' },
	]}
	onchange={alCambiar}
/>
