<script lang="ts">
	import UndoToast from './UndoToast.svelte';
	import { usarAvisos } from './contextos/avisos.svelte';

	const avisos = usarAvisos();
</script>

<!-- Región viva SIEMPRE montada: así el lector de pantalla anuncia el aviso cuando aparece (RF-013).
     Va en AppShell. Se coloca sobre la barra de navegación en móvil y abajo a la derecha en escritorio. -->
<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class="pointer-events-none fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[60] flex justify-center md:inset-x-auto md:bottom-6 md:right-6"
>
	{#if avisos.actual}
		{#key avisos.actual.id}
			<UndoToast toast={avisos.actual} onclose={() => avisos.cerrar()} />
		{/key}
	{/if}
</div>
