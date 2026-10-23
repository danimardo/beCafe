<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import NotificationBell from './NotificationBell.svelte';

	type Props = {
		/** Antetítulo en mayúsculas, p. ej. la fecha o la sección. */
		eyebrow?: string;
		title: string;
		/** Acciones a la derecha (avatar, botón). */
		actions?: Snippet;
		/** Campana de avisos (RF-107). Visible en todas las pantallas de la app; desactívala solo en catálogos o pantallas sin sesión. */
		bell?: boolean;
	};
	let { eyebrow, title, actions, bell = true }: Props = $props();
</script>

<!-- Si el título (mín. 9 rem) y las acciones no caben en una línea, las acciones bajan a la derecha en vez de pisar el título. -->
<header class="mb-5 mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
	<div class="min-w-0 flex-[1_1_9rem]">
		{#if eyebrow}<p class="type-eyebrow mb-0.5 text-ink-muted">{eyebrow}</p>{/if}
		<h1 class="type-display">{title}</h1>
	</div>
	{#if actions || bell}
		<div class="ml-auto flex shrink-0 items-center gap-2">
			{#if actions}{@render actions()}{/if}
			{#if bell && page.data.avisosNuevos !== undefined}
				<NotificationBell nuevos={page.data.avisosNuevos} accion="{resolve('/(app)/avisos')}?/abrir" />
			{/if}
		</div>
	{/if}
</header>
