<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import AppNav from './AppNav.svelte';
	import ToastRegion from './ToastRegion.svelte';
	import type { NavItem } from './types';
	import { cn } from './utils';

	type Props = {
		nav: NavItem[];
		adminNav?: NavItem[];
		user: { name: string; role: 'miembro' | 'administrador' };
		inicioHref?: ResolvedPathname;
		perfilHref?: ResolvedPathname;
		/** Ancho de contenido: «normal» (pantallas de miembro) o «wide» (administración y tablas). */
		width?: 'normal' | 'wide';
		/** Campana y panel de avisos (RF-107). F1 no los pinta: los pinta la funcionalidad de avisos. */
		campana?: Snippet;
		children: Snippet;
	};
	let { nav, adminNav = [], user, inicioHref, perfilHref, width = 'normal', campana, children }: Props = $props();
</script>

<!-- Fondo de manchas + navegación + contenido + región de avisos. Todas las pantallas autenticadas viven aquí. -->
<div class="wall-blobs min-h-dvh">
	<a
		href="#contenido"
		class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
	>
		Saltar al contenido
	</a>
	<AppNav items={nav} adminItems={adminNav} {user} {inicioHref} {perfilHref} />
	<div class="md:pl-[16.5rem]">
		<main
			id="contenido"
			class={cn(
				'mx-auto w-full px-5 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-8',
				width === 'wide' ? 'max-w-5xl' : 'max-w-2xl',
			)}
		>
			{@render children()}
		</main>
	</div>
	{@render campana?.()}
	<ToastRegion />
</div>
