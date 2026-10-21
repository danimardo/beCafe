<script lang="ts">
	import Sheet from '../ui/Sheet.svelte';
	import Button from '../ui/Button.svelte';
	import Banner from '../ui/Banner.svelte';
	import Avatar from '../ui/Avatar.svelte';
	import Money from '../ui/Money.svelte';
	import ListRow from '../ui/ListRow.svelte';
	import { formatUnitCost } from '#lib/utils';

	export interface Regularization {
		/** Nombre de la persona afectada. */
		name: string;
		/** Consumos suyos posteriores a la compra anulada. */
		consumptions: number;
		/** Regularización en céntimos (positiva: se le devuelve; negativa: se le cobra). */
		cents: number;
	}
	export interface RegularizationResult {
		purchaseTitle: string;
		capsuleName: string;
		/** Coste medio antes y después, en diezmilésimas de euro (RN-020). */
		avgBefore: number;
		avgAfter: number;
		items: Regularization[];
	}

	type Props = {
		open?: boolean;
		result: RegularizationResult | null;
		onclose?: () => void;
	};
	let { open = $bindable(false), result, onclose }: Props = $props();
	const total = $derived(result?.items.reduce((s, i) => s + i.cents, 0) ?? 0);
</script>

<!-- RF-045 / RN-012: al anular una compra, quien la anula ve qué ajustes se generaron y a quién afectan. PROPUESTO: hoja con el resumen. -->
<Sheet bind:open title="Compra anulada" description={result?.purchaseTitle}>
	{#if result}
		<div class="flex flex-col gap-4 pt-1">
			<Banner tone="info" title="Coste medio de {result.capsuleName}">
				Era {formatUnitCost(result.avgBefore)} por cápsula y se ha reconstruido a <b>{formatUnitCost(result.avgAfter)}</b> con las compras que siguen vigentes.
			</Banner>

			{#if result.items.length}
				<div>
					<h3 class="type-title mb-1">Regularizaciones generadas</h3>
					<p class="mb-2 text-[13px] leading-[18px] text-ink-muted">
						Una por cada persona con consumos posteriores a la compra. Los cargos originales no cambian: se añade un ajuste con la diferencia.
					</p>
					<ul class="divide-y divide-hairline rounded-tile bg-accent-soft px-3">
						{#each result.items as r (r.name)}
							<ListRow title={r.name} subtitle={r.consumptions === 1 ? '1 consumo posterior' : `${r.consumptions} consumos posteriores`}>
								{#snippet leading()}<Avatar name={r.name} />{/snippet}
								{#snippet trailing()}
									<span class="text-[15px] font-semibold"><Money cents={r.cents} signed tone srSuffix={r.cents > 0 ? 'a favor' : 'a cargo'} /></span>
								{/snippet}
							</ListRow>
						{/each}
					</ul>
					<p class="mt-2 flex items-baseline justify-between px-1 text-[14px] font-semibold">
						<span>Total de ajustes ({result.items.length} {result.items.length === 1 ? 'persona' : 'personas'})</span>
						<Money cents={total} signed />
					</p>
				</div>
			{:else}
				<Banner tone="info" title="Sin regularizaciones">Nadie consumió ese tipo después de la compra, así que no hay nada que ajustar.</Banner>
			{/if}
		</div>
	{/if}
	{#snippet footer()}
		<Button size="lg" block onclick={() => { open = false; onclose?.(); }}>Entendido</Button>
	{/snippet}
</Sheet>
