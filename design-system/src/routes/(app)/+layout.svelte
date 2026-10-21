<script lang="ts">
	import { page } from '$app/state';
	import House from '@lucide/svelte/icons/house';
	import Wallet from '@lucide/svelte/icons/wallet';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import User from '@lucide/svelte/icons/user';
	import Package from '@lucide/svelte/icons/package';
	import Users from '@lucide/svelte/icons/users';
	import Scale from '@lucide/svelte/icons/scale';
	import Settings from '@lucide/svelte/icons/settings';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import { AppShell, notifications, type NavItem } from '#lib';
	import { me, notificationSeed } from '#lib/mock';

	let { children } = $props();

	// DEMO: en la app real los avisos llegan del servidor, ya filtrados por destinatario (RF-101, CA-101).
	if (notifications.items.length === 0) {
		const now = Date.now();
		notifications.load(notificationSeed.map((n) => ({ ...n, kind: n.kind, createdAt: now - n.minutesAgo * 60_000 })));
		notifications.lastSeenAt = now - 24 * 60 * 60_000;
	}

	// Las 5 pestañas de miembro. La administración NO va en la barra móvil: se entra desde Perfil.
	const nav: NavItem[] = [
		{ href: '/', label: 'Inicio', icon: House },
		{ href: '/saldos', label: 'Saldos', icon: Wallet, alsoActive: ['/historial'] },
		{ href: '/compras', label: 'Compras', icon: ShoppingCart },
		{ href: '/estadisticas', label: 'Estadísticas', icon: ChartColumn },
		{ href: '/perfil', label: 'Perfil', icon: User }
	];
	// En escritorio la barra lateral añade el bloque de administración (solo para administradores, RN-043).
	const adminNav: NavItem[] = [
		{ href: '/admin/capsulas', label: 'Cápsulas', icon: Package },
		{ href: '/admin/usuarios', label: 'Usuarios', icon: Users },
		{ href: '/admin/control', label: 'Arqueos y recuentos', icon: Scale },
		{ href: '/admin/configuracion', label: 'Configuración', icon: Settings },
		{ href: '/admin/copias', label: 'Copias de seguridad', icon: DatabaseBackup }
	];
</script>

<AppShell
	{nav}
	adminNav={me.role === 'administrador' ? adminNav : []}
	user={me}
	width={page.url.pathname.startsWith('/admin') ? 'wide' : 'normal'}
>
	{@render children()}
</AppShell>
