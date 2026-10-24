<script lang="ts">
	import Bienvenida from './Bienvenida.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { nombre: string };
	let { nombre }: Props = $props();

	const mascota = crearContextoMascota();
	mascota.visible = true;
	mascota.animar = false;
	mascota.bienvenidaVista = false;
</script>

<p>Estado bienvenida: {mascota.bienvenidaVista ? 'vista' : 'pendiente'}</p>
<Bienvenida {nombre} />
