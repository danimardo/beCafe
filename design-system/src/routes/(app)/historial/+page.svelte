<script lang="ts">
	import { page as route } from '$app/state';
	import {
		BackLink, MovementList, PageHeader, Pagination, SegmentedControl, SelectField, Switch, kindGroups, type MovementDetail
	} from '#lib';
	import { graceMinutes, historyAll, historyMine, me, viewer } from '#lib/mock';

	// Estado inicial desde la URL: /historial?quien=mios&tipo=rellenos (la fila propia de /saldos y la tarjeta del agua enlazan así).
	const q = route.url.searchParams;
	let scope = $state<'todo' | 'mios'>(q.get('quien') === 'mios' ? 'mios' : 'todo');
	let type = $state<string>(q.get('tipo') && q.get('tipo')! in kindGroups ? q.get('tipo')! : 'todo');
	let showVoided = $state(false); // RN-062: anulados ocultos por defecto
	let current = $state(1);
	// Tamaño de página (propuesto): 20 en producción; 8 aquí para que la plantilla muestre varias páginas.
	const pageSize = 8;

	let all = $state<MovementDetail[]>(structuredClone(historyAll));
	let mine = $state<MovementDetail[]>(structuredClone(historyMine));

	const source = $derived(scope === 'mios' ? mine : all);
	const filtered = $derived(
		source.filter((m) => (showVoided || !m.voided) && (type === 'todo' || (kindGroups[type as keyof typeof kindGroups] as readonly string[]).includes(m.kind)))
	);
	const pages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const items = $derived(filtered.slice((current - 1) * pageSize, current * pageSize));

	// Cualquier cambio de filtro vuelve a la página 1.
	$effect(() => {
		scope;
		type;
		showVoided;
		current = 1;
	});

	const typeOptions = $derived([
		{ value: 'todo', label: 'Todos los tipos' },
		...(scope === 'mios' ? [{ value: 'consumos', label: 'Consumos' }] : []),
		{ value: 'aportes', label: 'Aportaciones' },
		{ value: 'compras', label: 'Compras' },
		{ value: 'control', label: 'Arqueos, recuentos y ajustes' },
		{ value: 'rellenos', label: 'Rellenos de agua' }
	]);
	// Si se pasa a «Todo» con «Consumos» elegido, el tipo deja de existir: se vuelve a «Todos».
	$effect(() => {
		if (!typeOptions.some((o) => o.value === type)) type = 'todo';
	});

	function voided(id: string, reason: string) {
		const mark = (m: MovementDetail) => (m.id === id ? { ...m, voided: { by: me.name, at: 'Ahora', reason } } : m);
		all = all.map(mark);
		mine = mine.map(mark);
	}
</script>

<svelte:head><title>Historial · beCafé</title></svelte:head>

<BackLink href="/saldos" label="Saldos" />
<PageHeader eyebrow="Hucha común" title="Historial" />

<div class="flex flex-col gap-3">
	<SegmentedControl
		bind:value={scope}
		label="De quién"
		options={[
			{ value: 'todo', label: 'Todo' },
			{ value: 'mios', label: 'Míos' }
		]}
	/>
	<SelectField label="Tipo de movimiento" bind:value={type} options={typeOptions} />
	<Switch bind:checked={showVoided} label="Mostrar anulados" />
</div>

<div class="mt-3">
	<MovementList {items} {viewer} {graceMinutes} onvoided={voided} />
	<Pagination bind:page={current} {pages} label="Páginas del historial" />
</div>
<p class="mt-3 px-1 text-[13px] leading-[18px] text-ink-muted">
	Toca un movimiento para ver su detalle{scope === 'mios' ? ' y de dónde viene' : ''}. Los rellenos de agua no mueven dinero.
</p>
