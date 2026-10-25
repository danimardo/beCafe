<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import NotificationBell from './NotificationBell.svelte';
	import IconButton from './IconButton.svelte';
	import AyudaPanel from './AyudaPanel.svelte';
	import { pantallaDeRuta } from '#lib/shared/ayuda/pantallas';

	type Props = {
		/** Antetítulo en mayúsculas, p. ej. la fecha o la sección. */
		eyebrow?: string;
		title: string;
		/** Acciones a la derecha (avatar, botón). */
		actions?: Snippet;
		/** Campana de avisos (RF-107). Visible en todas las pantallas de la app; desactívala solo en catálogos o pantallas sin sesión. */
		bell?: boolean;
		/** Solo Inicio: reabre su tour desde la ayuda sin navegar (RF-228). */
		onrepetirtour?: () => void;
	};
	let { eyebrow, title, actions, bell = true, onrepetirtour }: Props = $props();

	// RF-203: «?» en cada pantalla. Sin JavaScript lleva a `/ayuda?pantalla=<id>`; con JavaScript abre el panel.
	// Las pantallas de visitante no tienen sesión: sin JavaScript no muestran el enlace, porque `/ayuda` la exige.
	const pantalla = $derived(pantallaDeRuta(page.route.id));
	const conSesion = $derived(page.route.id?.startsWith('/(app)') ?? false);
	let conJavaScript = $state(false);
	let ayudaAbierta = $state(false);
	onMount(() => {
		conJavaScript = true;
	});
	// Al navegar (p. ej. «Repetir el tour»), el panel se cierra.
	afterNavigate(() => {
		ayudaAbierta = false;
	});
</script>

<!-- Si el título (mín. 9 rem) y las acciones no caben en una línea, las acciones bajan a la derecha en vez de pisar el título. -->
<header class="mb-5 mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
	<div class="min-w-0 flex-[1_1_9rem]">
		{#if eyebrow}<p class="type-eyebrow mb-0.5 text-ink-muted">{eyebrow}</p>{/if}
		<h1 class="type-display">{title}</h1>
	</div>
	{#if actions || bell || pantalla}
		<div class="ml-auto flex shrink-0 items-center gap-2">
			{#if actions}{@render actions()}{/if}
			{#if pantalla && conJavaScript}
				<IconButton label="Ayuda de esta pantalla" variant="glass" onclick={() => (ayudaAbierta = true)}>
					<CircleHelp class="size-5" aria-hidden="true" />
				</IconButton>
			{:else if pantalla && conSesion}
				<!-- Navegación con un formulario GET: `/ayuda?pantalla=<id>` muestra primero la ayuda de esta pantalla. -->
				<form method="get" action={resolve('/(app)/ayuda')}>
					<input type="hidden" name="pantalla" value={pantalla} />
					<button
						type="submit"
						aria-label="Ayuda de esta pantalla"
						class="glass inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink"
					>
						<CircleHelp class="size-5" aria-hidden="true" />
					</button>
				</form>
			{/if}
			{#if bell && page.data.avisosNuevos !== undefined}
				<NotificationBell nuevos={page.data.avisosNuevos} accion="{resolve('/(app)/avisos')}?/abrir" />
			{/if}
		</div>
	{/if}
</header>

{#if pantalla && conJavaScript}
	<AyudaPanel bind:open={ayudaAbierta} {pantalla} {onrepetirtour} />
{/if}
