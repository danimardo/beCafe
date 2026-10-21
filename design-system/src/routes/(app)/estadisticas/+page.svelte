<script lang="ts">
	import { BarChart, Glass, KpiTile, PageHeader, SegmentedControl, Section, SelectField, SplitBar } from '#lib';
	import { favourites, guestByType, guestMonthly, me, members, myRefills, refillRanking, teamByType, teamMonthly, weekly } from '#lib/mock';

	let scope = $state<'mias' | 'equipo'>('mias');
	let period = $state<'semana' | 'mes' | 'anio'>('mes');

	// RF-123 (propuesto: selector en la cabecera de «Mis estadísticas», solo para administradores).
	// RF-122: a un miembro no se le pinta el selector y el servidor deniega la petición directa por URL.
	let personId = $state(me.id);
	const person = $derived(members.find((m) => m.id === personId) ?? members[0]);
	const isMe = $derived(personId === me.id);
	const isAdmin = me.role === 'administrador';
	const rankMax = $derived(Math.max(1, ...refillRanking[period].map((r) => r.count)));
	const sum = (xs: { value: number }[]) => xs.reduce((a, x) => a + x.value, 0);
</script>

<PageHeader eyebrow={scope === 'mias' ? (isMe ? 'Tus estadísticas' : 'Estadísticas de ' + person.name) : 'Todo el departamento'} title="Octubre" />

<SegmentedControl
	bind:value={scope}
	label="Qué ver"
	options={[
		{ value: 'mias', label: isMe || scope === 'equipo' ? 'Mías' : person.name.split(' ')[0] },
		{ value: 'equipo', label: 'Equipo' }
	]}
/>

<div class="mt-3">
	<SegmentedControl
		bind:value={period}
		label="Periodo"
		options={[
			{ value: 'semana', label: 'Semana' },
			{ value: 'mes', label: 'Mes' },
			{ value: 'anio', label: 'Año' }
		]}
	/>
</div>

{#if scope === 'mias'}
	{#if isAdmin}
		<div class="mt-3">
			<SelectField
				label="Persona"
				bind:value={personId}
				hint={isMe ? undefined : 'Estás viendo las estadísticas de otra persona.'}
				options={members.map((m) => ({ value: m.id, label: m.id === me.id ? `${m.name} (tú)` : m.name + (m.active ? '' : ' · baja') }))}
			/>
		</div>
	{/if}
	<div class="mt-4 grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
		<KpiTile label="cafés" value="12" />
		<KpiTile label="gastado" value="4,30 €" />
		<KpiTile label="invitados" value="2" />
		<!-- RF-175: los rellenos propios van en las estadísticas personales. -->
		<KpiTile label="rellenos de agua" value={String(myRefills[period])} />
	</div>

	<Glass as="section" class="mt-3" aria-labelledby="h-semana">
		<h2 id="h-semana" class="type-title">Cafés por semana</h2>
		<p class="text-[13px] leading-[18px] text-ink-muted">Media del equipo: 2,6 al día</p>
		<BarChart title="Cafés por semana" data={weekly} />
	</Glass>

	<Glass as="section" class="mt-3" aria-labelledby="h-fav">
		<h2 id="h-fav" class="type-title">{isMe ? 'Tus cápsulas favoritas' : 'Cápsulas favoritas'}</h2>
		<SplitBar title="Cápsulas favoritas" segments={favourites} />
	</Glass>
{:else}
	<!-- RF-120: global por mes y por tipo; los invitados se cuentan aparte y nunca se suman a los miembros. -->
	<div class="mt-4 grid grid-cols-2 gap-2">
		<KpiTile label="cafés de miembros · oct" value={String(teamMonthly.at(-1)?.value)} />
		<KpiTile label="de invitados · oct" value={String(guestMonthly.at(-1)?.value)} />
	</div>

	<Glass as="section" class="mt-3" aria-labelledby="h-mes">
		<h2 id="h-mes" class="type-title">Cafés por mes</h2>
		<p class="text-[13px] leading-[18px] text-ink-muted">Solo miembros, sin invitados</p>
		<BarChart title="Cafés de miembros por mes" data={teamMonthly} />
	</Glass>

	<Glass as="section" class="mt-3" aria-labelledby="h-tipo">
		<h2 id="h-tipo" class="type-title">Por tipo de cápsula</h2>
		<p class="text-[13px] leading-[18px] text-ink-muted">Octubre · {sum(teamByType)} cafés de miembros</p>
		<SplitBar title="Cafés de miembros por tipo" segments={teamByType} />
	</Glass>

	<Glass as="section" class="mt-3" aria-labelledby="h-agua">
		<h2 id="h-agua" class="type-title">Rellenos de agua</h2>
		<p class="text-[13px] leading-[18px] text-ink-muted">Quién se ocupa de la cafetera · {period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mes' : 'este año'}</p>
		<!-- RF-175: todos los miembros ven el ranking de rellenos vigentes. RN-085: las bajas siguen contando en los periodos en que rellenaron. -->
		<ol class="mt-3 flex flex-col gap-2.5">
			{#each refillRanking[period] as r, i (r.name)}
				<li class="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1">
					<span class="text-[14px] font-semibold text-ink-muted">{i + 1}.</span>
					<span class="truncate text-[15px] font-medium">{r.name}{#if r.baja}<span class="text-ink-muted">&nbsp;· baja</span>{/if}</span>
					<span class="text-[15px] font-semibold">{r.count}</span>
					<span class="col-start-2 col-end-4 h-2 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
						<span class="block h-full rounded-full bg-accent" style="width: {(r.count / rankMax) * 100}%"></span>
					</span>
				</li>
			{/each}
		</ol>
	</Glass>

	<Section title="Invitados">
		<Glass as="div">
			<h3 class="type-title">Aparte de los miembros</h3>
			<p class="text-[13px] leading-[18px] text-ink-muted">Los invitados no entran en las cifras de arriba.</p>
			<BarChart title="Cafés de invitados por mes" data={guestMonthly} />
			<SplitBar title="Cafés de invitados por tipo" segments={guestByType} />
		</Glass>
	</Section>
{/if}
