<script lang="ts">
	import Bell from '@lucide/svelte/icons/bell';
	import { cn } from './utils';

	type Props = {
		/** Avisos sin abrir. El número también va en el nombre accesible: el color no es la única señal. */
		nuevos: number;
		/** Destino de la acción que abre el panel, p. ej. `/avisos?/abrir`. */
		accion: string;
		class?: string;
	};
	let { nuevos, accion, class: className }: Props = $props();
</script>

<!-- Campana de la cabecera (RF-107). Es un formulario: sin JavaScript abre la página de avisos igual. -->
<form method="post" action={accion}>
	<button
		type="submit"
		class={cn(
			'glass relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink active:scale-95 motion-safe:transition',
			className,
		)}
		aria-label={nuevos > 0 ? `${nuevos} avisos nuevos` : 'Avisos'}
	>
		<Bell class="size-5" aria-hidden="true" />
		{#if nuevos > 0}
			<span
				class="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-on-accent ring-2 ring-[color:var(--wall-base)]"
				aria-hidden="true">{nuevos > 9 ? '9+' : nuevos}</span
			>
		{/if}
	</button>
</form>
