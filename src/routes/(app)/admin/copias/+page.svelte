<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Cloud from '@lucide/svelte/icons/cloud';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import { Banner, Button, CopiaFila, DosColumnas, EmptyState, PageHeader, Paginacion } from '#lib/ui';
	import { formatearFechaHoraMadrid } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';
	import SeccionCopias from './SeccionCopias.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type ErroresDeCampo = Record<string, { codigo: string; mensaje: string } | undefined>;
	const errores = $derived<ErroresDeCampo>(form && 'errores' in form && form.errores ? form.errores : {});
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

	<DosColumnas>
		{#snippet acciones()}
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

			<SeccionCopias titulo={textos.copias.accionesTitulo} tono="estado" icono={DatabaseBackup}>
				{#if data.s3Activa}
					<details bind:open={confirmando} class="rounded-tile border border-hairline bg-wall-base p-3">
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
					<p class="text-[15px] text-ink-muted">{textos.copias.operacion.SIN_S3}</p>
				{/if}
				{#if copiaHecha}
					<p role="status" class="mt-4 text-[15px] text-ink">{textos.copias.copiaHecha}</p>
				{/if}
				{#if errores.copia}
					<Banner tone="warning" class="mt-4">{errores.copia.mensaje}</Banner>
				{/if}
				{#if data.s3Activa}
					<p class="mt-4 max-w-xl text-[15px] text-ink-muted">{textos.copias.restaurarAyuda}</p>
					<p class="mt-2 max-w-xl text-[14px] text-ink-muted">{textos.copias.notaDescargar}</p>
				{/if}
			</SeccionCopias>
		{/snippet}

		{#snippet listado()}
			<SeccionCopias titulo={textos.copias.listado} tono="bucket" icono={Cloud} class="lg:border-0 lg:bg-transparent lg:p-0">
				{#if data.bucketError}
					<Banner tone="warning" class="mb-4">{textos.copias.bucketError}</Banner>
				{/if}
				{#if data.listado.filas.length === 0}
					<EmptyState title={textos.copias.sinCopiasListado} />
				{:else}
					<ul class="flex flex-col gap-4 text-[15px]">
						{#each data.listado.filas as copia (copia.id)}
							{@const fecha = formatearFechaHoraMadrid(copia.instante)}
							<CopiaFila
								{fecha}
								tamano={copia.tamano === null ? undefined : textos.copias.tamano(copia.tamano)}
								etiquetas={copia.fallida
									? [copia.tipo === 'manual' ? textos.copias.manual : textos.copias.diaria]
									: [copia.resguardo ? textos.copias.resguardo : copia.tipo === 'manual' ? textos.copias.manual : textos.copias.diaria]}
								origen={copia.fallida
									? undefined
									: copia.origen === null
										? textos.copias.origenNoRegistrado
										: textos.copias.origenEtiqueta(textos.copias.origenDe(copia.origen))}
								fallida={copia.fallida && copia.codigoError ? textos.copias.fallida(textos.copias.codigo[copia.codigoError]) : undefined}
								descargarHref={copia.clave === null
									? undefined
									: resolve('/(app)/admin/copias/descargar/[...clave]', { clave: copia.clave })}
								descargarTexto={textos.copias.descargar}
								descargarNombre={textos.copias.descargarCopiaDel(fecha)}
								restaurarHref={copia.clave === null
									? undefined
									: resolve('/(app)/admin/copias/restaurar/[...clave]', { clave: copia.clave })}
								restaurarTexto={textos.copias.restaurar}
								restaurarNombre={textos.copias.restaurarCopiaDel(fecha)}
							/>
						{/each}
					</ul>
					<div class="mt-4 flex flex-col gap-2">
						<Paginacion
							pagina={data.listado.pagina}
							paginas={data.listado.paginas}
							etiqueta={textos.copias.paginas}
							anterior={textos.copias.anterior}
							siguiente={textos.copias.siguiente}
						/>
						{#if data.listado.paginas > 1}
							<p class="text-center text-[14px] text-ink-muted">{textos.copias.pagina(data.listado.pagina, data.listado.paginas)}</p>
						{/if}
					</div>
				{/if}
			</SeccionCopias>
		{/snippet}
	</DosColumnas>

	<a class="text-accent underline" href={resolve('/(app)/admin')}>← {textos.copias.volverAdmin}</a>
</div>
