<script lang="ts">
	import { resolve } from '$app/paths';
	import { Banner, BackLink, PageHeader } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import FormularioCapsula from '../FormularioCapsula.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	// Valores que devuelve el servidor tras un rechazo, para volver a rellenar el formulario (constitución XVII).
	function valorDe(campo: string): string {
		if (!form || !('valores' in form)) return '';
		const valor: unknown = form.valores?.[campo];
		return typeof valor === 'string' ? valor : '';
	}

	function errorDe(campo: string): string | undefined {
		if (!form || !('errores' in form)) return undefined;
		return form.errores?.[campo]?.mensaje;
	}
</script>

<svelte:head>
	<title>{textos.capsulas.nuevo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/admin/capsulas')} label={textos.capsulas.volver} />
	<PageHeader title={textos.capsulas.nuevo} />

	{#if form && 'id' in form && typeof form.id === 'string' && 'confirmacion' in form}
		<Banner tone="info">
			{form.confirmacion}
			<a class="font-semibold underline" href={resolve('/(app)/admin/capsulas/[capsulaId=ulid]', { capsulaId: form.id })}>
				{textos.capsulas.editar}
			</a>
		</Banner>
	{/if}
	{#if errorDe('general')}
		<Banner tone="negative">{errorDe('general')}</Banner>
	{/if}

	<FormularioCapsula accion="?/crear" etiquetaBoton={textos.capsulas.crear} {valorDe} {errorDe} />
</div>
