<script lang="ts">
	import { cn } from './utils';
	import { formatMoney } from '#lib/shared/dinero';
	import { cifraAnimada } from './movimiento';

	type Props = {
		/** Importe en céntimos enteros (RN-020). */
		cents: number;
		/** Añade «+» a los importes positivos. Úsalo en saldos y movimientos. */
		signed?: boolean;
		/** Colorea: verde si es positivo, rojo si es negativo. El signo siempre se muestra, el color no es la única señal. */
		tone?: boolean;
		/** Texto solo para lector de pantalla tras el importe, p. ej. «a favor» o «debe». */
		srSuffix?: string;
		/** La cifra pasa del valor anterior al nuevo en 240 ms; el lector de pantalla recibe solo el valor final (RF-236). */
		animar?: boolean;
		class?: string;
	};
	let { cents, signed = false, tone = false, srSuffix, animar = false, class: className }: Props = $props();
	const cifra = cifraAnimada(() => cents);
</script>

<span class={cn('tabular-nums', tone && cents > 0 && 'text-positive', tone && cents < 0 && 'text-negative', className)}>
	{#if animar && cifra.animando}<span aria-hidden="true">{formatMoney(cifra.visible, { signed })}</span><span class="sr-only"
			>{formatMoney(cents, { signed })}</span
		>{:else}{formatMoney(cents, { signed })}{/if}{#if srSuffix}<span class="sr-only"> {srSuffix}</span>{/if}
</span>
