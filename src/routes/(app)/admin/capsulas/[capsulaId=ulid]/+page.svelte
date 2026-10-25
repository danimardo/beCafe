<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Banner, BackLink, Button, Badge, PageHeader, Section } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import FormularioCapsula from '../FormularioCapsula.svelte';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Valores iniciales del tipo, tipados como texto opcional: un campo que no exista no rompe el formulario.
	function valorInicial(campo: string): string {
		const iniciales: Record<string, string | undefined> = data.iniciales;
		return iniciales[campo] ?? '';
	}

	// Valores que devuelve el servidor tras un rechazo; si no hay, los datos actuales del tipo.
	function valorDe(campo: string): string {
		if (!form || !('valores' in form)) return valorInicial(campo);
		const valor: unknown = form.valores?.[campo];
		return typeof valor === 'string' ? valor : valorInicial(campo);
	}

	function errorDe(campo: string): string | undefined {
		if (!form || !('errores' in form)) return undefined;
		return form.errores?.[campo]?.mensaje;
	}

	function confirmacion(actual: ActionData): string | undefined {
		return actual && 'confirmacion' in actual ? actual.confirmacion : undefined;
	}
</script>

<svelte:head>
	<title>{data.tipo.nombre} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/admin/capsulas')} label={textos.capsulas.volver} />
	<PageHeader title={data.tipo.nombre}>
		{#snippet actions()}
			<Badge tone={data.tipo.estado === 'activo' ? 'positive' : 'neutral'}>
				{data.tipo.estado === 'activo' ? textos.capsulas.estadoActivo : textos.capsulas.estadoRetirado}
			</Badge>
		{/snippet}
	</PageHeader>

	{#if confirmacion(form)}
		<Banner tone="info">{confirmacion(form)}</Banner>
	{/if}
	{#if errorDe('general')}
		<Banner tone="negative">{errorDe('general')}</Banner>
	{/if}

	<FormularioCapsula accion="?/guardar" etiquetaBoton={textos.capsulas.guardar} {valorDe} {errorDe} fotoActual={data.tipo.fotoUrl} />

	<div class="grid gap-6 lg:grid-cols-2 lg:items-start">
		<Section class="mt-0" title={data.tipo.estado === 'activo' ? textos.capsulas.retirar : textos.capsulas.reactivar}>
			<form method="post" action={data.tipo.estado === 'activo' ? '?/retirar' : '?/reactivar'} use:enhance>
				<Button type="submit" variant="soft" block>
					{data.tipo.estado === 'activo' ? textos.capsulas.retirar : textos.capsulas.reactivar}
				</Button>
			</form>
		</Section>

		<Section class="mt-0" title={textos.capsulas.borrar}>
			<p class="mb-3 text-[14px] text-ink-muted">{textos.capsulas.borrarAyuda}</p>
			<form method="post" action="?/borrar" use:enhance class="flex flex-col gap-3">
				<label class="flex min-h-11 items-center gap-3 text-[15px]">
					<input type="checkbox" name="confirmo" value="on" class="size-5" required />
					<span>{textos.capsulas.confirmarBorrar}</span>
				</label>
				<Button type="submit" variant="soft" block>{textos.capsulas.borrar}</Button>
			</form>
		</Section>
	</div>
</div>
