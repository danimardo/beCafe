<script lang="ts">
	import Corto from './Corto.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { modo?: 'antesDeEntrar' | 'dialogo' };
	let { modo = 'antesDeEntrar' }: Props = $props();

	const mascota = crearContextoMascota();
	mascota.visible = true;
	let estado = $state('pendiente');
</script>

<p>Estado del corto: {estado}</p>
<Corto {modo} onSaltar={() => (estado = 'saltado')} onTerminar={() => (estado = 'terminado')} />
