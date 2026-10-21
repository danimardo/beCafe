<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppNav from './AppNav.svelte';
	import ToastRegion from '../ui/ToastRegion.svelte';
	import NotificationPanel from '../notificaciones/NotificationPanel.svelte';
	import type { NavItem } from './types';
	import { cn } from '#lib/utils';

	type Props = {
		nav: NavItem[];
		adminNav?: NavItem[];
		user: { name: string; role: 'miembro' | 'administrador' };
		/** Ancho de contenido: «normal» (pantallas de miembro) o «wide» (administración y tablas). */
		width?: 'normal' | 'wide';
		children: Snippet;
	};
	let { nav, adminNav = [], user, width = 'normal', children }: Props = $props();
</script>

<!-- Fondo de manchas + navegación + contenido + región de avisos. Todas las pantallas autenticadas viven aquí. -->
<div class="wall-blobs min-h-dvh">
	<a
		href="#contenido"
		class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
	>
		Saltar al contenido
	</a>
	<AppNav items={nav} adminItems={adminNav} {user} />
	<div class="md:pl-[16.5rem]">
		<main
			id="contenido"
			class={cn(
				'mx-auto w-full px-5 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-8',
				width === 'wide' ? 'max-w-5xl' : 'max-w-2xl'
			)}
		>
			{@render children()}
		</main>
	</div>
	<NotificationPanel />
	<ToastRegion />
</div>
