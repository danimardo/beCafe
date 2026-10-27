<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import { crearInstalacion, estadoAEnviar, type Instalacion } from '#lib/client/instalacion';

	// Envía al servidor el estado de instalación de la persona (F16, RF-279). Funciona desde cualquier pantalla de la aplicación.
	// Un formulario con *action* enviado por código, sin esperar respuesta ni mostrar errores: no bloquea nada (RNF-F16-2, RNF-F16-3).
	type Props = { enServidor: 'instalada' | 'rechazada' | null };
	let { enServidor }: Props = $props();

	let estado = $state<'instalada' | 'rechazada'>('instalada');
	let formulario: HTMLFormElement | undefined = $state();
	let instalacion: Instalacion | undefined;
	let yaEnviado: 'instalada' | 'rechazada' | null = null;

	async function evaluar() {
		if (!instalacion) return;
		const aEnviar = estadoAEnviar(instalacion.diagnostico(), enServidor, yaEnviado);
		if (aEnviar === null) return;
		yaEnviado = aEnviar;
		estado = aEnviar;
		await tick();
		formulario?.requestSubmit();
	}

	onMount(() => {
		instalacion = crearInstalacion(window, () => void evaluar());
		void evaluar();
		return () => instalacion?.destruir();
	});
</script>

<form method="post" action="{resolve('/(app)')}?/registrarInstalacion" bind:this={formulario} use:enhance={() => async () => {}} hidden>
	<input type="hidden" name="estado" value={estado} />
</form>
