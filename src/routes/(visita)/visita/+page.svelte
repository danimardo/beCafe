<script lang="ts">
	import { enhance } from '$app/forms';
	import { ulid } from 'ulid';
	import type { PageProps } from './$types';
	import { Badge, CapsuleTile, EmptyState, Section, usarAvisos } from '#lib/ui';
	import { formatearHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';

	// Café de visitante de un toque (RF-191). Sin JavaScript, el formulario envía a `?/registrar` y la página se recarga.
	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	const t = textos.visitantes;
	const tono = { pendiente: 'warning', aprobado: 'positive', rechazado: 'negative', anulado: 'neutral' } as const;
	const errorGeneral = $derived(form && 'errores' in form ? Object.values(form.errores ?? {})[0]?.mensaje : undefined);

	function enviarToque(formulario: HTMLFormElement) {
		return enhance(formulario, ({ formData }) => {
			// Cada toque tiene su identificador: un reenvío del mismo no duplica el café (RF-016).
			formData.set('clienteId', ulid());
			formData.set('horaGesto', new Date().toISOString());
			return async ({ result, update }) => {
				if (result.type === 'error') {
					avisos.informar({ title: t.sinConexion, kind: 'warning' });
					return;
				}
				await update({ reset: false });
				if (result.type === 'success') avisos.informar({ title: t.registrado });
			};
		});
	}
</script>

<svelte:head>
	<title>{t.tituloEntrada} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
	<header class="flex flex-col gap-1">
		<h1 class="font-serif text-3xl font-semibold text-ink">{data.nombre ? t.tituloVisita(data.nombre) : t.tituloVisitaSinNombre}</h1>
		<p class="text-ink-muted">{t.ayudaVisita}</p>
		<p class="text-[13px] text-ink-muted">{t.caducaA(formatearHoraMadrid(data.expiraEn))}</p>
	</header>

	{#if errorGeneral}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errorGeneral}</p>
	{/if}

	{#if data.tipos.length === 0}
		<EmptyState title={t.sinTipos} momento="vacio-capsulas" />
	{:else}
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each data.tipos as tipo (tipo.id)}
				<CapsuleTile
					modo="visitante"
					tipoId={tipo.id}
					clienteId={tipo.clienteId}
					name={tipo.nombre}
					brand={tipo.marca}
					intensity={tipo.intensidad}
					color={tipo.color}
					stock={1}
					threshold={0}
					priceCents={0}
					enhancer={enviarToque}
				/>
			{/each}
		</ul>
	{/if}

	<Section title={t.cafes}>
		{#if data.cafes.length === 0}
			<p class="text-ink-muted">{t.sinCafes}</p>
		{:else}
			<ul class="flex flex-col divide-y divide-hairline">
				{#each data.cafes as cafe (cafe.id)}
					<li class="flex min-h-11 items-center justify-between gap-3 py-2">
						<span class="text-[15px] text-ink">{cafe.tipo} · {formatearHoraMadrid(cafe.horaGesto)}</span>
						<Badge tone={tono[cafe.estado]}>{t.estado[cafe.estado]}</Badge>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>
</main>
