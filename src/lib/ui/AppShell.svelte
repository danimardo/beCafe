<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import AppNav from './AppNav.svelte';
	import type { NavItem } from './types';
	import { cn } from './utils';

	type Props = {
		nav: NavItem[];
		adminNav?: NavItem[];
		user: { name: string; role: 'miembro' | 'administrador' };
		inicioHref?: ResolvedPathname;
		perfilHref?: ResolvedPathname;
		/**
		 * Ancho del contenido:
		 * - «normal» 672 px: formularios y lectura (Perfil, Ayuda, Privacidad).
		 * - «panel» 1200 px: pantallas con resumen + contenido (Inicio, Saldos, Historial, Compras, Estadísticas). Usa <PanelGrid>.
		 * - «wide» 1024 px: administración y tablas.
		 */
		width?: 'normal' | 'panel' | 'wide';
		/** Campana y panel de avisos (RF-107). */
		campana?: Snippet;
		children: Snippet;
	};
	let { nav, adminNav = [], user, inicioHref, perfilHref, width = 'normal', campana, children }: Props = $props();
	const max = { normal: 'max-w-2xl', panel: 'max-w-[75rem]', wide: 'max-w-5xl' } as const;
</script>

<!-- Fondo de manchas + navegación + contenido + campana. Todas las pantallas autenticadas viven aquí (RF-182).
     Puntos de ruptura: < md (768) móvil con píldora · md–lg (768–1023) carril de iconos de 96 px · ≥ lg (1024) barra lateral de 240 px. -->
<div class="wall-blobs min-h-dvh">
	<a
		href="#contenido"
		class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
	>
		Saltar al contenido
	</a>
	<AppNav items={nav} adminItems={adminNav} {user} {inicioHref} {perfilHref} />
	<div class="md:pl-[8rem] lg:pl-[16.5rem]">
		<main
			id="contenido"
			class={cn('mx-auto w-full px-5 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-8', max[width])}
		>
			{@render children()}
		</main>
	</div>
	{@render campana?.()}
</div>
