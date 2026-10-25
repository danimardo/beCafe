<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import Check from '@lucide/svelte/icons/check';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { buttonClasses, type ButtonSize, type ButtonVariant } from './utils';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** Ocupa todo el ancho disponible. */
		block?: boolean;
		/** Muestra un indicador y bloquea el botón mientras se envía (aria-busy). */
		loading?: boolean;
		/** Muestra un check de «guardado». La página lo activa solo cuando el servidor confirma el guardado (RF-236). */
		success?: boolean;
		class?: string;
		children?: Snippet;
		/** Destino ya resuelto con `resolve()`. Si se indica, el control es un enlace y no un botón. */
		href?: ResolvedPathname;
		/** Atributos que usa la interfaz. Se amplían aquí cuando una pantalla necesite otro. */
		id?: string;
		name?: string;
		/** Valor enviado con `name` (p. ej. aprobar o rechazar en el mismo formulario). */
		value?: string;
		form?: string;
		/** Otra acción del mismo formulario (p. ej. «Añadir línea» sin JavaScript). */
		formaction?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		title?: string;
		'aria-label'?: string;
		'aria-describedby'?: string;
		'aria-pressed'?: boolean;
		onclick?: (event: MouseEvent) => void;
	};

	let {
		variant = 'primary',
		size = 'md',
		block = false,
		loading = false,
		success = false,
		class: className,
		children,
		href,
		...rest
	}: Props = $props();
	const classes = $derived(buttonClasses(variant, size, block, className));
</script>

{#if href}
	<a {href} class={classes} {...rest}>{@render children?.()}</a>
{:else}
	<button type="button" class={classes} aria-busy={loading || undefined} disabled={loading || rest.disabled} {...rest}>
		{#if loading}<LoaderCircle class="size-5 motion-safe:animate-spin" aria-hidden="true" />{:else if success}<Check
				class="marca-exito size-5"
				aria-hidden="true"
			/>{/if}
		{@render children?.()}
	</button>
{/if}
