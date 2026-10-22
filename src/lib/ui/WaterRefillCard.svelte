<script lang="ts">
	import Droplets from '@lucide/svelte/icons/droplets';
	import Trophy from '@lucide/svelte/icons/trophy';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { ResolvedPathname } from '$app/types';
	import Glass from './Glass.svelte';
	import Button from './Button.svelte';

	type Props = {
		/** Último relleno vigente de cualquiera (RF-170). `null`: «Sin rellenos registrados». */
		last: { name: string; minutesAgo: number } | null;
		/** Intervalo mínimo entre rellenos, en minutos (RN-082). Solo sirve para el aviso temprano; decide el servidor. */
		intervalMinutes: number;
		/** Sin conexión: la acción se desactiva con una explicación (RN-081, RF-173). */
		offline?: boolean;
		/** Aguador del mes anterior (RF-176). `null` o sin nombres: no se muestra (no hay título). */
		aguador?: { month: string; names: string[]; meIncluded?: boolean } | null;
		/** Quien pulsa. Tras registrar, es el nuevo «último». */
		meName: string;
		/** Pulsar la acción (con conexión y fuera del intervalo): aquí iría POST /api/rellenos con `clienteId`. Si el servidor responde 409, la tarjeta pasa a mostrar el rechazo. */
		onrefill: () => void;
		/** Destino de «Ver rellenos recientes», ya resuelto con `resolve()`. Sin destino, el enlace no aparece. */
		historialHref?: ResolvedPathname;
		class?: string;
	};
	let { last, intervalMinutes, offline = false, aguador = null, meName, onrefill, historialHref, class: className }: Props = $props();

	/** «hace 20 min», «hace 3 h», «hace 2 días». */
	function ago(min: number): string {
		if (min < 1) return 'ahora mismo';
		if (min < 60) return `hace ${Math.round(min)} min`;
		if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
		const d = Math.round(min / 60 / 24);
		return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
	}

	// RF-172: dentro del intervalo se rechaza y se dice quién y hace cuánto. Aquí es un aviso previo de la interfaz;
	// el servidor es quien lo decide (409 RELLENO_RECIENTE) porque dos personas pueden pulsar a la vez.
	// El rechazo guarda el «último» que lo provocó: si ese «último» cambia (p. ej. tras registrar el propio relleno),
	// el rechazo deja de valer y no se muestra. Se compara la referencia, así que no hace falta un efecto.
	let rechazo = $state<{ aviso: { name: string; minutesAgo: number }; paraUltimo: typeof last } | null>(null);
	const rejected = $derived(rechazo && rechazo.paraUltimo === last ? rechazo.aviso : null);
	function press() {
		if (offline) return;
		if (last && last.minutesAgo < intervalMinutes) {
			rechazo = { aviso: { ...last }, paraUltimo: last };
			return;
		}
		rechazo = null;
		onrefill();
	}

	const lastText = $derived(last ? `Último: ${last.name}, ${ago(last.minutesAgo)}` : 'Sin rellenos registrados');
	const names = $derived(aguador?.names.join(' y ') ?? '');
</script>

<!-- PROPUESTO: tarjeta sobre la lista de cápsulas, sin competir con el +1 (botón «soft», no primario). El aguador del mes va en una franja
     inferior de la misma tarjeta con trofeo y texto, sin sustituir al último relleno. -->
<Glass as="section" aria-labelledby="refill-title" class={['flex flex-col gap-3', className].filter(Boolean).join(' ')}>
	<div class="flex items-center gap-3">
		<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true"
			><Droplets class="size-6" /></span
		>
		<div class="min-w-0 flex-1">
			<h2 id="refill-title" class="type-title">Agua de la cafetera</h2>
			<p class="text-[14px] leading-5 text-ink-muted">{lastText}</p>
		</div>
	</div>

	<Button
		variant="soft"
		size="lg"
		block
		disabled={offline}
		aria-describedby={offline ? 'refill-offline' : rejected ? 'refill-rejected' : undefined}
		onclick={press}
	>
		<Droplets class="size-5" aria-hidden="true" /> He rellenado el agua
	</Button>

	{#if offline}
		<p id="refill-offline" class="flex items-start gap-2 text-[14px] leading-5 text-ink-muted" role="status">
			<WifiOff class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" /> Necesitas conexión para registrar el relleno
		</p>
	{:else if rejected}
		<p id="refill-rejected" class="flex items-start gap-2 text-[14px] font-medium leading-5" role="alert">
			<TriangleAlert class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
			<span>{rejected.name === meName.split(' ')[0] ? 'Tú la rellenaste' : `${rejected.name} la rellenó`} {ago(rejected.minutesAgo)}</span>
		</p>
	{/if}

	{#if aguador && aguador.names.length}
		<p class="-mx-1 flex items-center gap-2 rounded-tile bg-accent-soft px-3 py-2 text-[14px] leading-5">
			<Trophy class="size-4 shrink-0 text-accent" aria-hidden="true" />
			<span><b>Aguador de {aguador.month}:</b> {names}{aguador.meIncluded ? ' (¡tú!)' : ''}</span>
		</p>
	{/if}

	{#if historialHref}
		<a href={historialHref} class="-mb-1 self-start text-[14px] font-medium text-accent underline-offset-2 hover:underline"
			>Ver rellenos recientes</a
		>
	{/if}
</Glass>
