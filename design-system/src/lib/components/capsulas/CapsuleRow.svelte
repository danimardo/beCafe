<script lang="ts">
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import CapsuleImage from './CapsuleImage.svelte';
	import StockBadge from './StockBadge.svelte';
	import { cn, formatMoney } from '#lib/utils';

	type Props = {
		name: string;
		brand?: string;
		/** Intensidad 1–13, opcional (RF-001). */
		intensity?: number | null;
		/** Stock registrado; puede ser ≤ 0 (RN-070). */
		stock: number;
		/** Umbral mínimo del tipo (RN-071). */
		threshold: number;
		/** Coste medio redondeado al céntimo, en céntimos (RN-021). */
		avgCostCents: number;
		color: string;
		photoUrl?: string | null;
		/** Días estimados restantes (RN-073); null = «sin datos» (RF-022). */
		daysLeft?: number | null;
		/** Un toque en la fila registra un consumo (RF-011). */
		onregister: () => void;
		/** El botón de persona registra el consumo «para un invitado» (RF-014). */
		onregisterGuest: () => void;
		disabled?: boolean;
		class?: string;
	};
	let {
		name,
		brand,
		intensity = null,
		stock,
		threshold,
		avgCostCents,
		color,
		photoUrl = null,
		daysLeft = null,
		onregister,
		onregisterGuest,
		disabled = false,
		class: className
	}: Props = $props();

	const uid = $props.id();
	const level = $derived(stock <= 0 ? 'out' : stock <= threshold ? 'low' : null);
	const meta = $derived([brand, intensity ? `Int. ${intensity}` : null, formatMoney(avgCostCents)].filter(Boolean).join(' · '));
	const days = $derived(daysLeft == null ? 'sin datos' : `~${daysLeft} d`);
</script>

<!-- Fila de cristal con DOS botones hermanos (no anidados): toda la fila registra; el de la derecha, para invitado.
     Objetivo táctil ≥ 44 px (RNF-001). -->
<li class={cn('glass flex items-center rounded-panel pr-2', className)}>
	<button
		type="button"
		{disabled}
		onclick={onregister}
		aria-label="Registrar un {name}"
		aria-describedby="{uid}-meta"
		class="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 rounded-panel p-3 text-left active:scale-[0.99] motion-safe:transition disabled:opacity-50"
	>
		<CapsuleImage {name} {color} {photoUrl} size="md" />
		<span class="min-w-0 flex-1">
			<span class="block truncate text-[17px] font-semibold leading-[22px]">{name}</span>
			<span id="{uid}-meta" class="block break-words text-[13px] leading-[18px] text-ink-muted">{meta}</span>
			<span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px] text-ink-muted">
				<span class="tabular-nums">{stock} uds · {days}</span>
				{#if level}<StockBadge {level} />{/if}
			</span>
		</span>
		<span
			aria-hidden="true"
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-[18px] font-semibold text-on-accent"
			>+1</span
		>
	</button>
	<button
		type="button"
		{disabled}
		onclick={onregisterGuest}
		aria-label="Registrar {name} para un invitado"
		title="Para un invitado"
		class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink active:scale-95 motion-safe:transition disabled:opacity-50"
	>
		<UserPlus class="size-5" aria-hidden="true" />
	</button>
</li>
