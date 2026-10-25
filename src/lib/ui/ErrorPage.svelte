<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Compass from '@lucide/svelte/icons/compass';
	import FileQuestion from '@lucide/svelte/icons/file-question';
	import ShieldX from '@lucide/svelte/icons/shield-x';
	import ServerCrash from '@lucide/svelte/icons/server-crash';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import { textos } from '#lib/shared/textos';
	import Button from './Button.svelte';
	import Capsulito from './Capsulito.svelte';
	import Glass from './Glass.svelte';

	import type { ErrorKind } from './types';

	type Props = {
		kind: ErrorKind;
		/** Código de incidencia (solo en la 500): se muestra pequeño bajo el texto. */
		code?: string | number;
		/** Sustituye el texto del cuerpo si el servidor da uno más concreto (p. ej. «Solo un administrador puede ver esto»). */
		message?: string;
		/** Para «Reintentar» (servidor y sin conexión). Si no se pasa, se recarga la página. */
		onretry?: () => void;
		/** Destino «Ir al inicio», ya resuelto con `resolve()`. Sin destino, la página no ofrece ese enlace. */
		inicioHref?: ResolvedPathname;
	};
	let { kind, code, message, onretry, inicioHref }: Props = $props();

	const content = {
		peticion: { icon: FileQuestion, momento: 'error.peticion', ...textos.errorPagina.peticion },
		'no-encontrada': { icon: Compass, momento: 'error.no_encontrada', ...textos.errorPagina.noEncontrada },
		'sin-permiso': { icon: ShieldX, momento: 'error.sin_permiso', ...textos.errorPagina.sinPermiso },
		servidor: { icon: ServerCrash, momento: 'error.servidor', ...textos.errorPagina.servidor },
		'sin-conexion': { icon: WifiOff, momento: 'sin-conexion', ...textos.errorPagina.sinConexion },
	} as const;
	const c = $derived(content[kind]);
	const Icon = $derived(c.icon);
	const retry = () => (onretry ? onretry() : location.reload());
</script>

{#snippet iconCircle()}
	<span class="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
		<Icon class="size-8" />
	</span>
{/snippet}

<Glass as="section" radius="sheet" class="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-10 text-center">
	<!-- El bocadillo lleva la frase gamberra del catálogo; el título y el cuerpo dicen siempre qué ha pasado y qué hacer. -->
	<Capsulito momento={c.momento} size="md" bocadillo="arriba" fallback={iconCircle} />
	<h1 class="type-title-lg">{c.titulo}</h1>
	<p class="text-[15px] leading-5 text-ink-muted">{message ?? c.ayuda}</p>
	{#if code}<p class="text-[13px] leading-[18px] text-ink-muted">{textos.errorPagina.codigo} <code>{code}</code></p>{/if}
	<div class="mt-2 flex w-full flex-col gap-2">
		{#if kind === 'servidor' || kind === 'sin-conexion'}
			<Button size="lg" block onclick={retry}>{textos.errorPagina.reintentar}</Button>
		{/if}
		{#if kind !== 'sin-conexion' && inicioHref}
			<Button href={inicioHref} size="lg" block variant={kind === 'servidor' ? 'soft' : 'primary'}>{textos.errorPagina.irInicio}</Button>
		{/if}
	</div>
</Glass>
