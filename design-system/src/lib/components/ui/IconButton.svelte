<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils';

	type Props = Omit<HTMLButtonAttributes, 'aria-label'> & {
		/** Obligatorio: el botón no tiene texto visible. */
		label: string;
		variant?: 'glass' | 'ghost' | 'accent';
		children: Snippet;
	};
	let { label, variant = 'glass', class: className, children, ...rest }: Props = $props();
	const v = { glass: 'glass text-ink', ghost: 'text-ink hover:bg-accent-soft', accent: 'bg-accent text-on-accent' };
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	class={cn(
		'inline-flex size-11 shrink-0 items-center justify-center rounded-full active:scale-95 motion-safe:transition disabled:opacity-50',
		v[variant],
		className
	)}
	{...rest}
>
	{@render children()}
</button>
