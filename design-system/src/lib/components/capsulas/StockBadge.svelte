<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Badge from '../ui/Badge.svelte';

	type Props = {
		/** «low»: stock ≤ umbral (RN-071). «out»: stock ≤ 0 (RN-070, puede ser negativo). */
		level: 'low' | 'out';
	};
	let { level }: Props = $props();
</script>

<!-- Siempre icono + texto: el color nunca es la única señal (WCAG 1.4.1). -->
{#if level === 'out'}
	<Badge tone="negative">
		{#snippet icon()}<CircleAlert class="size-3.5" />{/snippet}
		Sin stock
	</Badge>
{:else}
	<Badge tone="warning">
		{#snippet icon()}<TriangleAlert class="size-3.5" />{/snippet}
		Stock bajo
	</Badge>
{/if}
