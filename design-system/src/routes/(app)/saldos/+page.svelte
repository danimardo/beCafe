<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Avatar, Button, Glass, ListRow, Money, MovementList, MoneyField, PageHeader, Section, Sheet, type MovementDetail } from '#lib';
	import { graceMinutes, historyAll, huchaCents, members, me, viewer } from '#lib/mock';

	let contributeOpen = $state(false);
	let cents = $state<number | null>(null);
	let error = $state('');

	const active = members.filter((m) => m.active);

	// Últimos 5 movimientos (CA-111). El historial completo vive en /historial.
	let recent = $state<MovementDetail[]>(structuredClone(historyAll.slice(0, 5)));
	function voided(id: string, reason: string) {
		recent = recent.map((m) => (m.id === id ? { ...m, voided: { by: me.name, at: 'Ahora', reason } } : m));
	}

	function contribute(e: SubmitEvent) {
		e.preventDefault();
		// RF-032: importe > 0 y ≤ 500 €. El servidor valida de nuevo.
		if (cents == null || cents <= 0 || cents > 50000) {
			error = 'Introduce un importe mayor que 0 y de hasta 500 €.';
			return;
		}
		error = '';
		contributeOpen = false;
		cents = null;
	}
</script>

<PageHeader eyebrow="Hucha común" title="Saldos" />

<Glass as="section" aria-label="Hucha">
	<p class="text-[14px] leading-5 text-ink-muted">Debería haber en la hucha</p>
	<p class="type-amount my-1"><Money cents={huchaCents} /></p>
	<p class="text-[14px] leading-5 text-ink-muted">Último arqueo: 13 oct · diferencia 0,00 €</p>
	<div class="mt-4 grid grid-cols-2 gap-3">
		<Button onclick={() => (contributeOpen = true)}>+ Aportar</Button>
		<Button href="/compras" variant="soft">Nueva compra</Button>
	</div>
</Glass>

<Section title="Saldos">
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			{#each active as m (m.id)}
				<!-- Solo la fila propia es pulsable: abre /historial con «Míos» seleccionado (CA-111). Las demás no. -->
				<ListRow
					title={m.id === me.id ? `${m.name} (tú)` : m.name}
					subtitle={m.id === me.id ? 'Ver mis movimientos' : m.note}
					href={m.id === me.id ? '/historial?quien=mios' : undefined}
				>
					{#snippet leading()}<Avatar name={m.name} />{/snippet}
					{#snippet trailing()}
						<span class="flex items-center gap-1">
							<span class="text-[15px] font-semibold">
								<Money cents={m.balanceCents} signed tone srSuffix={m.balanceCents < 0 ? 'debe' : m.balanceCents > 0 ? 'a favor' : undefined} />
							</span>
							{#if m.id === me.id}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/if}
						</span>
					{/snippet}
				</ListRow>
			{/each}
		</ul>
	</Glass>
</Section>

<Section title="Últimos movimientos">
	<MovementList items={recent} {viewer} {graceMinutes} onvoided={voided} />
	<div class="mt-3 flex justify-center">
		<Button href="/historial" variant="soft">Ver todo el historial <ChevronRight class="size-4" aria-hidden="true" /></Button>
	</div>
</Section>

<Sheet bind:open={contributeOpen} title="Aportar a la hucha" description="El dinero que metas reduce tu deuda.">
	<form id="contribute" class="pt-2" onsubmit={contribute}>
		<MoneyField label="Importe" bind:cents required {error} hint="Máximo 500 €." />
	</form>
	{#snippet footer()}<Button type="submit" form="contribute" size="lg" block>Registrar aportación</Button>{/snippet}
</Sheet>

