<script module lang="ts">
	export type MovementKind =
		| 'consumo'
		| 'aportacion'
		| 'compra'
		| 'arqueo'
		| 'recuento'
		| 'reparto'
		| 'regularizacion'
		| 'baja'
		| 'relleno';
</script>

<script lang="ts">
	import Coffee from '@lucide/svelte/icons/coffee';
	import PiggyBank from '@lucide/svelte/icons/piggy-bank';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Scale from '@lucide/svelte/icons/scale';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Split from '@lucide/svelte/icons/split';
	import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
	import UserMinus from '@lucide/svelte/icons/user-minus';
	import Droplets from '@lucide/svelte/icons/droplets';
	import CloudOff from '@lucide/svelte/icons/cloud-off';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Badge from '../ui/Badge.svelte';
	import Money from '../ui/Money.svelte';
	import { cn } from '#lib/utils';


	type Props = {
		kind: MovementKind;
		title: string;
		/** Línea secundaria: fecha, autor, motivo. */
		subtitle?: string;
		/** Importe con signo, en céntimos. Omite si el registro no tiene importe (p. ej. un recuento sin faltante). */
		cents?: number;
		/** Anulado (RN-035): se oculta por defecto y, si se muestra, va tachado con la insignia «Anulado» (RN-062). */
		voided?: boolean;
		/** Consumo guardado en el móvil sin conexión, aún sin enviar (RF-015). */
		pending?: boolean;
		/** Si se indica, la fila entera es un botón que abre el detalle (RF-112, RF-062). */
		onclick?: () => void;
		class?: string;
	};
	let { kind, title, subtitle, cents, voided = false, pending = false, onclick, class: className }: Props = $props();

	const icons = {
		consumo: Coffee,
		aportacion: PiggyBank,
		compra: ShoppingCart,
		arqueo: Scale,
		recuento: ClipboardCheck,
		reparto: Split,
		regularizacion: ArrowLeftRight,
		baja: UserMinus,
		relleno: Droplets
	};
	const Icon = $derived(icons[kind]);
</script>

{#snippet inner()}
	<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
		<Icon class="size-[18px]" />
	</span>
	<span class="min-w-0 flex-1">
		<span class={cn('block truncate text-[15px] font-semibold leading-5', voided && 'line-through opacity-70')}>{title}</span>
		<span class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] leading-[17px] text-ink-muted">
			{#if subtitle}<span>{subtitle}</span>{/if}
			{#if voided}<Badge tone="neutral">Anulado</Badge>{/if}
			{#if pending}
				<Badge tone="warning">
					{#snippet icon()}<CloudOff class="size-3.5" />{/snippet}
					Pendiente de enviar
				</Badge>
			{/if}
		</span>
	</span>
	{#if cents !== undefined}
		<span class={cn('text-[15px] font-semibold', voided && 'line-through opacity-70')}>
			<Money {cents} signed tone={!voided} />
		</span>
	{/if}
	{#if onclick}<ChevronRight class="size-5 shrink-0 text-ink-muted" aria-hidden="true" />{/if}
{/snippet}

<li class={className}>
	{#if onclick}
		<button type="button" {onclick} class="flex min-h-14 w-full items-center gap-3 py-2.5 text-left">{@render inner()}</button>
	{:else}
		<div class="flex min-h-14 items-center gap-3 py-2.5">{@render inner()}</div>
	{/if}
</li>
