<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button, Glass, Money, Section, StockBadge } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
	<h1 class="font-serif text-3xl font-semibold text-ink">{textos.inicio.saludo(data.nombre)}</h1>
	{#if data.privacidadAceptada}
		<p role="status" class="text-[15px] text-ink">{textos.confirmaciones.privacidadAceptada}</p>
	{/if}
	<Section title={textos.economia.hucha}>
		<p class="text-2xl font-semibold">
			<Money cents={data.hucha} tone srSuffix={data.hucha < 0 ? textos.economia.huchaNegativa : undefined} />
		</p>
		<p class="text-[15px] text-ink-muted">
			{textos.economia.tuSaldo}: <Money cents={data.saldoPropio} signed tone />
		</p>
	</Section>
	{#if data.deudores.length > 0}
		<Section title={textos.economia.deudores}>
			<ul class="flex flex-col gap-1 text-[15px]">
				{#each data.deudores as deudor (deudor.nombre)}
					<li class="flex justify-between gap-3">
						<span>{deudor.nombre}</span>
						<Money cents={deudor.saldo} tone />
					</li>
				{/each}
			</ul>
		</Section>
	{/if}
	<Section title={textos.capsulas.avisos.titulo}>
		{#if data.avisos.length === 0}
			<p class="text-[15px] text-ink-muted">{textos.capsulas.avisos.ninguno}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each data.avisos as aviso (aviso.id)}
					<li class="flex min-h-11 flex-wrap items-center justify-between gap-2">
						<span class="text-[15px] font-semibold text-ink">{aviso.nombre}</span>
						<span class="flex items-center gap-2">
							<StockBadge level={aviso.sinStock ? 'out' : 'low'} />
							<span class="text-[14px] text-ink-muted">
								{aviso.dias === null ? textos.capsulas.sinDatos : textos.capsulas.dias(aviso.dias)}
							</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>
	<Glass class="flex flex-col gap-4">
		<a class="text-accent underline" href={resolve('/(app)/perfil')}>{textos.perfil.titulo}</a>
		<form method="post" action="/logout" use:enhance>
			<Button type="submit" variant="soft" block>{textos.inicio.cerrarSesion}</Button>
		</form>
	</Glass>
</main>
