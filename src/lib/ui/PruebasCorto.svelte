<script lang="ts">
	import Corto from './Corto.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { modo?: 'antesDeEntrar' | 'dialogo'; animar?: boolean };
	let { modo = 'antesDeEntrar', animar = false }: Props = $props();

	const mascota = crearContextoMascota();
	mascota.visible = true;
	const animarInicial = () => animar;
	mascota.animar = animarInicial();
	let estado = $state('pendiente');
</script>

<p>Estado del corto: {estado}</p>
<Corto {modo} onSaltar={() => (estado = 'saltado')} onTerminar={() => (estado = 'terminado')} />
