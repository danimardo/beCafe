<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Coffee from '@lucide/svelte/icons/coffee';
	import HardDriveDownload from '@lucide/svelte/icons/hard-drive-download';
	import Package from '@lucide/svelte/icons/package';
	import Scale from '@lucide/svelte/icons/scale';
	import Settings from '@lucide/svelte/icons/settings';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';
	import Wallet from '@lucide/svelte/icons/wallet';
	import { AppShell, Bienvenida, Corto, usarMascota, type NavItem } from '#lib/ui';
	import RegistroInstalacion from './RegistroInstalacion.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	const mascota = usarMascota();

	onMount(() => {
		mascota.iniciar();
	});

	const ruta = $derived(page.url.pathname);

	const nav: NavItem[] = $derived([
		{
			href: resolve('/(app)'),
			label: 'Inicio',
			icon: Coffee,
			active: ruta === '/' || ruta.startsWith('/consumos') || ruta.startsWith('/rellenos'),
		},
		{
			href: resolve('/(app)/saldos'),
			label: 'Saldos',
			icon: Wallet,
			active: ruta.startsWith('/saldos') || ruta.startsWith('/historial'),
		},
		{
			href: resolve('/(app)/compras'),
			label: 'Compras',
			icon: ShoppingBag,
			active: ruta.startsWith('/compras'),
		},
		{
			href: resolve('/(app)/estadisticas'),
			label: 'Estadísticas',
			icon: ChartColumn,
			active: ruta.startsWith('/estadisticas'),
		},
		{
			href: resolve('/(app)/perfil'),
			label: 'Perfil',
			icon: UserRound,
			alsoActiveMobile: ['/ajustes'],
			active: ruta.startsWith('/perfil') || ruta.startsWith('/privacidad') || ruta.startsWith('/ayuda') || ruta.startsWith('/avisos'),
		},
		{
			href: resolve('/(app)/ajustes'),
			label: 'Ajustes',
			icon: Settings2,
			hiddenOnMobile: true,
			active: ruta.startsWith('/ajustes'),
		},
	]);

	const adminNav: NavItem[] = $derived(
		data.usuario?.rol === 'administrador'
			? [
					{
						href: resolve('/(app)/admin/capsulas'),
						label: 'Cápsulas',
						icon: Package,
						active: ruta.startsWith('/admin/capsulas'),
					},
					{
						href: resolve('/(app)/admin/usuarios'),
						label: 'Usuarios',
						icon: Users,
						active: ruta.startsWith('/admin/usuarios'),
					},
					{
						href: resolve('/(app)/admin/control'),
						label: 'Arqueos y recuentos',
						short: 'Arqueos',
						icon: Scale,
						active: ruta.startsWith('/admin/control'),
					},
					{
						href: resolve('/(app)/admin/configuracion'),
						label: 'Configuración',
						short: 'Config.',
						icon: Settings,
						active: ruta.startsWith('/admin/configuracion'),
					},
					{
						href: resolve('/(app)/admin/copias'),
						label: 'Copias de seguridad',
						short: 'Copias',
						icon: HardDriveDownload,
						active: ruta.startsWith('/admin/copias'),
					},
				]
			: [],
	);

	const ancho = $derived.by((): 'normal' | 'panel' | 'wide' => {
		if (ruta.startsWith('/admin') || ruta.startsWith('/perfil') || ruta.startsWith('/avisos')) return 'wide';
		if (
			ruta === '/' ||
			ruta.startsWith('/saldos') ||
			ruta.startsWith('/historial') ||
			ruta.startsWith('/compras') ||
			ruta.startsWith('/estadisticas')
		) {
			return 'panel';
		}
		return 'normal';
	});

	const primerNombre = $derived((data.usuario?.nombre ?? '').trim().split(/\s+/)[0] ?? '');
</script>

<AppShell
	{nav}
	{adminNav}
	user={{ name: data.usuario?.nombre ?? '', role: data.usuario?.rol ?? 'miembro', id: data.usuario?.id, fotoUrl: data.usuario?.fotoUrl }}
	inicioHref={resolve('/(app)')}
	perfilHref={resolve('/(app)/perfil')}
	width={ancho}
>
	{@render children()}
</AppShell>

{#if data.usuario}
	<RegistroInstalacion enServidor={data.instalacion} />
{/if}

{#if data.usuario && ((ruta === '/' && !page.url.searchParams.has('aviso')) || mascota.bienvenidaManual)}
	<Bienvenida nombre={primerNombre} />
{/if}

<!-- RF-250: «Ver el corto otra vez» (Ajustes y Ayuda) lo abre en un diálogo. -->
{#if data.usuario && mascota.cortoManual}
	<Corto modo="dialogo" onTerminar={() => mascota.cerrarCorto()} onSaltar={() => mascota.cerrarCorto()} />
{/if}
