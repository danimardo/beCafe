<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		Avatar,
		Banner,
		Button,
		EmptyState,
		KpiTile,
		LineChart,
		PageHeader,
		PanelGrid,
		Section,
		SelectField,
		SplitBar,
		StackedBarChart,
	} from '#lib/ui';
	import { formatMoney, formatMoneyPlain } from '#lib/shared/dinero';
	import { esquemaMes } from '#lib/shared/fechas/tipos';
	import { nombreDeMes } from '#lib/shared/fechas/meses';
	import { textos } from '#lib/shared/textos';

	// Estadísticas del departamento o de una persona (RF-201, RF-202). Cada gráfico tiene su tabla en «Ver datos» y una
	// leyenda con texto: el color no es la única señal (constitución XI).
	type FilaMes = { mes: string; cafes: number; invitados: number; visitantes: number };
	type Props = {
		titulo: string;
		subtitulo?: string;
		resumen: {
			cafes: number;
			invitados: number;
			visitantes: number;
			gastado: number;
			porMes: FilaMes[];
			porTipo: { nombre: string; cafes: number; color: string }[];
			rellenos: number;
			ranking: { usuarioId: string; nombre: string; rellenos: number; baja: boolean }[];
			porPersona: { usuarioId: string; nombre: string; fotoUrl: string | null; cafes: number; invitados: number }[];
			/** Solo en el departamento: últimos 12 meses y saldo de la hucha. */
			evolucion?: FilaMes[];
			hucha?: { mes: string; saldo: number }[];
		};
		consulta: { periodo: 'mes' | 'ultimos3' | 'ultimos12' | 'anio' | 'todo' };
		consultaValida: boolean;
		cabecera?: Snippet;
	};
	let { titulo, subtitulo, resumen, consulta, consultaValida, cabecera }: Props = $props();

	const departamento = $derived(resumen.evolucion !== undefined);
	// Los rellenos cuentan aunque no haya consumos (RN-085): sin ellos tampoco hay datos que mostrar.
	const sinDatos = $derived(resumen.cafes === 0 && resumen.invitados === 0 && resumen.visitantes === 0 && resumen.rellenos === 0);
	const opcionesPeriodo = [
		{ value: 'mes', label: textos.estadisticas.mesActual },
		{ value: 'ultimos3', label: textos.estadisticas.ultimos3 },
		{ value: 'ultimos12', label: textos.estadisticas.ultimos12 },
	];

	function etiquetaMes(mes: string, corta: boolean): string {
		const valido = esquemaMes.safeParse(mes);
		if (!valido.success) return mes;
		const nombre = nombreDeMes(valido.data);
		return corta ? nombre.slice(0, 3) : `${nombre} ${mes.slice(0, 4)}`;
	}

	const serieMeses = $derived(resumen.evolucion ?? resumen.porMes);
	const series = $derived([
		{ label: textos.estadisticas.propios, className: 'bg-accent' },
		{ label: textos.estadisticas.invitados, className: 'bg-cap-azul' },
		...(departamento ? [{ label: textos.estadisticas.visitantes, className: 'bg-warning' }] : []),
	]);
	const totalTipos = $derived(resumen.porTipo.reduce((suma, tipo) => suma + tipo.cafes, 0));
	const maximoPersona = $derived(Math.max(1, ...resumen.porPersona.map((fila) => fila.cafes + fila.invitados)));
	const maximoRellenos = $derived(Math.max(1, ...resumen.ranking.map((fila) => fila.rellenos)));
</script>

