<script lang="ts">
	import { BarChart, Banner, EmptyState, KpiTile, PageHeader, Section, SelectField, SplitBar } from '#lib/ui';
	import { formatMoneyPlain } from '#lib/shared/dinero';
	import { textos } from '#lib/shared/textos';

	// Gráficas con su tabla debajo: el color no es la única señal y cada valor se lee como texto (RNF-001, plan F5 D5).
	type Props = {
		titulo: string;
		resumen: {
			cafes: number;
			invitados: number;
			gastado: number;
			porMes: { mes: string; cafes: number; invitados: number }[];
			porTipo: { nombre: string; cafes: number; color: string }[];
		};
		consulta: { periodo: 'mes' | 'anio' | 'todo'; vista: 'mias' | 'equipo'; mes?: string; anio?: number };
		consultaValida: boolean;
		cabecera?: import('svelte').Snippet;
	};
	let { titulo, resumen, consulta, consultaValida, cabecera }: Props = $props();

	const sinDatos = $derived(resumen.cafes === 0 && resumen.invitados === 0);
	const opcionesPeriodo = [
		{ value: 'mes', label: textos.estadisticas.mes },
		{ value: 'anio', label: textos.estadisticas.anio },
		{ value: 'todo', label: textos.estadisticas.todo },
	];
	const opcionesVista = [
		{ value: 'mias', label: textos.estadisticas.mias },
		{ value: 'equipo', label: textos.estadisticas.equipo },
	];
	const totalTipos = $derived(resumen.porTipo.reduce((suma, tipo) => suma + tipo.cafes, 0));
</script>

<PageHeader title={titulo} />

{#if cabecera}{@render cabecera()}{/if}

{#if !consultaValida}
	<Banner tone="info">{textos.estadisticas.avisoConsulta}</Banner>
{/if}

<form method="get" class="flex flex-col gap-4">
	<SelectField label={textos.estadisticas.vista} name="vista" value={consulta.vista} options={opcionesVista} />
	<SelectField label={textos.estadisticas.periodo} name="periodo" value={consulta.periodo} options={opcionesPeriodo} />
	<label class="flex flex-col gap-1 text-[15px]">
		{textos.estadisticas.mesLabel}
		<input type="month" name="mes" value={consulta.mes} class="rounded-md border border-line bg-surface px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-[15px]">
		{textos.estadisticas.anio}
		<input type="number" name="anio" min="2026" value={consulta.anio} class="rounded-md border border-line bg-surface px-3 py-2" />
	</label>
	<button type="submit" class="self-start rounded-md bg-accent px-4 py-2 text-on-accent">{textos.estadisticas.aplicar}</button>
</form>

{#if sinDatos}
	<EmptyState title={textos.estadisticas.vacio} />
{:else}
	<div class="grid grid-cols-2 gap-3">
		<KpiTile label={textos.estadisticas.cafes} value={String(resumen.cafes)} />
		<KpiTile label={textos.estadisticas.invitados} value={String(resumen.invitados)} hint={textos.estadisticas.invitadosAparte} />
		<KpiTile label={textos.estadisticas.gastado} value={`${formatMoneyPlain(resumen.gastado)} €`} />
	</div>

	<Section title={textos.estadisticas.porMes}>
		<BarChart title={textos.estadisticas.porMes} data={resumen.porMes.map((fila) => ({ label: fila.mes, value: fila.cafes }))} />
		<table class="mt-3 w-full text-left text-[14px]">
			<caption class="sr-only">{textos.estadisticas.tabla}</caption>
			<thead>
				<tr
					><th scope="col">{textos.estadisticas.mesLabel}</th><th scope="col">{textos.estadisticas.cafes}</th><th scope="col"
						>{textos.estadisticas.invitados}</th
					></tr
				>
			</thead>
			<tbody>
				{#each resumen.porMes as fila (fila.mes)}
					<tr><td>{fila.mes}</td><td>{fila.cafes}</td><td>{fila.invitados}</td></tr>
				{/each}
			</tbody>
		</table>
	</Section>

	<Section title={textos.estadisticas.porTipo}>
		{#if totalTipos === 0}
			<EmptyState title={textos.estadisticas.vacio} />
		{:else}
			<SplitBar
				title={textos.estadisticas.porTipo}
				segments={resumen.porTipo.map((tipo) => ({ label: tipo.nombre, value: tipo.cafes, color: tipo.color }))}
			/>
			<table class="mt-3 w-full text-left text-[14px]">
				<caption class="sr-only">{textos.estadisticas.tabla}</caption>
				<thead>
					<tr><th scope="col">{textos.estadisticas.tipoLabel}</th><th scope="col">{textos.estadisticas.cantidad}</th></tr>
				</thead>
				<tbody>
					{#each resumen.porTipo as tipo (tipo.nombre)}
						<tr><td>{tipo.nombre}</td><td>{tipo.cafes}</td></tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</Section>

	<Section title={textos.estadisticas.invitados}>
		<p class="text-[15px]">{textos.estadisticas.invitadosAparte}</p>
	</Section>
{/if}
