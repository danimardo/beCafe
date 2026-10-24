<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Compass from '@lucide/svelte/icons/compass';
	import ShieldX from '@lucide/svelte/icons/shield-x';
	import ServerCrash from '@lucide/svelte/icons/server-crash';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import Button from './Button.svelte';
	import Capsulito from './Capsulito.svelte';
	import Glass from './Glass.svelte';

	import type { ErrorKind } from './types';

	type Props = {
		kind: ErrorKind;
		/** Código técnico opcional (p. ej. «404»); se muestra pequeño bajo el texto. */
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
		'no-encontrada': {
			icon: Compass,
			title: 'No encontramos esa página',
			body: 'Puede que el enlace esté mal escrito o que ya no exista.',
		},
		'sin-permiso': {
			icon: ShieldX,
			title: 'No tienes permiso para ver esto',
			body: 'Esta pantalla es solo para administradores. Si crees que es un error, díselo a uno de ellos.',
		},
		servidor: {
			icon: ServerCrash,
			title: 'Algo ha fallado por nuestra parte',
			body: 'No es culpa tuya. Tus datos están a salvo; prueba de nuevo en un momento.',
		},
		'sin-conexion': {
			icon: WifiOff,
			title: 'Sin conexión',
			body: 'Esta pantalla necesita internet. Los cafés que registres desde Inicio se guardan en tu móvil y se envían al volver la conexión.',
		},
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
	<!-- Cada tipo de error tiene su momento con el mismo nombre (sin-conexion, no-encontrada, sin-permiso, servidor). -->
	<Capsulito momento={kind} mensaje={null} size="md" fallback={iconCircle} />
	<h1 class="type-title-lg">{c.title}</h1>
	<p class="text-[15px] leading-5 text-ink-muted">{message ?? c.body}</p>
	{#if code}<p class="text-[13px] leading-[18px] text-ink-muted">Código {code}</p>{/if}
	<div class="mt-2 flex w-full flex-col gap-2">
		{#if kind === 'servidor' || kind === 'sin-conexion'}
			<Button size="lg" block onclick={retry}>Reintentar</Button>
		{/if}
		{#if kind !== 'sin-conexion' && inicioHref}
			<Button href={inicioHref} size="lg" block variant={kind === 'servidor' ? 'soft' : 'primary'}>Ir al inicio</Button>
		{/if}
	</div>
</Glass>
