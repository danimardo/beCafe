<script lang="ts">
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Package from '@lucide/svelte/icons/package';
	import User from '@lucide/svelte/icons/user';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Users from '@lucide/svelte/icons/users';
	import { formatMoney } from '#lib/shared/dinero';
	import CapsuleImage from './CapsuleImage.svelte';
	import StockBadge from './StockBadge.svelte';
	import { cn } from './utils';

	type Props = {
		/** Identificador del tipo: va en el formulario de la tarjeta (RF-011, RF-183). */
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
		/** Consumos propios vigentes de este tipo por parte de quien mira (RF-183). */
		ownCount?: number;
		/** Consumos de invitado vigentes de este tipo por parte de quien mira (RF-183). */
		guestCount?: number;
		/** Mejora progresiva del formulario (`use:enhance` de la página). Sin JavaScript envía a `?/consumir`. */
		enhancer?: (formulario: HTMLFormElement) => void;
		disabled?: boolean;
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
		ownCount = 0,
		guestCount = 0,
		enhancer = () => {},
		disabled = false,
		class: className,
	}: Props = $props();

	const uid = $props.id();
	const level = $derived(stock <= 0 ? 'out' : stock <= threshold ? 'low' : null);
	const meta = $derived([brand, intensity ? `Int. ${intensity}` : null].filter(Boolean).join(' · '));
	let pulse = $state(false);
</script>

<!-- Tarjeta gráfica de cápsula para Inicio (RF-183, CA-183, excepción cerrada de cristal en constitución XVIII).
     Un único formulario `<form method="post" action="?/consumir">` con dos botones submit hermanos (`invitado="0"` y `invitado="1"`):
     funciona con y sin JavaScript (constitución XVII) y mantiene objetivos táctiles ≥ 44 px (RNF-001). -->
<li class={cn('glass relative rounded-panel', className)}>
	<form method="post" action="?/consumir" class="relative h-full" use:enhancer>
		<input type="hidden" name="tipoCapsulaId" value={tipoId} />
		<input type="hidden" name="clienteId" value={clienteId} />
		<button
			type="submit"
			name="invitado"
			value="0"
			{disabled}
			onclick={() => (pulse = true)}
			onanimationend={() => (pulse = false)}
			aria-describedby="{uid}-meta"
			class="group relative flex h-full min-h-[212px] w-full flex-col items-center gap-2 rounded-panel px-3 pb-3 pt-5 text-center active:scale-[0.98] motion-safe:transition disabled:opacity-50"
		>
			<CapsuleImage
				{name}
				{color}
				{photoUrl}
				size="xl"
				class={cn('motion-safe:transition-transform group-hover:-translate-y-0.5', pulse && 'capsule-pop')}
			/>
			<span class="sr-only">Registrar</span>
			<span class="line-clamp-2 text-[17px] font-semibold leading-[22px]">{name}</span>
			<span
				aria-hidden="true"
				class="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[13px] font-medium leading-[18px] text-ink-muted"
			>
				<span class="inline-flex items-center gap-1 tabular-nums"><Package class="size-3.5" />{stock}</span>
				<span class="inline-flex items-center gap-1 tabular-nums">
					<CalendarClock class="size-3.5" />{daysLeft == null ? '—' : `${daysLeft} d`}
				</span>
				<span class="tabular-nums">{formatMoney(priceCents)}</span>
			</span>
			{#if ownCount > 0 || guestCount > 0}
				<span aria-hidden="true" class="flex items-center justify-center gap-2.5 text-[12px] font-medium leading-4 text-ink-muted">
					{#if ownCount > 0}
						<span class="inline-flex items-center gap-1 tabular-nums" title="Tus consumos">
							<User class="size-3.5" />{ownCount}
						</span>
					{/if}
					{#if guestCount > 0}
						<span class="inline-flex items-center gap-1 tabular-nums" title="Invitados">
							<Users class="size-3.5" />{guestCount}
						</span>
					{/if}
				</span>
			{/if}
			{#if level}<span aria-hidden="true"><StockBadge {level} /></span>{/if}
			<span
				aria-hidden="true"
				class="mt-auto inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-[17px] font-semibold text-on-accent shadow-sm group-hover:brightness-110"
			>
				+1
			</span>
		</button>
		<span id="{uid}-meta" class="sr-only">
			{meta}{meta ? '. ' : ''}{formatMoney(priceCents)} por cápsula. Quedan {stock} unidades, {daysLeft == null
				? 'sin datos de duración'
				: `unos ${daysLeft} días`}.{level === 'out' ? ' Agotado.' : level === 'low' ? ' Stock bajo.' : ''}
		</span>
		<button
			type="submit"
			name="invitado"
			value="1"
			{disabled}
			aria-label="Registrar {name} para un invitado"
			title="Para un invitado"
			style="min-width:44px;min-height:44px"
			class="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-ink active:scale-95 motion-safe:transition disabled:opacity-50"
		>
			<UserPlus class="size-5" aria-hidden="true" />
		</button>
	</form>
</li>

<style>
	@keyframes capsule-pop {
		40% {
			transform: translateY(-10px) rotate(-6deg) scale(1.06);
		}
	}
	:global(.capsule-pop) {
		animation: capsule-pop 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.capsule-pop) {
			animation: none;
		}
	}
</style>
