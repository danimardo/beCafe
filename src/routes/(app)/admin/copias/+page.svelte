<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Banner, Button, EmptyState, PageHeader, Section } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const errores = $derived(form && 'errores' in form && form.errores ? form.errores : {});
	const anotada = $derived(Boolean(form && 'anotada' in form));
</script>

<svelte:head>
	<title>{textos.copias.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.copias.titulo} />

	{#if !data.s3Activa}
		<Banner tone="warning">{textos.copias.sinS3}</Banner>
	{/if}
	{#if data.restauracion.aviso}
		<Banner tone="warning" title={data.restauracion.aviso === 'nunca' ? textos.copias.avisoNunca : textos.copias.avisoAntigua} />
	{/if}
	{#if anotada}
		<p role="status" class="text-[15px] text-ink">{textos.copias.anotada}</p>
	{/if}

	<Section title={textos.copias.titulo}>
		{#if data.copias.length === 0}
			<EmptyState title={textos.copias.sinCopias} />
		{:else}
			<ul class="flex flex-col gap-3 text-[15px]">
				{#each data.copias as copia (copia.id)}
					<li class="flex flex-col gap-1">
						<span class="font-semibold">{copia.iniciadaEn.slice(0, 16).replace('T', ' ')}</span>
						<span>
							{#if copia.estado === 'correcta'}✔{:else if copia.estado === 'fallida'}⚠{:else}…{/if}
							{textos.copias.estado[copia.estado]}{copia.tamano === null
								? ''
								: ` · ${textos.copias.tamano(copia.tamano)}`}{copia.codigoError ? ` · ${textos.copias.codigo[copia.codigoError]}` : ''}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<Section title={textos.copias.anotar}>
		<form method="post" action="?/anotarPrueba" use:enhance class="flex max-w-xl flex-col gap-4">
			<label class="flex flex-col gap-1 text-[15px]">
				{textos.copias.fechaPrueba}
				<input type="date" name="realizadaEl" required max={data.hoy} class="rounded-md border border-line bg-surface px-3 py-2" />
				{#if errores.realizadaEl}<span role="alert" class="text-[14px] text-warning">{errores.realizadaEl.mensaje}</span>{/if}
			</label>
			<fieldset class="flex flex-col gap-2 text-[15px]">
				<legend>{textos.copias.resultado}</legend>
				<label class="flex items-center gap-2"
					><input type="radio" name="resultado" value="correcta" checked /> {textos.copias.resultadoCorrecta}</label
				>
				<label class="flex items-center gap-2"
					><input type="radio" name="resultado" value="fallida" /> {textos.copias.resultadoFallida}</label
				>
			</fieldset>
			<label class="flex flex-col gap-1 text-[15px]">
				{textos.copias.notas}
				<textarea name="notas" maxlength="500" class="rounded-md border border-line bg-surface px-3 py-2"></textarea>
			</label>
			{#if errores.general}<p role="alert" class="text-[14px] text-warning">{errores.general.mensaje}</p>{/if}
			<div><Button type="submit" variant="soft">{textos.copias.anotar}</Button></div>
		</form>
	</Section>

	<Section title={textos.copias.pruebasTitulo}>
		{#if data.pruebas.length === 0}
			<p class="text-[15px] text-ink-muted">{textos.copias.sinPruebas}</p>
		{:else}
			<ul class="flex flex-col gap-2 text-[15px]">
				{#each data.pruebas as prueba (prueba.id)}
					<li>
						{prueba.realizadaEl} · {prueba.resultado === 'correcta' ? textos.copias.resultadoCorrecta : textos.copias.resultadoFallida}
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<a class="text-accent underline" href={resolve('/(app)/admin')}>{textos.admin.titulo}</a>
</div>
