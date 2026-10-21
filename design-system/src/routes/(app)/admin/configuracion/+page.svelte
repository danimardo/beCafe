<script lang="ts">
	import { Banner, Button, Glass, MoneyField, PageHeader, ReauthDialog, Section, TextField, formatMoney } from '#lib';
	import { configChanges, debtLimitCents } from '#lib/mock';

	let grace = $state('15');
	let limit = $state<number | null>(-debtLimitCents);
	let refillInterval = $state('60'); // RN-082: minutos entre dos rellenos vigentes (60 por defecto)
	let reauth = $state(false);
	let saved = $state(false);

	// RN-074: la frecuencia del recordatorio no se configura; se deriva del límite L. Solo se muestra como información (RF-150).
	const tiers = $derived(
		[
			{ mult: 1, every: 'cada 7 días' },
			{ mult: 2, every: 'cada 3 días' },
			{ mult: 4, every: 'cada día' }
		].map((t) => ({ ...t, below: formatMoney(-(limit ?? 0) * t.mult) }))
	);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		reauth = true; // RN-050: configurar exige haber introducido la contraseña hace menos de 15 minutos.
	}
</script>

<PageHeader eyebrow="Administración" title="Configuración" />

{#if saved}<div class="mb-4"><Banner tone="info" title="Configuración guardada">El cambio queda registrado con tu nombre y la fecha.</Banner></div>{/if}

<Glass as="section">
	<form class="flex flex-col gap-5" onsubmit={submit}>
		<TextField label="Plazo de autoanulación (minutos)" type="number" inputmode="numeric" min="1" bind:value={grace} hint="Tiempo durante el que un miembro puede anular sus propios registros." />
		<MoneyField label="Límite de deuda" bind:cents={limit} hint="Por debajo de {formatMoney(-(limit ?? 0))} se avisa a la persona y se lista en el panel de avisos." />

		<!-- Información, no un ajuste: crece con la deuda (RN-074). El intervalo se cuenta desde el último recordatorio enviado. -->
		<div class="rounded-tile bg-accent-soft p-3.5" aria-labelledby="tiers-title">
			<h2 id="tiers-title" class="text-[15px] font-semibold leading-5">Recordatorio de deuda (automático)</h2>
			<p class="mt-0.5 text-[13px] leading-[18px] text-ink-muted">Cuanta más deuda, más a menudo se recuerda. Se calcula a partir del límite y no se puede cambiar.</p>
			<ul class="mt-2 flex flex-col gap-1 text-[14px] leading-5">
				{#each tiers as t (t.mult)}
					<li>Por debajo de <b>{t.below}</b>: <b>{t.every}</b></li>
				{/each}
			</ul>
			<p class="mt-2 text-[13px] leading-[18px] text-ink-muted">Pasar a un tramo más alto no envía un aviso inmediato: se espera al intervalo desde el último recordatorio.</p>
		</div>

		<TextField label="Intervalo mínimo entre rellenos de agua (minutos)" type="number" inputmode="numeric" min="1" bind:value={refillInterval} hint="Tras un relleno, nadie puede registrar otro hasta que pasa este tiempo. Los rellenos anulados no cuentan." />
		<Button type="submit" size="lg" block>Guardar configuración</Button>
	</form>
</Glass>

<Section title="Cambios recientes">
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			{#each configChanges as c (c.id)}
				<li class="py-3">
					<p class="text-[15px] font-semibold leading-5">{c.what}</p>
					<p class="text-[13px] leading-[18px] text-ink-muted">{c.who} · {c.when}</p>
				</li>
			{/each}
		</ul>
	</Glass>
</Section>

<ReauthDialog bind:open={reauth} onsubmit={() => true} onsuccess={() => (saved = true)} />
