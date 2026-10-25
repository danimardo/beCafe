<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, CapsuleColorField, crearExito, PhotoField, SelectField, TextField } from '#lib/ui';
	import { COLORES_CAPSULA, TAMANO_MAXIMO_FOTO } from '#lib/shared/contratos/capsulas';
	import { textos } from '#lib/shared/textos';

	type Props = {
		accion: string;
		etiquetaBoton: string;
		valorDe: (campo: string) => string;
		errorDe: (campo: string) => string | undefined;
		fotoActual?: string | null;
	};
	let { accion, etiquetaBoton, valorDe, errorDe, fotoActual = null }: Props = $props();

	const exito = crearExito();
	let foto = $state<File | null>(null);

	const opcionesColor = COLORES_CAPSULA.map((valor) => ({ value: valor, label: textos.capsulas.colores[valor] }));
	const opcionesIntensidad = [
		{ value: '', label: textos.capsulas.intensidadNinguna },
		...Array.from({ length: 13 }, (_, indice) => ({ value: String(indice + 1), label: String(indice + 1) })),
	];
</script>

<form
	method="post"
	action={accion}
	enctype="multipart/form-data"
	use:enhance={() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') exito.marcar();
		}}
	class="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-x-8"
>
	<TextField name="nombre" label={textos.capsulas.nombre} value={valorDe('nombre')} error={errorDe('nombre')} required maxlength={60} />
	<TextField name="marca" label={textos.capsulas.marca} value={valorDe('marca')} error={errorDe('marca')} required maxlength={60} />
	<SelectField
		name="intensidad"
		label={textos.capsulas.intensidad}
		value={valorDe('intensidad')}
		options={opcionesIntensidad}
		error={errorDe('intensidad')}
	/>
	<CapsuleColorField name="color" label={textos.capsulas.color} value={valorDe('color')} options={opcionesColor} error={errorDe('color')} />
	<TextField
		name="umbralMinimo"
		label={textos.capsulas.umbral}
		hint={textos.capsulas.umbralAyuda}
		value={valorDe('umbralMinimo')}
		error={errorDe('umbralMinimo')}
		type="number"
		inputmode="numeric"
		min="0"
		step="1"
		required
	/>
	<div class="flex flex-col gap-3">
		{#if fotoActual}
			<img src={fotoActual} alt={textos.capsulas.fotoActual} class="size-16 rounded-chip object-cover" />
		{:else}
			<p class="text-[14px] text-ink-muted">{textos.capsulas.sinFoto}</p>
		{/if}
		<PhotoField name="foto" label={textos.capsulas.foto} hint={textos.capsulas.fotoAyuda} bind:file={foto} maxBytes={TAMANO_MAXIMO_FOTO} />
	</div>
	<Button type="submit" block success={exito.activo} class="lg:col-span-2">{etiquetaBoton}</Button>
</form>
