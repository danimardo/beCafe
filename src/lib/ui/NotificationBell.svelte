<script lang="ts">
	import Bell from '@lucide/svelte/icons/bell';
	import { usarNotificaciones } from './contextos/notificaciones.svelte';
	import { cn } from './utils';

	type Props = { class?: string };
	let { class: className }: Props = $props();
	const avisos = usarNotificaciones();
	const count = $derived(avisos.sinLeer);
</script>

<!-- Campana de la cabecera (RF-107). El número también va en el nombre accesible: el color no es la única señal. -->
<button
	type="button"
	class={cn(
		'glass relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink active:scale-95 motion-safe:transition',
		className,
	)}
	aria-label={count > 0 ? `Avisos, ${count} sin leer` : 'Avisos'}
	aria-haspopup="dialog"
	onclick={() => avisos.abrirPanel()}
>
	<Bell class="size-5" aria-hidden="true" />
	{#if count > 0}
		<span
			class="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-on-accent ring-2 ring-[color:var(--wall-base)]"
			aria-hidden="true">{count > 9 ? '9+' : count}</span
		>
	{/if}
</button>
