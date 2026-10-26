<script lang="ts">
	import { usarMascota } from '../contextos/mascota.svelte';

	type Props = {
		/** Contador: cada incremento lanza un confeti nuevo (RF-243). Con 0 no se pinta nada. */
		disparo?: number;
	};
	let { disparo = 0 }: Props = $props();

	const mascota = usarMascota();

	// Solo tokens de color (constitución X, XVIII). Las clases van completas para que Tailwind las genere.
	const COLORES = ['bg-accent', 'bg-positive', 'bg-warning', 'bg-cap-azul', 'bg-cap-rosa'] as const;
	const PIEZAS = Object.freeze(
		Array.from({ length: 14 }, (_, i) => {
			// Un abanico hacia arriba de −160° a −20°; la distancia alterna para que no parezca una rueda.
			const angulo = ((-160 + (140 / 13) * i) * Math.PI) / 180;
			const distancia = i % 2 === 0 ? 74 : 104;
			return {
				id: i,
				color: COLORES[i % COLORES.length],
				x: Math.round(Math.cos(angulo) * distancia),
				y: Math.round(Math.sin(angulo) * distancia),
				giro: (i % 2 === 0 ? 1 : -1) * (180 + i * 23),
				retraso: (i % 4) * 25,
			};
		}),
	);

	/** El disparo cuyo confeti ya terminó: la capa se quita del DOM al acabar la animación. */
	let terminado = $state(0);
	// Con movimiento reducido no hay confeti (RF-244); el mensaje y el sonido siguen. El CSS repite la regla por si el contexto aún no se leyó.
	const visible = $derived(disparo > 0 && terminado !== disparo && mascota.animar);
</script>

<!--
	Decorativo: no recibe eventos ni se anuncia. La confirmación de lo registrado la da el mensaje de la pantalla (constitución X y XI).
-->
{#if visible}
	{#key disparo}
		<span data-confeti class="confeti pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
			{#each PIEZAS as pieza (pieza.id)}
				<span
					class="confeti-pieza absolute left-1/2 top-1/2 block h-2 w-1.5 rounded-[1px] {pieza.color}"
					style="--x:{pieza.x}px;--y:{pieza.y}px;--giro:{pieza.giro}deg;animation-delay:{pieza.retraso}ms"
					onanimationend={pieza.id === PIEZAS.length - 1 ? () => (terminado = disparo) : undefined}
				></span>
			{/each}
		</span>
	{/key}
{/if}

<style>
	@keyframes confeti-salto {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(0.6) rotate(0);
		}
		55% {
			opacity: 1;
			transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(calc(var(--giro) * 0.6));
		}
		100% {
			opacity: 0;
			transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 56px)) scale(0.9) rotate(var(--giro));
		}
	}
	/* La garantía de que no tapa ningún control no depende de Tailwind: va aquí. */
	.confeti {
		pointer-events: none;
	}
	.confeti-pieza {
		animation: confeti-salto 800ms cubic-bezier(0.2, 0.7, 0.3, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		.confeti {
			display: none;
		}
	}
</style>
