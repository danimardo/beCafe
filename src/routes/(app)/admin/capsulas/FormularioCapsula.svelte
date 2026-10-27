<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { Button, CapsuleColorField, crearExito, PhotoField, SelectField, TextField } from '#lib/ui';
	import {
		COLOR_CAPSULA_HEREDADO,
		COLORES_CAPSULA_ELEGIBLES,
		OPCION_COLOR_PROPIO,
		TAMANO_MAXIMO_FOTO,
	} from '#lib/shared/contratos/capsulas';
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

	// RF-269: el rosa solo se ofrece a un tipo que ya lo tenía; el servidor lo vuelve a comprobar.
	const rosaHeredado = untrack(() => valorDe('color')) === COLOR_CAPSULA_HEREDADO;
	const opcionesColor = [
		...COLORES_CAPSULA_ELEGIBLES.map((valor) => ({ value: valor, label: textos.capsulas.colores[valor] })),
		...(rosaHeredado ? [{ value: COLOR_CAPSULA_HEREDADO, label: textos.capsulas.colorRosaActual }] : []),
	];
	// Valores iniciales: salen del servidor y después los cambia la persona, no los vuelve a pisar el `load`.
	let color = $state(untrack(() => valorDe('color')));
	let colorPropio = $state(untrack(() => valorDe('colorPropio')) || '#8b5e3c');
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
	<CapsuleColorField
		name="color"
		label={textos.capsulas.color}
		hint={textos.capsulas.colorAyuda}
		bind:value={color}
		bind:colorPropio
		options={opcionesColor}
		otro={{
			value: OPCION_COLOR_PROPIO,
			label: textos.capsulas.colorOtro,
			selectorLabel: textos.capsulas.colorOtroSelector,
			name: 'colorPropio',
		}}
		error={errorDe('color')}
	/>
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
