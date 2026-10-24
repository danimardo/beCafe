<script lang="ts">
	import Bienvenida from './Bienvenida.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { nombre: string; voz?: boolean };
	let { nombre, voz = false }: Props = $props();

	const mascota = crearContextoMascota();
	mascota.visible = true;
	mascota.animar = false;
	mascota.bienvenidaVista = false;
	const vozInicial = () => voz;
	mascota.vozActiva = vozInicial();
</script>

<p>Estado bienvenida: {mascota.bienvenidaVista ? 'vista' : 'pendiente'}</p>
<Bienvenida {nombre} />
