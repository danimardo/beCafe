<script lang="ts">
	import Package from '@lucide/svelte/icons/package';
	import Users from '@lucide/svelte/icons/users';
	import Scale from '@lucide/svelte/icons/scale';
	import Settings from '@lucide/svelte/icons/settings';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Banner, Button, Glass, PageHeader } from '#lib';
	import { capsules, members, daysSinceRestoreTest } from '#lib/mock';

	const low = capsules.filter((c) => c.active && c.stock <= c.threshold).length;
	const activeUsers = members.filter((m) => m.active).length;
	const admins = members.filter((m) => m.active && m.role === 'administrador').length;

	const cards = [
		{ href: '/admin/capsulas', title: 'Cápsulas', info: `${capsules.filter((c) => c.active).length} activas · ${low} en stock bajo`, icon: Package },
		{ href: '/admin/usuarios', title: 'Usuarios', info: `${activeUsers} activos · ${admins} administradores`, icon: Users },
		{ href: '/admin/control', title: 'Arqueos y recuentos', info: 'Último arqueo: 13 oct', icon: Scale },
		{ href: '/admin/configuracion', title: 'Configuración', info: 'Plazo, límite de deuda y recordatorios', icon: Settings },
		{ href: '/admin/copias', title: 'Copias de seguridad', info: 'Última copia correcta: hoy, 03:00', icon: DatabaseBackup }
	];
</script>

<PageHeader eyebrow="Solo administradores" title="Administración" />

<div class="mb-4 flex flex-col gap-3">
	{#if daysSinceRestoreTest > 100}
		<!-- RF-144: aviso si pasaron más de 100 días desde la última prueba de restauración. -->
		<Banner tone="warning" title="Toca probar una restauración">
			Hace {daysSinceRestoreTest} días desde la última prueba de restauración registrada.
			{#snippet actions()}<Button href="/admin/copias" variant="soft">Ir a copias</Button>{/snippet}
		</Banner>
	{/if}
	{#if admins < 2}
		<!-- RN-042: se recomienda, sin obligar, tener al menos dos administradores activos. -->
		<Banner tone="info" title="Recomendación">Conviene tener al menos dos administradores activos.</Banner>
	{/if}
</div>

<div class="grid gap-3 md:grid-cols-2">
	{#each cards as c (c.href)}
		<a href={c.href} class="glass flex min-h-[88px] items-center gap-4 rounded-panel p-4 motion-safe:transition hover:brightness-[0.98] active:scale-[0.99]">
			<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true"><c.icon class="size-5" /></span>
			<span class="min-w-0 flex-1">
				<span class="type-title block">{c.title}</span>
				<span class="block text-[13px] leading-[18px] text-ink-muted">{c.info}</span>
			</span>
			<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />
		</a>
	{/each}
</div>
