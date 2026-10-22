<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from './utils';

	type Props = HTMLAttributes<HTMLElement> & {
		/** Etiqueta HTML a renderizar. */
		as?: keyof HTMLElementTagNameMap;
		/** Cristal más opaco, para lo que flota encima de otro contenido. */
		strong?: boolean;
		radius?: 'chip' | 'tile' | 'panel' | 'sheet' | 'full';
		/** Relleno interior de 16 px. Desactívalo si el contenido gestiona su propio relleno. */
		padded?: boolean;
		children?: Snippet;
	};

	let { as = 'div', strong = false, radius = 'panel', padded = true, class: className, children, ...rest }: Props = $props();

	const radii = {
		chip: 'rounded-chip',
		tile: 'rounded-tile',
		panel: 'rounded-panel',
		sheet: 'rounded-sheet',
		full: 'rounded-full',
	};
</script>

<svelte:element this={as} class={cn(strong ? 'glass-strong' : 'glass', radii[radius], padded && 'p-4', className)} {...rest}>
	{@render children?.()}
</svelte:element>
