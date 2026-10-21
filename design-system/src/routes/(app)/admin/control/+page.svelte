<script lang="ts">
	import { Banner, Button, ConfirmDialog, Glass, Money, MoneyField, MovementRow, PageHeader, SegmentedControl, Section, TextField, VoidDialog, formatMoney } from '#lib';
	import { capsules, huchaCents, members } from '#lib/mock';

	let tab = $state<'arqueo' | 'recuento'>('arqueo');
	const activeMembers = members.filter((m) => m.active).length;

	// ---- Arqueo (RF-080 a RF-082, RN-015) ----
	let counted = $state<number | null>(null);
	let arqueoConfirm = $state(false);
	const diff = $derived(counted == null ? null : counted - huchaCents);
	const perPerson = $derived(diff == null || diff === 0 ? 0 : Math.trunc(diff / activeMembers));

	// ---- Recuento (RF-090 a RF-092, RN-016) ----
	const typed = capsules.filter((c) => c.active);
	let counts = $state<Record<string, string>>({});
	let recuentoConfirm = $state(false);
	const missing = $derived(
		typed
			.map((c) => ({ c, f: counts[c.id] === undefined || counts[c.id] === '' ? 0 : c.stock - Number(counts[c.id]) }))
			.filter((x) => x.f > 0)
	);
	const costToShare = $derived(missing.reduce((a, x) => a + x.f * x.c.avgCostCents, 0));

	// ---- Anular el último arqueo / el último recuento de cada tipo (RN-036) ----
	// Datos de muestra: el servidor decide cuál es «el último» de cada tipo.
	type Recount = { id: string; capsule: string; date: string; text: string; cents: number; by: string; voided?: boolean };
	let recounts = $state<Recount[]>([
		{ id: 'r1', capsule: 'Ristretto', date: '13 oct', text: 'faltaban 2', cents: -70, by: 'Marta Ruiz' },
		{ id: 'r2', capsule: 'Ristretto', date: '29 sep', text: 'cuadraba', cents: 0, by: 'Marta Ruiz' },
		{ id: 'r3', capsule: 'Lungo', date: '13 oct', text: 'faltaba 1', cents: -34, by: 'Marta Ruiz' },
		{ id: 'r4', capsule: 'Descafeinado', date: '29 sep', text: 'sobraban 3', cents: 0, by: 'Jorge Gil' }
	]);
	// Último recuento vigente de cada tipo: solo ese lleva «Anular».
	const lastPerType = $derived(
		Object.fromEntries(
			[...new Set(recounts.map((r) => r.capsule))].map((t) => [t, recounts.find((r) => r.capsule === t && !r.voided)?.id])
		)
	);
	let arqueoVoid = $state(false);
	let arqueoVoided = $state(false);
	let recountToVoid = $state<Recount | null>(null);
	let recountVoidOpen = $state(false);
	function askVoidRecount(r: Recount) {
		recountToVoid = r;
		recountVoidOpen = true;
	}
</script>

<PageHeader eyebrow="Administración" title="Arqueos y recuentos" />

<SegmentedControl
	bind:value={tab}
	label="Operación"
	options={[
		{ value: 'arqueo', label: 'Arqueo de la hucha' },
		{ value: 'recuento', label: 'Recuento de stock' }
	]}
/>

