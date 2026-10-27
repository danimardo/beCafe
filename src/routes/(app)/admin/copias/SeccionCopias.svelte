<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '#lib/ui';

	// Sección de «Copias de seguridad» con el fondo y el icono de su función (RF-275, DEC-138). Solo tokens; sin cristal.
	type Tono = 'estado' | 'bucket' | 'restaurar' | 'prueba';
	type Props = {
		titulo: string;
		tono: Tono;
		icono: Component<{ class?: string; 'aria-hidden'?: 'true' }>;
		children: Snippet;
	};
	let { titulo, tono, icono: Icono, children }: Props = $props();

	const SUPERFICIES: Record<Tono, string> = {
		estado: 'border-accent/40 bg-accent-soft',
		bucket: 'border-hairline bg-wall-raised',
		restaurar: 'border-warning/50 bg-warning-soft',
		prueba: 'border-hairline bg-wall-base',
	};
	const ICONOS: Record<Tono, string> = {
		estado: 'text-accent',
		bucket: 'text-ink-muted',
		restaurar: 'text-warning',
		prueba: 'text-ink-muted',
	};
</script>

<section class={cn('rounded-panel border p-4', SUPERFICIES[tono])}>
	<h2 class="type-title-lg mb-3 flex items-center gap-2">
		<Icono class={cn('size-5 shrink-0', ICONOS[tono])} aria-hidden="true" />
		<span>{titulo}</span>
	</h2>
	{@render children()}
</section>
