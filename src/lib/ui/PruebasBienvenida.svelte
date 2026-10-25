<script lang="ts">
	import { resolve } from '$app/paths';
	import Bienvenida from './Bienvenida.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { nombre?: string; voz?: boolean; modo?: 'autenticada' | 'antesDeEntrar'; visitante?: boolean };
	let { nombre = '', voz = false, modo = 'autenticada', visitante = false }: Props = $props();

	const mascota = crearContextoMascota();
	mascota.visible = true;
	mascota.animar = false;
	mascota.bienvenidaVista = false;
	const vozInicial = () => voz;
	mascota.vozActiva = vozInicial();
</script>

<p>Estado bienvenida: {mascota.bienvenidaVista ? 'vista' : 'pendiente'}</p>
<Bienvenida {nombre} {modo} {visitante} hrefEntrar={resolve('/(auth)/login')} />
