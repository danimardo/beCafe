<script lang="ts">
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import CapsuleImage from './CapsuleImage.svelte';
	import StockBadge from './StockBadge.svelte';
	import { cn } from './utils';
	import { formatMoney } from '#lib/shared/dinero';

	type Props = {
		/** Identificador del tipo: va en el formulario de la fila (RF-011). */
		tipoId: string;
		/** Identificador de la operación del toque (RF-016). Lo genera el servidor al cargar la página. */
		clienteId: string;
		name: string;
		brand?: string;
		/** Intensidad 1–13, opcional (RF-001). */
		intensity?: number | null;
		/** Stock registrado; puede ser ≤ 0 (RN-070). */
		stock: number;
		/** Umbral mínimo del tipo (RN-071). */
		threshold: number;
		/** Precio de una cápsula en céntimos (RN-021). */
		priceCents: number;
		color: string;
		photoUrl?: string | null;
		/** Días estimados restantes (RN-073); null = «sin datos» (RF-022). */
		daysLeft?: number | null;
		/**
		 * Mejora progresiva del formulario (`use:enhance` de la página, sin importar el servidor aquí). Sin JavaScript,
		 * el formulario se envía igual a la *action* `consumir`.
		 */
		enhancer?: (formulario: HTMLFormElement) => void;
		class?: string;
	};
	let {
		tipoId,
		clienteId,
		name,
		brand,
		intensity = null,
		stock,
		threshold,
		priceCents,
		color,
		photoUrl = null,
		daysLeft = null,
		enhancer = () => {},
		class: className,
	}: Props = $props();

	const level = $derived(stock <= 0 ? 'out' : stock <= threshold ? 'low' : null);
	const meta = $derived([brand, intensity ? `Int. ${intensity}` : null, formatMoney(priceCents)].filter(Boolean).join(' · '));
	const days = $derived(daysLeft == null ? 'sin datos' : `~${daysLeft} d`);
</script>

<!-- Fila de cristal con un formulario y DOS botones: toda la fila registra (invitado = 0); el de la derecha, para un invitado
     (invitado = 1, RF-014). Objetivo táctil ≥ 44 px (RNF-001). -->
<li class={cn('glass rounded-panel', className)}>
	<form method="post" action="?/consumir" class="flex items-center pr-2" use:enhancer>
		<input type="hidden" name="tipoCapsulaId" value={tipoId} />
		<input type="hidden" name="clienteId" value={clienteId} />
		<button
			type="submit"
			name="invitado"
			value="0"
			class="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 rounded-panel p-3 text-left active:scale-[0.99] motion-safe:transition"
		>
			<CapsuleImage {name} {color} {photoUrl} size="md" />
			<span class="min-w-0 flex-1">
				<span class="sr-only">Registrar </span>
				<span class="block truncate text-[17px] font-semibold leading-[22px]">{name}</span>
				<span class="block break-words text-[13px] leading-[18px] text-ink-muted">{meta}</span>
				<span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px] text-ink-muted">
					<span class="tabular-nums">{stock} uds · {days}</span>
					{#if level}<StockBadge {level} />{/if}
				</span>
			</span>
			<span
				aria-hidden="true"
				class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-[18px] font-semibold text-on-accent">+1</span
			>
		</button>
		<button
			type="submit"
			name="invitado"
			value="1"
			aria-label="Registrar {name} para un invitado"
			title="Para un invitado"
			class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink active:scale-95 motion-safe:transition"
		>
			<UserPlus class="size-5" aria-hidden="true" />
		</button>
	</form>
</li>
