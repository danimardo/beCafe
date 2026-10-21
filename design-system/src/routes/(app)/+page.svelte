<script lang="ts">
	import { page } from '$app/state';
	import { AlertsPanel, Banner, Button, CapsuleRow, PageHeader, Section, Avatar, WaterRefillCard, toasts, formatMoney } from '#lib';
	import { capsules, members, huchaCents, debtLimitCents, me, aguador, lastRefill, refillIntervalMinutes } from '#lib/mock';

	const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
	const active = capsules.filter((c) => c.active && c.avgCostCents > 0); // RN-006: sin coste medio no se muestra

	// Demo de estados (solo plantilla): /?demo=pendientes · /?demo=rechazado
	const demo = $derived(page.url.searchParams.get('demo'));
	let rejectedDismissed = $state(false);
	const pending = 3;

	// ---- Relleno de agua (RF-170 a RF-176) ----
	// Demos: ?demo=relleno-reciente (Jorge la rellenó hace 20 min) · sin-rellenos · sin-conexion · sin-aguador
	let online = $state(true);
	const offline = $derived(demo === 'sin-conexion' || !online); // RN-081: sin conexión no se registra
	let last = $state<{ name: string; minutesAgo: number } | null>(lastRefill);
	$effect(() => {
		if (demo === 'relleno-reciente') last = { name: 'Jorge', minutesAgo: 20 };
		else if (demo === 'sin-rellenos') last = null;
	});
	const aguadorShown = $derived(demo === 'sin-aguador' ? null : aguador);
	function refill() {
		// En la app real: POST /api/rellenos { clienteId } (idempotente). No mueve dinero (RN-080) y no entra en la cola sin conexión.
		const before = last;
		last = { name: me.name.split(' ')[0], minutesAgo: 0 };
		toasts.showUndo({
			title: 'Relleno registrado',
			detail: 'Gracias por ocuparte del agua.',
			kind: 'ok',
			onundo: () => (last = before) // «Deshacer» en 5 s, sin motivo (RN-083)
		});
	}
	const lowStock = active.filter((c) => c.stock <= c.threshold).map((c) => c.name);
	const debtors = members.filter((m) => m.active && m.balanceCents < debtLimitCents).map((m) => ({ name: m.name, cents: m.balanceCents }));

	function register(c: (typeof capsules)[number], guest: boolean) {
		// En la app real: POST /api/consumos con clienteId (idempotente) y, sin conexión, a la cola local (RF-015, RF-016).
		// RF-017: con stock ≤ 0 se registra igualmente (el stock queda negativo) y se avisa del descuadre.
		const noStock = c.stock <= 0;
		toasts.showUndo({
			title: `${c.name} registrado${guest ? ' · invitado' : ''}`,
			detail: `${formatMoney(-c.avgCostCents)} · quedan ${c.stock - 1}`,
			warning: noStock ? 'No constaba stock: avisa a un administrador para revisar el recuento.' : undefined,
			duration: noStock ? 9000 : undefined,
			color: c.color,
			photoUrl: c.photoUrl,
			onundo: () => {}
		});
	}
</script>

<PageHeader eyebrow={today} title="Hola, {me.name.split(' ')[0]}">
	{#snippet actions()}<Avatar name={me.name} size="md" />{/snippet}
</PageHeader>

{#if demo === 'rechazado' && !rejectedDismissed}
	<!-- RN-054: el servidor rechaza consumos de usuarios dados de baja, también los de la cola sin conexión. -->
	<Banner tone="negative" title="Consumo rechazado" class="mb-3">
		Tu cuenta está dada de baja y el consumo de «Ristretto» no se ha registrado. Habla con un administrador.
		{#snippet actions()}<Button variant="soft" onclick={() => (rejectedDismissed = true)}>Entendido</Button>{/snippet}
	</Banner>
{/if}
{#if demo === 'pendientes'}
	<!-- RF-019: la cola local solo vive en este navegador. -->
	<Banner tone="warning" title="{pending} consumos pendientes de enviar" class="mb-3">
		Se enviarán cuando vuelva la conexión. Si borras los datos del navegador, se perderán.
	</Banner>
{/if}

<AlertsPanel {huchaCents} myBalanceCents={-245} {lowStock} {debtors} />

<svelte:window ononline={() => (online = true)} onoffline={() => (online = false)} />

<WaterRefillCard class="mb-1 mt-3" {last} intervalMinutes={refillIntervalMinutes} {offline} aguador={aguadorShown} meName={me.name} onrefill={refill} />

<Section title="¿Qué cápsula te pones?">
	<p class="-mt-1 mb-3 text-[13px] leading-[18px] text-ink-muted">
		Toca una cápsula para registrarla. El botón de persona la registra para un invitado.
	</p>
	<ul class="flex flex-col gap-2">
		{#each active as c (c.id)}
			<CapsuleRow
				name={c.name}
				brand={c.brand}
				intensity={c.intensity}
				stock={c.stock}
				threshold={c.threshold}
				avgCostCents={c.avgCostCents}
				color={c.color}
				photoUrl={c.photoUrl}
				daysLeft={c.daysLeft}
				onregister={() => register(c, false)}
				onregisterGuest={() => register(c, true)}
			/>
		{/each}
	</ul>
</Section>
