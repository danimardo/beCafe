<script lang="ts">
	import { cn, estiloColorCapsula } from './utils';

	type Props = {
		label: string;
		/** Nombre del campo al enviar el formulario (funciona sin JavaScript: son radios nativos). */
		name: string;
		/** Valor elegido: un token (`cap-lungo`) o `otro` (RF-269). */
		value?: string;
		/** Colores fijos, más el heredado si el tipo ya lo tenía. */
		options: { value: string; label: string }[];
		/** Valor de «Otro color»: el radio que lo elige y el nombre del campo del selector (RF-269, RF-271). */
		otro: { value: string; label: string; selectorLabel: string; name: string };
		/** Color propio inicial en `#rrggbb`. */
		colorPropio?: string;
		hint?: string;
		error?: string;
		class?: string;
	};
	let {
		label,
		name,
		value = $bindable(''),
		options,
		otro,
		colorPropio = $bindable('#8b5e3c'),
		hint,
		error,
		class: className,
	}: Props = $props();

	const uid = $props.id();
	const idAyuda = `cf-${uid}-ayuda`;
</script>

<!-- Un radio nativo por color, con su muestra y su nombre: el color nunca es la única señal (constitución XI). -->
<fieldset class={cn('flex flex-col gap-1.5', className)} aria-describedby={hint ? idAyuda : undefined}>
	<legend class="mb-1.5 text-[13px] font-semibold leading-[18px] text-ink">{label}</legend>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each options as opcion (opcion.value)}
			<label
				class="flex min-h-11 cursor-pointer items-center gap-2 rounded-chip border border-ink-muted/75 bg-glass px-3 text-[15px] text-ink has-[:checked]:border-2 has-[:checked]:border-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
			>
				<input type="radio" {name} value={opcion.value} bind:group={value} required class="sr-only" />
				<span
					class="size-5 shrink-0 rounded-full ring-1 ring-black/15"
					style="{estiloColorCapsula(opcion.value)};background:var(--cap-color)"
					aria-hidden="true"
				></span>
				<span>{opcion.label}</span>
			</label>
		{/each}
		<!-- «Otro color»: el selector nativo queda fuera de la etiqueta del radio para no entrar en su nombre accesible. Tocarlo marca el radio. -->
		<div
			class="flex min-h-11 items-center gap-2 rounded-chip border border-ink-muted/75 bg-glass px-3 text-[15px] text-ink has-[:checked]:border-2 has-[:checked]:border-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
		>
			<input
				type="color"
				name={otro.name}
				bind:value={colorPropio}
				aria-label={otro.selectorLabel}
				onfocus={() => (value = otro.value)}
				oninput={() => (value = otro.value)}
				class="size-6 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
			/>
			<label class="flex min-h-11 flex-1 cursor-pointer items-center">
				<input type="radio" {name} value={otro.value} bind:group={value} required class="sr-only" />
				<span>{otro.label}</span>
			</label>
		</div>
	</div>
	{#if hint}<p id={idAyuda} class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</fieldset>
