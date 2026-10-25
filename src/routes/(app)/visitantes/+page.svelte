<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button, CopyField, EmptyState, ListRow, PageHeader, Section, opcionesFormulario, usarAvisos } from '#lib/ui';
	import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';

	// Enlaces de visitante (plan F10 D4; RF-189). El enlace y su QR solo se ven justo después de crearlo.
	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	const t = textos.visitantes;
	const creado = $derived(form && 'enlace' in form ? form.enlace : null);
	const errorGeneral = $derived(form && 'errores' in form ? Object.values(form.errores ?? {})[0]?.mensaje : undefined);
</script>

<svelte:head>
	<title>{t.tituloMiembro} · beCafé</title>
</svelte:head>

<PageHeader title={t.tituloMiembro} />

<div class="flex max-w-2xl flex-col gap-6">
	<p class="text-ink-muted">{t.ayudaMiembro}</p>

	{#if errorGeneral}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errorGeneral}</p>
	{/if}

	<form method="post" action="?/crear" use:enhance={opcionesFormulario(avisos, t.creado)}>
		<Button type="submit" size="lg">{t.crear}</Button>
	</form>

	{#if creado}
		<Section title={t.enlace}>
			<div class="flex flex-col items-start gap-4 sm:flex-row">
				<img src={creado.qr} alt={t.qr} width="192" height="192" class="size-48 shrink-0 rounded-chip bg-white p-2" />
				<CopyField
					class="w-full"
					label={t.enlace}
					value={creado.url}
					hint={`${t.caduca(formatearFechaHoraMadrid(creado.expiraEn))}. ${t.ayudaEnlace}`}
				/>
			</div>
		</Section>
	{/if}

	<Section title={t.vigentes}>
		{#if data.enlaces.length === 0}
			<EmptyState title={t.sinVigentes} />
		{:else}
			<ul class="flex flex-col divide-y divide-hairline">
				{#each data.enlaces as enlace (enlace.id)}
					<ListRow title={t.caduca(formatearFechaHoraMadrid(enlace.expiraEn))}>
						{#snippet trailing()}
							<form method="post" action="?/revocar" use:enhance={opcionesFormulario(avisos, t.revocado)}>
								<input type="hidden" name="enlaceId" value={enlace.id} />
								<Button type="submit" variant="soft">{t.revocar}</Button>
							</form>
						{/snippet}
					</ListRow>
				{/each}
			</ul>
		{/if}
	</Section>
</div>
