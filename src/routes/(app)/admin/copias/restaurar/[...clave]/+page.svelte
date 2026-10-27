<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Banner, Button, PageHeader, Section } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const errores = $derived(form && 'errores' in form ? form.errores : {});
</script>

<svelte:head>
	<title>{textos.copias.restaurar} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.copias.restaurarCopiaDel(data.copia.fecha)} />

	<Section title={textos.copias.efectoTitulo}>
		<div class="flex max-w-xl flex-col gap-3 text-[15px]">
			<p>{textos.copias.efecto(data.copia.fecha)}</p>
			<p>{textos.copias.efectoResguardo}</p>
			<p>{textos.copias.efectoCorte}</p>
		</div>
	</Section>

	<form method="post" action="?/restaurar" use:enhance class="flex max-w-xl flex-col gap-4">
		<input type="hidden" name="clave" value={data.copia.clave} />
		<label class="flex flex-col gap-1 text-[15px]">
			{textos.copias.contrasena}
			<input
				type="password"
				name="contrasena"
				required
				autocomplete="current-password"
				class="rounded-md border border-hairline bg-wall-base px-3 py-2"
			/>
			{#if errores.contrasena}<span role="alert" class="text-[14px] text-warning">{errores.contrasena.mensaje}</span>{/if}
		</label>
		{#if errores.general}<Banner tone="warning">{errores.general.mensaje}</Banner>{/if}
		<div class="flex flex-wrap items-center gap-4">
			<Button type="submit">{textos.copias.confirmarRestaurar}</Button>
			<a class="text-accent underline" href={resolve('/(app)/admin/copias')}>{textos.copias.cancelar}</a>
		</div>
	</form>
</div>
