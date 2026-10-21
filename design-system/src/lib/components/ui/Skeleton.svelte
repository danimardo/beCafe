<script lang="ts">
	import { cn } from '#lib/utils';
	/** Marcador de carga. Usa tamaño con `class`, p. ej. «h-4 w-32». */
	let { class: className }: { class?: string } = $props();
</script>

<span aria-hidden="true" class={cn('block rounded-chip bg-accent-soft motion-safe:animate-pulse', className)}></span>