{#if tab === 'arqueo'}
	<Glass as="section" class="mt-4 flex flex-col gap-4">
		<div>
			<p class="text-[14px] leading-5 text-ink-muted">Saldo teórico de la hucha</p>
			<p class="type-amount"><Money cents={huchaCents} /></p>
		</div>
		<MoneyField label="Dinero contado" bind:cents={counted} hint="Cuenta el efectivo que hay de verdad en la hucha." />
		{#if diff !== null}
			<Banner tone={diff === 0 ? 'info' : 'warning'} title={diff === 0 ? 'Cuadra' : `Diferencia de ${formatMoney(diff, { signed: true })}`}>
				{#if diff === 0}
					No hay nada que repartir.
				{:else}
					Se ajusta el saldo teórico y se reparte entre los {activeMembers} miembros activos: <b>{formatMoney(perPerson, { signed: true })} por persona</b>
					({diff < 0 ? 'cargos' : 'abonos'}). Los céntimos sobrantes se asignan al azar.
				{/if}
			</Banner>
		{/if}
		<Button size="lg" block disabled={counted == null} onclick={() => (arqueoConfirm = true)}>Registrar arqueo</Button>
	</Glass>
{:else}
	<Glass as="section" class="mt-4 flex flex-col gap-3">
		<p class="text-[14px] leading-[19px] text-ink-muted">Cuenta las cápsulas que hay y escribe la cantidad. Deja en blanco los tipos que no cuentes.</p>
		<ul class="divide-y divide-hairline">
			{#each typed as c (c.id)}
				<li class="flex items-center gap-3 py-2">
					<span class="min-w-0 flex-1">
						<span class="block truncate text-[15px] font-semibold">{c.name}</span>
						<span class="block text-[13px] leading-[17px] text-ink-muted">Registrado: {c.stock} uds</span>
					</span>
					<TextField label="Contadas" type="number" inputmode="numeric" min="0" bind:value={counts[c.id]} class="w-28" />
				</li>
			{/each}
		</ul>
		{#if missing.length}
			<Banner tone="warning" title="Faltan cápsulas">
				{#each missing as x, i (x.c.id)}{i ? ', ' : ''}{x.f} de {x.c.name}{/each}.
				Se reparte {formatMoney(costToShare)} entre los {activeMembers} miembros (≈ {formatMoney(Math.trunc(costToShare / activeMembers))} cada uno).
			</Banner>
		{/if}
		<Button size="lg" block onclick={() => (recuentoConfirm = true)}>Registrar recuento</Button>
	</Glass>
{/if}

<Section title="Último arqueo">
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			<MovementRow kind="arqueo" title="Arqueo de la hucha" subtitle="13 oct · diferencia 0,00 € · Marta Ruiz" voided={arqueoVoided} />
		</ul>
		<div class="border-t border-hairline px-1 pt-3">
			<!-- RN-036: solo se puede anular el último arqueo. -->
			<Button variant="soft" disabled={arqueoVoided} onclick={() => (arqueoVoid = true)}>{arqueoVoided ? 'Arqueo anulado' : 'Anular el último arqueo'}</Button>
		</div>
	</Glass>
</Section>

<Section title="Recuentos por tipo">
	<p class="-mt-1 mb-3 text-[13px] leading-[18px] text-ink-muted">Solo se puede anular el último recuento de cada tipo de cápsula. Los anteriores quedan fijos.</p>
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			{#each recounts as r (r.id)}
				<MovementRow kind="recuento" title="{r.capsule} · recuento" subtitle="{r.date} · {r.text} · {r.by}" cents={r.cents || undefined} voided={r.voided} />
				{#if lastPerType[r.capsule] === r.id}
					<li class="pb-3 pl-12">
						<Button variant="soft" onclick={() => askVoidRecount(r)} aria-label="Anular el recuento de {r.capsule} del {r.date}">Anular este recuento</Button>
					</li>
				{/if}
			{/each}
		</ul>
	</Glass>
</Section>

<ConfirmDialog
	bind:open={arqueoConfirm}
	title="¿Registrar el arqueo?"
	description="Se ajustará el saldo teórico y se repartirá la diferencia. Podrás anular este arqueo mientras sea el último."
	confirmLabel="Registrar arqueo"
	onconfirm={() => (counted = null)}
/>
<ConfirmDialog
	bind:open={recuentoConfirm}
	title="¿Registrar el recuento?"
	description="El stock se ajustará a lo contado y el valor de lo que falte se repartirá entre los miembros."
	confirmLabel="Registrar recuento"
	onconfirm={() => (counts = {})}
/>
<VoidDialog bind:open={arqueoVoid} subject="Arqueo de la hucha · 13 oct" consequence="Se revierten el ajuste y los repartos de este arqueo." onconfirm={() => (arqueoVoided = true)} />
<VoidDialog
	bind:open={recountVoidOpen}
	subject="{recountToVoid?.capsule} · recuento del {recountToVoid?.date}"
	consequence="Se revierten el ajuste de stock y el reparto de ese tipo; los demás tipos no cambian."
	onconfirm={() => recountToVoid && (recountToVoid.voided = true)}
/>
