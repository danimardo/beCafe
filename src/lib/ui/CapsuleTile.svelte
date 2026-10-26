<script lang="ts">
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Package from '@lucide/svelte/icons/package';
	import PackageX from '@lucide/svelte/icons/package-x';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import User from '@lucide/svelte/icons/user';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Users from '@lucide/svelte/icons/users';
	import { formatMoney } from '#lib/shared/dinero';
	import { textos } from '#lib/shared/textos';
	import Badge from './Badge.svelte';
	import CapsuleImage from './CapsuleImage.svelte';
	import Confeti from './movimiento/Confeti.svelte';
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
		/** `visitante` (plan F10 D3): sin botón de invitado, sin precio ni contadores y con la acción `?/registrar`. */
		/** Contador: cada incremento lanza el confeti de la celebración (RF-243). Lo sube la página cuando el servidor confirma el registro. */
		celebrar?: number;
		modo?: 'miembro' | 'visitante';
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
		modo = 'miembro',
		celebrar = 0,
		class: className,
	}: Props = $props();

	const uid = $props.id();
	const level = $derived(stock <= 0 ? 'out' : stock <= threshold ? 'low' : null);
	const meta = $derived([brand, intensity ? `Int. ${intensity}` : null].filter(Boolean).join(' · '));
	let pulse = $state(false);
	const visitante = $derived(modo === 'visitante');
</script>

<!-- Tarjeta gráfica de cápsula para Inicio (RF-183, CA-183, excepción cerrada de cristal en constitución XVIII).
     Un único formulario `<form method="post" action="?/consumir">` con dos botones submit hermanos (`invitado="0"` y `invitado="1"`):
     funciona con y sin JavaScript (constitución XVII) y mantiene objetivos táctiles ≥ 44 px (RNF-001). -->
<li class={cn('glass relative rounded-panel', className)}>
	<form method="post" action={visitante ? '?/registrar' : '?/consumir'} class="relative h-full" use:enhancer>
		<input type="hidden" name="tipoCapsulaId" value={tipoId} />
		<input type="hidden" name="clienteId" value={clienteId} />
		<!-- RF-217: el servidor pide confirmación si el stock real es ≤ 0 y la tarjeta se mostró «Sin stock». -->
		{#if level === 'out' && !visitante}<input type="hidden" name="sinStock" value="1" />{/if}
		<button
			type="submit"
			data-tour={visitante ? undefined : 'capsula'}
			name={visitante ? undefined : 'invitado'}
			value={visitante ? undefined : '0'}
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
				class={cn(
					'motion-safe:transition-transform group-hover:-translate-y-0.5',
					pulse && 'capsule-pop',
					level === 'out' && !visitante && 'opacity-50 grayscale',
				)}
			/>
			<span class="sr-only">Registrar</span>
			<span class="line-clamp-2 text-[17px] font-semibold leading-[22px]">{name}</span>
			{#if visitante}
				{#if meta}<span aria-hidden="true" class="text-[13px] font-medium leading-[18px] text-ink-muted">{meta}</span>{/if}
			{:else}
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
			{/if}
			{#if !visitante && (ownCount > 0 || guestCount > 0)}
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
			<!-- RF-217, RF-218: icono y texto; el color nunca es la única señal. Atenuamos la imagen, no el texto (contraste). -->
			{#if level === 'out' && !visitante}
				<span aria-hidden="true">
					<Badge tone="negative">
						{#snippet icon()}<PackageX class="size-3.5" />{/snippet}
						{textos.inicio.sinStock}
					</Badge>
				</span>
			{:else if level === 'low' && !visitante}
				<span aria-hidden="true">
					<Badge tone="warning">
						{#snippet icon()}<TriangleAlert class="size-3.5" />{/snippet}
						{textos.inicio.quedanPocas}
					</Badge>
				</span>
			{/if}
			<span
				aria-hidden="true"
				class="mt-auto inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-[17px] font-semibold text-on-accent shadow-sm group-hover:brightness-110"
			>
				Me pongo esta
			</span>
		</button>
		<span id="{uid}-meta" class="sr-only">
			{#if visitante}{meta}{:else}{meta}{meta ? '. ' : ''}{formatMoney(priceCents)} por cápsula. Quedan {stock} unidades, {daysLeft == null
					? 'sin datos de duración'
					: `unos ${daysLeft} días`}.{level === 'out'
					? ` ${textos.inicio.sinStock}.`
					: level === 'low'
						? ` ${textos.inicio.quedanPocas}.`
						: ''}{/if}
		</span>
		{#if !visitante}
			<button
				type="submit"
				data-tour="invitado"
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
		{/if}
	</form>
	<Confeti disparo={celebrar} />
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
