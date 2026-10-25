<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { PASOS_TOUR, type PasoTour } from '#lib/shared/ayuda/tour';
	import Capsulito from './Capsulito.svelte';
	import { usarMascota } from './contextos/mascota.svelte';
	import { buttonClasses } from './utils';

	type Props = {
		/** Se llama al terminar o al saltar el tour (RF-204). La página marca el tour como visto en la cuenta. */
		onterminar: () => void;
		pasos?: readonly PasoTour[];
	};
	let { onterminar, pasos = PASOS_TOUR }: Props = $props();

	let indice = $state(0);
	let caja: HTMLDivElement | undefined = $state();
	let posicion = $state<{ top: number; left: number } | null>(null);
	const paso = $derived(pasos[indice]);
	const ultimo = $derived(indice === pasos.length - 1);
	const uid = $props.id();
	const mascota = usarMascota();

	/** El ancla visible del paso (la navegación existe dos veces: móvil y escritorio). `null` si no hay ninguna. */
	function anclaDe(nombre: string): HTMLElement | null {
		const candidatas = document.querySelectorAll<HTMLElement>(`[data-tour="${nombre}"]`);
		return [...candidatas].find((elemento) => elemento.getClientRects().length > 0) ?? null;
	}

	// Sincroniza la posición de la tarjeta con el ancla del paso (DOM externo) y le da el foco.
	$effect(() => {
		const ancla = anclaDe(paso.ancla);
		document.querySelectorAll('[data-tour-activo]').forEach((elemento) => elemento.removeAttribute('data-tour-activo'));
		if (ancla) {
			ancla.setAttribute('data-tour-activo', '');
			ancla.scrollIntoView({ block: 'center', behavior: 'instant' });
			const rect = ancla.getBoundingClientRect();
			const debajo = rect.bottom + 12 + 180 < window.innerHeight;
			posicion = {
				top: debajo ? rect.bottom + 12 : Math.max(12, rect.top - 192),
				left: Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - 332)),
			};
		} else {
			posicion = null;
		}
		void tick().then(() => caja?.querySelector<HTMLElement>('[data-tour-primario]')?.focus());
	});

	// Con la voz activa, Capsulito dice cada paso (RF-227). Hablar es una API externa del navegador.
	$effect(() => {
		mascota.hablar(paso.id);
	});

	onMount(() => () => document.querySelectorAll('[data-tour-activo]').forEach((elemento) => elemento.removeAttribute('data-tour-activo')));

	function siguiente() {
		if (ultimo) onterminar();
		else indice += 1;
	}

	// Foco atrapado: Tab y Mayús+Tab recorren solo los botones del paso; Esc salta el tour.
	function alPulsarTecla(evento: KeyboardEvent) {
		if (evento.key === 'Escape') {
			evento.preventDefault();
			onterminar();
			return;
		}
		if (evento.key !== 'Tab' || !caja) return;
		const botones = [...caja.querySelectorAll<HTMLElement>('button')];
		const primero = botones.at(0);
		const final = botones.at(-1);
		if (evento.shiftKey && document.activeElement === primero) {
			evento.preventDefault();
			final?.focus();
		} else if (!evento.shiftKey && document.activeElement === final) {
			evento.preventDefault();
			primero?.focus();
		}
	}
</script>

{#if paso}
	<!-- Tarjeta del tour sobre superficie estable, sin animación (respeta prefers-reduced-motion). -->
	<div
		bind:this={caja}
		role="dialog"
		aria-modal="true"
		aria-labelledby="{uid}-titulo"
		aria-describedby="{uid}-texto"
		tabindex="-1"
		onkeydown={alPulsarTecla}
		class="fixed z-[60] w-[min(20rem,calc(100vw-1.5rem))] rounded-panel border border-hairline bg-wall-base p-4 text-ink shadow-lg"
		style={posicion
			? `position:fixed;top:${posicion.top}px;left:${posicion.left}px`
			: 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)'}
	>
		<p class="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Paso {indice + 1} de {pasos.length}</p>
		<div class="mt-1 flex items-start gap-3">
			<!-- Imagen decorativa: el texto del paso contiene siempre el mensaje completo (constitución XVIII). -->
			<Capsulito pose={paso.pose} size="sm" modo="svg" mensaje={null} />
			<div class="min-w-0 flex-1">
				<h2 id="{uid}-titulo" class="text-[17px] font-semibold">{paso.titulo}</h2>
				<p id="{uid}-texto" class="mt-1 text-[15px] leading-6 text-ink-muted">{paso.texto}</p>
			</div>
		</div>
		<div class="mt-4 flex justify-end gap-2">
			<button type="button" class={buttonClasses('ghost')} onclick={onterminar}>Saltar</button>
			<button type="button" data-tour-primario class={buttonClasses('primary')} onclick={siguiente}
				>{ultimo ? 'Terminar' : 'Siguiente'}</button
			>
		</div>
	</div>
{/if}
