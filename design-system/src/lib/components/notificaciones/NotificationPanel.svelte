<script lang="ts">
	import BellOff from '@lucide/svelte/icons/bell-off';
	import Sheet from '../ui/Sheet.svelte';
	import Button from '../ui/Button.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import NotificationItem from './NotificationItem.svelte';
	import { notifications } from '#lib/notifications.svelte';

	const fresh = $derived(notifications.items.filter((n) => notifications.isNew(n)));
	const older = $derived(notifications.items.filter((n) => !notifications.isNew(n)));
</script>

<!-- Panel de avisos (RF-107): todas las notificaciones push también viven aquí. Se monta una vez en AppShell. -->
<Sheet bind:open={notifications.open} title="Avisos" description="Aquí encuentras también los avisos que te llegan al móvil. Se guardan 30 días.">
	{#if notifications.items.length === 0}
		<EmptyState title="No tienes avisos" description="Cuando haya stock bajo o llegue tu resumen del mes, aparecerá aquí.">
			{#snippet icon()}<BellOff class="size-6" />{/snippet}
		</EmptyState>
	{:else}
		{#if fresh.length}
			<h3 class="type-eyebrow mb-1 mt-2 px-3 text-ink-muted">Nuevos · {fresh.length}</h3>
			<ul class="flex flex-col gap-1">
				{#each fresh as n (n.id)}
					<NotificationItem notification={n} isNew onclick={() => (notifications.open = false)} />
				{/each}
			</ul>
		{/if}
		{#if older.length}
			<h3 class="type-eyebrow mb-1 mt-4 px-3 text-ink-muted">Anteriores</h3>
			<ul class="flex flex-col gap-1 divide-y divide-hairline">
				{#each older as n (n.id)}
					<NotificationItem notification={n} onclick={() => (notifications.open = false)} />
				{/each}
			</ul>
		{/if}
	{/if}
	{#snippet footer()}
		<Button href="/perfil" variant="soft" block onclick={() => (notifications.open = false)}>Ajustar qué avisos recibo</Button>
	{/snippet}
</Sheet>
