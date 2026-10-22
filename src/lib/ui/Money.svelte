<script lang="ts">
	import { cn } from './utils';
	import { formatMoney } from '#lib/shared/dinero';

	type Props = {
		/** Importe en céntimos enteros (RN-020). */
		cents: number;
		/** Añade «+» a los importes positivos. Úsalo en saldos y movimientos. */
		signed?: boolean;
		/** Colorea: verde si es positivo, rojo si es negativo. El signo siempre se muestra, el color no es la única señal. */
		tone?: boolean;
		/** Texto solo para lector de pantalla tras el importe, p. ej. «a favor» o «debe». */
		srSuffix?: string;
		class?: string;
	};
	let { cents, signed = false, tone = false, srSuffix, class: className }: Props = $props();
</script>

<span class={cn('tabular-nums', tone && cents > 0 && 'text-positive', tone && cents < 0 && 'text-negative', className)}>
	{formatMoney(cents, { signed })}{#if srSuffix}<span class="sr-only"> {srSuffix}</span>{/if}
</span>
