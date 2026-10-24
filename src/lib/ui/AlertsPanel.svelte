<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import HandCoins from '@lucide/svelte/icons/hand-coins';
	import PiggyBank from '@lucide/svelte/icons/piggy-bank';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Glass from './Glass.svelte';
	import Money from './Money.svelte';

	type Props = {
		/** Saldo teórico de la hucha, en céntimos (RN-011). */
		huchaCents: number;
		/** Saldo de la persona que usa la app, en céntimos (RN-010). */
		myBalanceCents: number;
		/** Nombres de los tipos en stock bajo (RN-071). */
		lowStock?: string[];
		/** Personas por debajo del límite de deuda (RN-074). */
		debtors?: { name: string; cents: number }[];
	};
	let { huchaCents, myBalanceCents, lowStock = [], debtors = [] }: Props = $props();
</script>

<!-- RF-021, RF-184: panel de avisos y saldos al abrir la app, sin texto redundante por línea. -->
<Glass as="section" aria-label="Avisos" class="grid grid-cols-2 gap-x-3 gap-y-3">
	<div>
		<span class="mb-2 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
			<PiggyBank class="size-5" />
		</span>
		<p class="text-[13px] leading-[18px] text-ink-muted">Hucha (teórica)</p>
		<p class="mt-0.5 text-2xl font-bold leading-[30px] tracking-tight">
			<Money cents={huchaCents} tone={huchaCents < 0} srSuffix={huchaCents < 0 ? 'hucha en negativo' : undefined} />
		</p>
	</div>
	<div>
		<span class="mb-2 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
			<Wallet class="size-5" />
		</span>
		<p class="text-[13px] leading-[18px] text-ink-muted">Tu saldo</p>
		<p class="mt-0.5 text-2xl font-bold leading-[30px] tracking-tight">
			<Money cents={myBalanceCents} signed tone srSuffix={myBalanceCents < 0 ? 'debes' : myBalanceCents > 0 ? 'a tu favor' : undefined} />
		</p>
	</div>
	{#if lowStock.length}
		<p class="col-span-2 flex items-start gap-2 border-t border-hairline pt-3 text-[14px] font-medium leading-[19px] text-warning">
			<TriangleAlert class="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
			<span>
				{lowStock.length === 1 ? '1 tipo en stock bajo' : `${lowStock.length} tipos en stock bajo`}:
				{#each lowStock as nombre, i (nombre)}{#if i > 0},
					{/if}<span class="font-normal text-ink">{nombre}</span>{/each}
			</span>
		</p>
	{/if}
	{#if debtors.length}
		<p class="col-span-2 flex items-start gap-2 border-t border-hairline pt-3 text-[14px] font-medium leading-[19px] text-negative">
			<HandCoins class="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
			<span>
				Por debajo del límite:
				<span class="font-normal text-ink">
					{#each debtors as d, i (d.name)}{i ? ', ' : ''}{d.name} <Money cents={d.cents} />{/each}
				</span>
			</span>
		</p>
	{/if}
</Glass>
