<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Badge, Button, EmptyState, PageHeader, Section, TextField, opcionesFormulario, usarAvisos } from '#lib/ui';
	import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';

	// Revisión de cafés de visitante (plan F10 D4; RF-193, RF-210). Todo son formularios: funciona sin JavaScript.
	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	const t = textos.visitantes;
	const tono = { pendiente: 'warning', aprobado: 'positive', rechazado: 'negative', anulado: 'neutral' } as const;
	const revision = $derived(form && 'revision' in form ? form.revision : null);
	const errorGeneral = $derived(form && 'errores' in form ? Object.values(form.errores ?? {})[0]?.mensaje : undefined);
	const pestanas = [
		{ vista: 'pendientes', etiqueta: t.pendientes },
		{ vista: 'revisados', etiqueta: t.revisados },
	] as const;
</script>

<svelte:head>
	<title>{t.tituloAdmin} · beCafé</title>
</svelte:head>

<PageHeader title={t.tituloAdmin} />

<div class="flex max-w-3xl flex-col gap-5">
	<p class="text-ink-muted">{t.ayudaAdmin}</p>

	<form method="get" class="flex gap-2" aria-label={t.tituloAdmin}>
		{#each pestanas as pestana (pestana.vista)}
			<Button
				type="submit"
				name="vista"
				value={pestana.vista}
				variant={data.vista === pestana.vista ? 'primary' : 'soft'}
				aria-pressed={data.vista === pestana.vista}
			>
				{pestana.etiqueta}
			</Button>
		{/each}
	</form>

	{#if revision}
		<p role="status" class="rounded-chip bg-positive-soft px-3 py-2 text-[15px] text-ink">
			{t.revisados_ok(revision.aprobados, revision.rechazados, revision.yaRevisados)}
		</p>
	{/if}
	{#if errorGeneral}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errorGeneral}</p>
	{/if}

	{#if data.cafes.length === 0}
		<EmptyState title={data.vista === 'pendientes' ? t.sinPendientes : t.sinRevisados} momento="vacio-avisos" />
	{:else if data.vista === 'pendientes'}
		<form method="post" action="?/revisar" use:enhance={opcionesFormulario(avisos)} class="flex flex-col gap-4">
			<Section>
				<ul class="flex flex-col divide-y divide-hairline">
					{#each data.cafes as cafe (cafe.id)}
						<li>
							<label class="flex min-h-14 items-center gap-3 py-2">
								<input type="checkbox" name="ids" value={cafe.id} checked class="size-5 shrink-0 accent-accent" />
								<span class="min-w-0 flex-1">
									<span class="block text-[15px] font-semibold text-ink">{cafe.nombre ?? t.visitante}</span>
									<span class="block text-[13px] text-ink-muted">{cafe.tipo} · {formatearFechaHoraMadrid(cafe.horaGesto)}</span>
								</span>
							</label>
						</li>
					{/each}
				</ul>
			</Section>
			<div class="flex flex-wrap gap-3">
				<Button type="submit" name="decision" value="aprobar" size="lg">{t.aprobar}</Button>
				<Button type="submit" name="decision" value="rechazar" variant="soft" size="lg">{t.rechazar}</Button>
			</div>
		</form>
	{:else}
		<Section>
			<ul class="flex flex-col divide-y divide-hairline">
				{#each data.cafes as cafe (cafe.id)}
					<li class="flex flex-col gap-2 py-3">
						<div class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block text-[15px] font-semibold text-ink">{cafe.nombre ?? t.visitante}</span>
								<span class="block text-[13px] text-ink-muted">{cafe.tipo} · {formatearFechaHoraMadrid(cafe.horaGesto)}</span>
								{#if cafe.motivoAnulacion}<span class="block text-[13px] text-ink-muted">{cafe.motivoAnulacion}</span>{/if}
							</span>
							<Badge tone={tono[cafe.estado]}>{t.estado[cafe.estado]}</Badge>
						</div>
						{#if cafe.estado === 'aprobado'}
							<details class="rounded-chip border border-hairline px-3 py-2">
								<summary class="min-h-11 cursor-pointer py-2 text-[15px] font-medium text-ink">{t.anular}</summary>
								<form method="post" action="?/anular" use:enhance={opcionesFormulario(avisos, t.anulado)} class="flex flex-col gap-3 pb-2">
									<input type="hidden" name="id" value={cafe.id} />
									<p class="text-[13px] text-ink-muted">{t.anulado}</p>
									<TextField label={textos.consumos.motivo} name="motivo" rows={2} required maxlength={200} />
									<Button type="submit" variant="danger">{t.anular}</Button>
								</form>
							</details>
						{/if}
						{#if cafe.nombre}
							<details class="rounded-chip border border-hairline px-3 py-2">
								<summary class="min-h-11 cursor-pointer py-2 text-[15px] font-medium text-ink">{t.eliminarNombre}</summary>
								<form
									method="post"
									action="?/eliminarNombre"
									use:enhance={opcionesFormulario(avisos, t.nombreEliminado)}
									class="flex flex-col gap-3 pb-2"
								>
									<input type="hidden" name="visitaId" value={cafe.visitaId} />
									<p class="text-[15px] font-semibold text-ink">{t.eliminarNombreTitulo}</p>
									<p class="text-[13px] text-ink-muted">{t.eliminarNombreTexto}</p>
									<label class="flex min-h-11 items-center gap-3 text-[15px] text-ink">
										<input type="checkbox" name="confirmar" value="si" required class="size-5 accent-accent" />
										{t.eliminarNombreTitulo}
									</label>
									<Button type="submit" variant="danger">{t.eliminarNombre}</Button>
								</form>
							</details>
						{/if}
					</li>
				{/each}
			</ul>
		</Section>
	{/if}
</div>