<PageHeader title={titulo} />
{#if subtitulo}<p class="-mt-4 text-[15px] text-ink-muted">{subtitulo}</p>{/if}

{#if cabecera}{@render cabecera()}{/if}

{#if !consultaValida}
	<Banner tone="info">{textos.estadisticas.avisoConsulta}</Banner>
{/if}

<!-- Periodo con un formulario GET: funciona igual sin JavaScript (ARCHITECTURE.md §7). -->
<form method="get" class="flex flex-col gap-3 sm:flex-row sm:items-end">
	<SelectField class="sm:w-64" label={textos.estadisticas.periodo} name="periodo" value={consulta.periodo} options={opcionesPeriodo} />
	<Button type="submit" variant="soft">{textos.estadisticas.aplicar}</Button>
</form>

{#snippet tabla(cabeceras: string[], filas: (string | number)[][])}
	<details open class="mt-3 text-[14px]">
		<summary class="min-h-6 cursor-pointer font-semibold text-accent">{textos.estadisticas.verDatos}</summary>
		<table class="mt-2 w-full text-left tabular-nums">
			<caption class="sr-only">{textos.estadisticas.tabla}</caption>
			<thead>
				<tr
					>{#each cabeceras as cabecera (cabecera)}<th scope="col" class="py-1 pr-2">{cabecera}</th>{/each}</tr
				>
			</thead>
			<tbody>
				{#each filas as fila, i (i)}
					<tr class="border-t border-hairline"
						>{#each fila as celda, j (j)}<td class="py-1 pr-2">{celda}</td>{/each}</tr
					>
				{/each}
			</tbody>
		</table>
	</details>
{/snippet}

{#if sinDatos}
	<EmptyState momento="vacio-estadisticas" title={textos.estadisticas.vacio} />
{:else}
	<PanelGrid resumen={cifras} {principal} {secundario} />
{/if}

{#snippet principal()}
	{#if departamento}
		<Section title={textos.estadisticas.porPersona}>
			<p class="text-[13px] text-ink-muted">{textos.estadisticas.porPersonaAyuda}</p>
			<ol class="flex flex-col gap-2">
				{#each resumen.porPersona as fila (fila.usuarioId)}
					<li>
						<a
							href={resolve('/(app)/estadisticas/[usuarioId=ulid]', { usuarioId: fila.usuarioId })}
							class="flex min-h-11 items-center gap-3 rounded-chip px-1 hover:bg-accent-soft"
						>
							<Avatar name={fila.nombre} usuarioId={fila.usuarioId} fotoUrl={fila.fotoUrl} />
							<span class="flex min-w-0 flex-1 flex-col gap-1">
								<span class="flex justify-between gap-2 text-[15px]">
									<!-- WCAG 2.5.3: el nombre accesible empieza por la acción y contiene el texto visible (nombre y cafés). -->
									<span class="sr-only">{textos.estadisticas.verPersona(fila.nombre)}</span>
									<span class="truncate" aria-hidden="true">{fila.nombre}</span>
									<span class="tabular-nums font-semibold">{fila.cafes + fila.invitados}</span>
								</span>
								<span class="block h-2 w-full rounded-full bg-accent-soft" aria-hidden="true">
									<span class="block h-2 rounded-full bg-accent" style:width={`${((fila.cafes + fila.invitados) / maximoPersona) * 100}%`}
									></span>
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ol>
			{@render tabla(
				[textos.estadisticas.personaLabel, textos.estadisticas.propios, textos.estadisticas.invitados],
				resumen.porPersona.map((fila) => [fila.nombre, fila.cafes, fila.invitados]),
			)}
		</Section>
	{/if}

	<Section title={textos.estadisticas.porTipo}>
		{#if totalTipos === 0}
			<p class="text-[15px] text-ink-muted">{textos.estadisticas.vacio}</p>
		{:else}
			<SplitBar
				title={textos.estadisticas.porTipo}
				segments={resumen.porTipo.map((tipo) => ({ label: tipo.nombre, value: tipo.cafes, color: tipo.color }))}
			/>
			{@render tabla(
				[textos.estadisticas.tipoLabel, textos.estadisticas.cantidad],
				resumen.porTipo.map((tipo) => [tipo.nombre, tipo.cafes]),
			)}
		{/if}
	</Section>

	<Section title={departamento ? textos.estadisticas.evolucion : textos.estadisticas.porMes}>
		<StackedBarChart
			title={departamento ? textos.estadisticas.evolucion : textos.estadisticas.porMes}
			{series}
			data={serieMeses.map((fila) => ({
				label: etiquetaMes(fila.mes, true),
				values: departamento ? [fila.cafes, fila.invitados, fila.visitantes] : [fila.cafes, fila.invitados],
			}))}
		/>
		{@render tabla(
			[textos.estadisticas.mesLabel, ...series.map((serie) => serie.label)],
			serieMeses.map((fila) =>
				departamento
					? [etiquetaMes(fila.mes, false), fila.cafes, fila.invitados, fila.visitantes]
					: [etiquetaMes(fila.mes, false), fila.cafes, fila.invitados],
			),
		)}
	</Section>
{/snippet}

{#snippet cifras()}
	<div class="grid grid-cols-2 gap-3">
		<KpiTile label={textos.estadisticas.cafes} value={String(resumen.cafes)} numero={{ valor: resumen.cafes, formato: String }} />
		<KpiTile
			label={textos.estadisticas.invitados}
			value={String(resumen.invitados)}
			numero={{ valor: resumen.invitados, formato: String }}
			hint={textos.estadisticas.invitadosAparte}
		/>
		{#if departamento}
			<KpiTile
				label={textos.estadisticas.visitantes}
				value={String(resumen.visitantes)}
				numero={{ valor: resumen.visitantes, formato: String }}
				hint={textos.estadisticas.visitantesAyuda}
			/>
		{:else}
			<KpiTile label={textos.rellenos.kpi} value={String(resumen.rellenos)} numero={{ valor: resumen.rellenos, formato: String }} />
		{/if}
		<KpiTile
			label={textos.estadisticas.coste}
			value={`${formatMoneyPlain(resumen.gastado)} €`}
			numero={{ valor: resumen.gastado, formato: (n: number) => `${formatMoneyPlain(n)} €` }}
			hint={textos.estadisticas.costeAyuda}
		/>
	</div>
{/snippet}

{#snippet secundario()}
	{#if resumen.hucha}
		<Section title={textos.estadisticas.hucha}>
			<LineChart
				title={textos.estadisticas.hucha}
				format={formatMoney}
				data={resumen.hucha.map((fila) => ({ label: etiquetaMes(fila.mes, true), value: fila.saldo }))}
			/>
			{@render tabla(
				[textos.estadisticas.mesLabel, textos.estadisticas.saldo],
				resumen.hucha.map((fila) => [etiquetaMes(fila.mes, false), formatMoney(fila.saldo)]),
			)}
		</Section>
	{/if}

	{#if resumen.ranking.length > 0}
		<Section title={textos.rellenos.ranking}>
			<ol class="flex flex-col gap-3 text-[15px]">
				{#each resumen.ranking as fila, indice (fila.usuarioId)}
					<li class="flex flex-col gap-1">
						<span>{indice + 1}. {fila.nombre} · {fila.rellenos}{fila.baja ? ` · ${textos.rellenos.rankingBaja}` : ''}</span>
						<span class="block h-2 w-full rounded-full bg-accent-soft" aria-hidden="true">
							<span class="block h-2 rounded-full bg-accent" style:width={`${(fila.rellenos / maximoRellenos) * 100}%`}></span>
						</span>
					</li>
				{/each}
			</ol>
		</Section>
	{/if}
{/snippet}
