<script lang="ts">
	import { cn } from './utils';

	type Props = {
		/** Puntos en orden. `value` en la unidad que indique `format` (p. ej. céntimos). */
		data: { label: string; value: number }[];
		/** Qué mide, p. ej. «Saldo de la hucha al cierre de cada mes». Es el nombre accesible. */
		title: string;
		/** Cómo se escribe un valor (ejes y resumen accesible). */
		format?: (value: number) => string;
		class?: string;
	};
	let { data, title, format = String, class: className }: Props = $props();

	// Coordenadas en un lienzo de 100 × 60 que se estira al ancho disponible. El 0 siempre entra en la escala (RF-202).
	const ANCHO = 100;
	const ALTO = 60;
	const minimo = $derived(Math.min(0, ...data.map((d) => d.value)));
	const maximo = $derived(Math.max(0, ...data.map((d) => d.value)));
	const rango = $derived(maximo - minimo || 1);
	const y = (valor: number) => ALTO - ((valor - minimo) / rango) * ALTO;
	const x = (indice: number) => (data.length <= 1 ? ANCHO / 2 : (indice / (data.length - 1)) * ANCHO);
	const puntos = $derived(data.map((d, i) => `${x(i).toFixed(2)},${y(d.value).toFixed(2)}`).join(' '));
	const resumen = $derived(data.map((d) => `${d.label}: ${format(d.value)}`).join(', '));
	const primero = $derived(data.at(0));
	const ultimo = $derived(data.at(-1));
</script>

<!-- Imagen para el lector de pantalla, con todos los valores en el nombre. La tabla equivalente va al lado (RF-202). -->
<figure role="img" aria-label="{title}. {resumen}" class={cn('flex flex-col gap-1', className)}>
	<div class="flex gap-2" aria-hidden="true">
		<div class="flex w-16 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-ink-muted">
			<span>{format(maximo)}</span>
			<span>{format(minimo)}</span>
		</div>
		<svg viewBox="0 0 {ANCHO} {ALTO}" preserveAspectRatio="none" class="h-36 w-full overflow-visible">
			<!-- Línea de cero: separa el saldo positivo del negativo. -->
			<line
				x1="0"
				x2={ANCHO}
				y1={y(0)}
				y2={y(0)}
				class="stroke-ink-muted"
				stroke-width="1"
				stroke-dasharray="3 2"
				vector-effect="non-scaling-stroke"
			/>
			<polyline
				points={puntos}
				fill="none"
				class="stroke-accent"
				stroke-width="2.5"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
			{#each data as d, i (d.label)}
				<circle cx={x(i)} cy={y(d.value)} r="1.6" class={d.value < 0 ? 'fill-negative' : 'fill-accent'} />
			{/each}
		</svg>
	</div>
	{#if primero && ultimo}
		<div class="flex justify-between pl-[4.5rem] text-[11px] text-ink-muted" aria-hidden="true">
			<span>{primero.label}</span>
			<span>{ultimo.label}</span>
		</div>
	{/if}
</figure>
