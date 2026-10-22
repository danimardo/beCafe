<script lang="ts">
	import BellOff from '@lucide/svelte/icons/bell-off';
	import Sheet from './Sheet.svelte';
	import Button from './Button.svelte';
	import EmptyState from './EmptyState.svelte';
	import NotificationItem from './NotificationItem.svelte';
	import { usarNotificaciones } from './contextos/notificaciones.svelte';
	import type { ResolvedPathname } from '$app/types';

	type Props = {
		/** Destino de «Ajustar qué avisos recibo», ya resuelto con `resolve()`. */
		ajustesHref?: ResolvedPathname;
	};
	let { ajustesHref }: Props = $props();

	const avisos = usarNotificaciones();
	const nuevos = $derived(avisos.avisos.filter((n) => avisos.esNuevo(n)));
	const anteriores = $derived(avisos.avisos.filter((n) => !avisos.esNuevo(n)));
</script>

<!-- Panel de avisos (RF-107): todas las notificaciones push también viven aquí. Se monta una vez en AppShell. -->
<Sheet
	bind:open={avisos.abierto}
	title="Avisos"
	description="Aquí encuentras también los avisos que te llegan al móvil. Se guardan 30 días."
>
	{#if avisos.avisos.length === 0}
		<EmptyState title="No tienes avisos" description="Cuando haya stock bajo o llegue tu resumen del mes, aparecerá aquí.">
			{#snippet icon()}<BellOff class="size-6" />{/snippet}
		</EmptyState>
	{:else}
		{#if nuevos.length}
			<h3 class="type-eyebrow mb-1 mt-2 px-3 text-ink-muted">Nuevos · {nuevos.length}</h3>
			<ul class="flex flex-col gap-1">
				{#each nuevos as n (n.id)}
					<NotificationItem aviso={n} esNuevo onclick={() => (avisos.abierto = false)} />
				{/each}
			</ul>
		{/if}
		{#if anteriores.length}
			<h3 class="type-eyebrow mb-1 mt-4 px-3 text-ink-muted">Anteriores</h3>
			<ul class="flex flex-col gap-1 divide-y divide-hairline">
				{#each anteriores as n (n.id)}
					<NotificationItem aviso={n} onclick={() => (avisos.abierto = false)} />
				{/each}
			</ul>
		{/if}
	{/if}
	{#snippet footer()}
		{#if ajustesHref}
			<Button href={ajustesHref} variant="soft" block onclick={() => (avisos.abierto = false)}>Ajustar qué avisos recibo</Button>
		{/if}
	{/snippet}
</Sheet>
