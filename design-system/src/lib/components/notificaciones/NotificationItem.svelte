<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import PackageX from '@lucide/svelte/icons/package-x';
	import PiggyBank from '@lucide/svelte/icons/piggy-bank';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import type { AppNotification, NotificationKind } from '#lib/notifications.svelte';
	import { cn } from '#lib/utils';

	type Props = {
		notification: AppNotification;
		/** Resalta el aviso como «nuevo» (llegó desde la última vez que se abrió el panel). */
		isNew?: boolean;
		onclick?: () => void;
	};
	let { notification, isNew = false, onclick }: Props = $props();

	const meta: Record<NotificationKind, { icon: typeof TriangleAlert; tone: string; label: string }> = {
		'stock-bajo': { icon: TriangleAlert, tone: 'bg-warning-soft text-warning', label: 'Stock bajo' },
		deuda: { icon: HandCoins, tone: 'bg-negative-soft text-negative', label: 'Deuda' },
		'resumen-mensual': { icon: CalendarDays, tone: 'bg-accent-soft text-accent', label: 'Resumen mensual' },
		'stock-negativo': { icon: PackageX, tone: 'bg-negative-soft text-negative', label: 'Stock negativo' },
		'hucha-negativa': { icon: PiggyBank, tone: 'bg-negative-soft text-negative', label: 'Hucha en negativo' },
		'copia-fallida': { icon: DatabaseBackup, tone: 'bg-negative-soft text-negative', label: 'Copia de seguridad' }
	};
	const m = $derived(meta[notification.kind]);
	const Icon = $derived(m.icon);
</script>

{#snippet inner()}
	<span class={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', m.tone)} aria-hidden="true">
		<Icon class="size-[18px]" />
	</span>
	<span class="min-w-0 flex-1">
		<span class="flex items-baseline justify-between gap-2">
			<span class="type-eyebrow text-ink-muted">{m.label}</span>
			<span class="shrink-0 text-xs leading-4 text-ink-muted">{notification.when}</span>
		</span>
		<span class="block text-[15px] font-semibold leading-5">
			{#if isNew}<span class="sr-only">Nuevo: </span>{/if}{notification.title}
		</span>
		{#if notification.detail}<span class="block break-words text-[13px] leading-[18px] text-ink-muted">{notification.detail}</span>{/if}
	</span>
	{#if isNew}<span class="mt-2 size-2.5 shrink-0 rounded-full bg-accent" aria-hidden="true"></span>{/if}
{/snippet}

<li class={cn(isNew && 'rounded-tile bg-accent-soft')}>
	{#if notification.href}
		<a href={notification.href} {onclick} class="flex min-h-14 w-full items-start gap-3 rounded-tile px-3 py-3 text-left">{@render inner()}</a>
	{:else}
		<div class="flex min-h-14 w-full items-start gap-3 rounded-tile px-3 py-3 text-left">{@render inner()}</div>
	{/if}
</li>
