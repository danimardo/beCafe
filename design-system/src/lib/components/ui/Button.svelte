<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { buttonClasses, type ButtonSize, type ButtonVariant } from '#lib/utils';

	type Common = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** Ocupa todo el ancho disponible. */
		block?: boolean;
		/** Muestra un indicador y bloquea el botón mientras se envía (aria-busy). */
		loading?: boolean;
		class?: string;
		children?: Snippet;
	};
	type Props = Common & (({ href: string } & Omit<HTMLAnchorAttributes, 'class'>) | ({ href?: undefined } & Omit<HTMLButtonAttributes, 'class'>));

	let { variant = 'primary', size = 'md', block = false, loading = false, class: className, children, href, ...rest }: Props = $props();
	const classes = $derived(buttonClasses(variant, size, block, className));
</script>

{#if href}
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>{@render children?.()}</a>
{:else}
	<button
		type="button"
		class={classes}
		aria-busy={loading || undefined}
		disabled={loading || (rest as HTMLButtonAttributes).disabled}
		{...rest as HTMLButtonAttributes}
	>
		{#if loading}<LoaderCircle class="size-5 motion-safe:animate-spin" aria-hidden="true" />{/if}
		{@render children?.()}
	</button>
{/if}
