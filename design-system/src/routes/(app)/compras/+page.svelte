<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import {
		Banner, Button, ConfirmDialog, Glass, IconButton, Money, MoneyField, MovementDetailSheet, MovementRow, PageHeader, PhotoField,
		RegularizationSummary, SelectField, Sheet, TextField, VoidDialog, formatMoney, voidConsequence, type MovementDetail
	} from '#lib';
	import { capsules, graceMinutes, huchaCents, me, purchases as purchaseSeed, regularizationDemo, viewer } from '#lib/mock';

	// ---- Historial de compras, detalle y anulación (RN-012, RF-045) ----
	let purchases = $state<MovementDetail[]>(structuredClone(purchaseSeed));
	let detail = $state<MovementDetail | null>(null);
	let detailOpen = $state(false);
	let voidTarget = $state<MovementDetail | null>(null);
	let voidOpen = $state(false);
	let summaryOpen = $state(false);
	function askVoid(m: MovementDetail) {
		voidTarget = m;
		voidOpen = true;
	}
	function confirmVoid(reason: string) {
		const id = voidTarget?.id;
		purchases = purchases.map((m) => (m.id === id ? { ...m, voided: { by: me.name, at: 'Ahora', reason } } : m));
		// RF-045: tras anular una compra se muestra el resumen de regularizaciones generadas.
		summaryOpen = true;
	}

	interface Line {
		key: number;
		capsuleId: string;
		qty: string;
		cents: number | null;
	}
	let open = $state(false);
	let confirmOpen = $state(false);
	let nextKey = 1;
	let lines = $state<Line[]>([{ key: 0, capsuleId: 'c1', qty: '50', cents: 1700 }]);
	let photo = $state<File | null>(null);
	let submitted = $state(false);

	const options = capsules.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name }));
	const total = $derived(lines.reduce((a, l) => a + (l.cents ?? 0), 0));
	const afterCents = $derived(huchaCents - total);
	const valid = $derived(lines.every((l) => Number(l.qty) > 0 && (l.cents ?? 0) > 0));

	const addLine = () => (lines = [...lines, { key: nextKey++, capsuleId: 'c2', qty: '', cents: null }]);
	const removeLine = (key: number) => (lines = lines.filter((l) => l.key !== key));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (!valid) return;
		// RF-043: si la hucha teórica queda negativa, se pide confirmación antes de enviar.
		if (afterCents < 0) confirmOpen = true;
		else save();
	}
	function save() {
		open = false;
		submitted = false;
	}
</script>

<PageHeader eyebrow="Compras" title="Historial">
	{#snippet actions()}<Button onclick={() => (open = true)}><Plus class="size-4" aria-hidden="true" /> Nueva compra</Button>{/snippet}
</PageHeader>

<Glass as="div" class="py-1">
	<ul class="divide-y divide-hairline">
		{#each purchases as m (m.id)}
			<MovementRow
				kind="compra"
				title={m.title}
				subtitle={`${m.at} · ${m.authorName}${m.origin?.includes('Con ticket') ? ' · con ticket' : ''}`}
				cents={m.cents}
				voided={!!m.voided}
				onclick={() => { detail = m; detailOpen = true; }}
			/>
		{/each}
	</ul>
</Glass>
<p class="mt-3 px-1 text-[13px] leading-[18px] text-ink-muted">Toca una compra para ver su detalle. Si te equivocaste, un administrador puede anularla.</p>

<Sheet bind:open title="Nueva compra" description="Se paga con dinero de la hucha. Tu saldo personal no cambia.">
	<form id="purchase" class="flex flex-col gap-4 pt-2" onsubmit={submit}>
		<div class="flex flex-col gap-3">
			{#each lines as line, i (line.key)}
				<Glass radius="tile" class="flex flex-col gap-3 p-3">
					<div class="flex items-end gap-2">
						<SelectField label="Cápsula" bind:value={line.capsuleId} {options} class="flex-1" />
						{#if lines.length > 1}
							<IconButton label="Quitar la línea {i + 1}" variant="ghost" onclick={() => removeLine(line.key)}><X class="size-5" aria-hidden="true" /></IconButton>
						{/if}
					</div>
					<div class="grid grid-cols-2 gap-3">
						<TextField label="Cantidad" type="number" inputmode="numeric" min="1" bind:value={line.qty}
							error={submitted && !(Number(line.qty) > 0) ? 'Indica la cantidad.' : undefined} />
						<MoneyField label={lines.length > 1 ? 'Importe de la línea' : 'Importe'} bind:cents={line.cents}
							error={submitted && !((line.cents ?? 0) > 0) ? 'Indica el importe.' : undefined} />
					</div>
				</Glass>
			{/each}
			<Button variant="ghost" onclick={addLine} class="self-start"><Plus class="size-4" aria-hidden="true" /> Añadir otra cápsula</Button>
		</div>

		{#if lines.length > 1}
			<!-- RF-040: con varias líneas se muestra el total calculado para compararlo con el ticket. -->
			<p class="flex items-baseline justify-between px-1 text-[16px] font-semibold">
				<span>Total calculado</span><span class="text-2xl"><Money cents={total} /></span>
			</p>
		{/if}

		{#if afterCents < 0 && total > 0}
			<Banner tone="warning" title="La hucha se quedaría en negativo">
				La hucha debería tener {formatMoney(huchaCents)}. Tras esta compra quedaría en <b>{formatMoney(afterCents)}</b>.
			</Banner>
		{/if}

		<PhotoField label="Foto del ticket (opcional)" bind:file={photo} />
	</form>
	{#snippet footer()}
		<Button type="submit" form="purchase" size="lg" block>Confirmar compra · {formatMoney(total)}</Button>
	{/snippet}
</Sheet>

<ConfirmDialog
	bind:open={confirmOpen}
	title="¿Registrar la compra?"
	description="La hucha debería tener {formatMoney(huchaCents)}. Si confirmas, quedará en {formatMoney(afterCents)} y se avisará a los administradores."
	confirmLabel="Sí, registrar"
	onconfirm={save}
/>

<MovementDetailSheet bind:open={detailOpen} movement={detail} {viewer} {graceMinutes} onvoid={askVoid} />
<VoidDialog
	bind:open={voidOpen}
	subject={voidTarget ? `${voidTarget.title} · ${voidTarget.at}` : ''}
	consequence={voidTarget ? voidConsequence(voidTarget) : undefined}
	onconfirm={confirmVoid}
/>
<RegularizationSummary bind:open={summaryOpen} result={regularizationDemo} />
