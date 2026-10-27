<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Cloud from '@lucide/svelte/icons/cloud';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import { Banner, Button, CopiaBucketFila, EmptyState, PageHeader, Section } from '#lib/ui';
	import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import SeccionCopias from './SeccionCopias.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type ErroresDeCampo = Record<string, { codigo: string; mensaje: string } | undefined>;
	const errores = $derived<ErroresDeCampo>(form && 'errores' in form && form.errores ? form.errores : {});
	const anotada = $derived(Boolean(form && 'anotada' in form));
	const copiaHecha = $derived(Boolean(form && 'copiaHecha' in form));

	// «Hacer copia ahora» (RF-286): la confirmación se abre en la propia pantalla y funciona sin JavaScript.
	let confirmando = $state(false);
	let haciendo = $state(false);
</script>

<svelte:head>
	<title>{textos.copias.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.copias.titulo} />

	{#if !data.s3Activa}
		<Banner tone="warning">{textos.copias.sinS3}</Banner>
	{/if}
	{#if data.preparada}
		<Banner tone="warning" title={textos.copias.restauracionPreparada}>{textos.copias.restauracionReiniciar}</Banner>
	{/if}
	{#if data.ultimaRestauracion}
		<Banner tone="info" title={textos.copias.ultimaRestauracion(formatearFechaHoraMadrid(data.ultimaRestauracion.instante))}>
			{textos.copias.ultimaRestauracionDetalle(data.ultimaRestauracion.copia, data.ultimaRestauracion.resguardo)}
		</Banner>
	{/if}
	{#if data.restauracion.aviso}
		<Banner tone="warning" title={data.restauracion.aviso === 'nunca' ? textos.copias.avisoNunca : textos.copias.avisoAntigua} />
	{/if}
	{#if anotada}
		<p role="status" class="text-[15px] text-ink">{textos.copias.anotada}</p>
	{/if}

	<SeccionCopias titulo={textos.copias.titulo} tono="estado" icono={DatabaseBackup}>
		{#if data.s3Activa}
			<details bind:open={confirmando} class="mb-4 rounded-tile border border-hairline bg-wall-base p-3">
				<summary class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-semibold text-ink">
					<CirclePlus class="size-5 shrink-0 text-accent" aria-hidden="true" />
					<span>{textos.copias.hacerCopiaAhora}</span>
				</summary>
				<div class="mt-3 flex max-w-xl flex-col gap-3 text-[15px]">
					<p class="text-ink-muted">{textos.copias.hacerCopiaAyuda}</p>
					<p>{textos.copias.hacerCopiaEfecto}</p>
					<form
						method="post"
						action="?/copiaManual"
						use:enhance={() => {
							haciendo = true;
							return async ({ result, update }) => {
								await update();
								// Un fallo de la copia no vuelve a ejecutar el `load`, pero deja una copia fallida en la lista.
								if (result.type === 'failure') await refreshAll();
								haciendo = false;
								if (result.type === 'success') confirmando = false;
							};
						}}
					>
						<Button type="submit" loading={haciendo}>{haciendo ? textos.copias.haciendoCopia : textos.copias.confirmarCopia}</Button>
					</form>
				</div>
			</details>
		{:else}
			<p class="mb-4 text-[15px] text-ink-muted">{textos.copias.operacion.SIN_S3}</p>
		{/if}
		{#if copiaHecha}
			<p role="status" class="mb-4 text-[15px] text-ink">{textos.copias.copiaHecha}</p>
		{/if}
		{#if errores.copia}
			<Banner tone="warning" class="mb-4">{errores.copia.mensaje}</Banner>
		{/if}
		{#if data.copias.length === 0}
			<EmptyState title={textos.copias.sinCopias} />
		{:else}
			<ul class="flex flex-col gap-3 text-[15px]">
				{#each data.copias as copia (copia.id)}
					<li class="flex flex-col gap-1">
						<span class="font-semibold">{copia.iniciadaEn.slice(0, 16).replace('T', ' ')}</span>
						<span>
							{#if copia.estado === 'correcta'}✔{:else if copia.estado === 'fallida'}⚠{:else}…{/if}
							{copia.tipo === 'manual' ? `${textos.copias.manual} · ` : ''}{textos.copias.estado[copia.estado]}{copia.tamano === null
								? ''
								: ` · ${textos.copias.tamano(copia.tamano)}`}{copia.codigoError ? ` · ${textos.copias.codigo[copia.codigoError]}` : ''}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</SeccionCopias>

	<SeccionCopias titulo={textos.copias.bucketTitulo} tono="bucket" icono={Cloud}>
		{#if !data.s3Activa}
			<p class="text-[15px] text-ink-muted">{textos.copias.sinS3Restaurar}</p>
		{:else if data.bucketError}
			<p role="alert" class="text-[15px] text-warning">{textos.copias.bucketError}</p>
		{:else if data.bucket.length === 0}
			<p class="text-[15px] text-ink-muted">{textos.copias.bucketSinCopias}</p>
		{:else}
			<p class="mb-3 text-[15px] text-ink-muted">{textos.copias.bucketAyuda}</p>
			<ul class="flex flex-col gap-4 text-[15px]">
				{#each data.bucket as copia (copia.clave)}
					{@const fecha = formatearFechaHoraMadrid(copia.modificadaEn)}
					<CopiaBucketFila
						{fecha}
						tamano={textos.copias.tamano(copia.tamano)}
						etiquetas={[...(copia.tipo === 'manual' ? [textos.copias.manual] : []), ...(copia.resguardo ? [textos.copias.resguardo] : [])]}
						origen={textos.copias.origenEtiqueta(textos.copias.origenDe(copia.origen))}
						descargarHref={resolve('/(app)/admin/copias/descargar/[...clave]', { clave: copia.clave })}
						descargarTexto={textos.copias.descargar}
						descargarNombre={textos.copias.descargarCopiaDel(fecha)}
					/>
				{/each}
			</ul>
			<p class="mt-3 text-[14px] text-ink-muted">{textos.copias.descargarAyuda}</p>
		{/if}
	</SeccionCopias>

	{#if data.s3Activa && !data.bucketError && data.bucket.length > 0}
		<SeccionCopias titulo={textos.copias.restaurarTitulo} tono="restaurar" icono={TriangleAlert}>
			<p class="mb-3 max-w-xl text-[15px] text-ink">{textos.copias.restaurarAyuda}</p>
			<ul class="flex flex-col gap-2 text-[15px]">
				{#each data.bucket as copia (copia.clave)}
					<li>
						<a
							class="inline-flex min-h-11 items-center rounded-chip border border-warning/50 px-4 text-ink underline"
							href={resolve('/(app)/admin/copias/restaurar/[...clave]', { clave: copia.clave })}
						>
							{textos.copias.restaurarCopiaDel(formatearFechaHoraMadrid(copia.modificadaEn))}
						</a>
					</li>
				{/each}
			</ul>
		</SeccionCopias>
	{/if}

	<SeccionCopias titulo={textos.copias.anotar} tono="prueba" icono={ClipboardCheck}>
		<p class="mb-3 max-w-xl text-[15px] text-ink-muted">{textos.copias.anotarAyuda}</p>
		<form method="post" action="?/anotarPrueba" use:enhance class="flex max-w-xl flex-col gap-4">
			<label class="flex flex-col gap-1 text-[15px]">
				{textos.copias.fechaPrueba}
				<input type="date" name="realizadaEl" required max={data.hoy} class="rounded-md border border-hairline bg-wall-base px-3 py-2" />
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
				<textarea name="notas" maxlength="500" class="rounded-md border border-hairline bg-wall-base px-3 py-2"></textarea>
			</label>
			{#if errores.general}<p role="alert" class="text-[14px] text-warning">{errores.general.mensaje}</p>{/if}
			<div><Button type="submit" variant="soft">{textos.copias.anotarBoton}</Button></div>
		</form>
	</SeccionCopias>

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

	<a class="text-accent underline" href={resolve('/(app)/admin')}>← {textos.copias.volverAdmin}</a>
</div>
