<script lang="ts">
	import Capsulito from './Capsulito.svelte';
	import { crearContextoMascota } from './contextos/mascota.svelte';

	type Props = { size?: 'sm' | 'md' | 'lg'; reducirMovimiento?: boolean; callado?: boolean };
	let { size = 'md', reducirMovimiento = false, callado = false }: Props = $props();

	const mascota = crearContextoMascota();
	const reducir = () => reducirMovimiento;
	mascota.visible = true;
	mascota.animar = !reducir();
</script>

<button type="button" onclick={() => (mascota.audioEnCurso = 'prueba')}>Hablar</button>
<button type="button" onclick={() => (mascota.audioEnCurso = null)}>Callar</button>
<Capsulito pose="saludando" {size} mensaje={null} {callado} />
