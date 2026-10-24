<script lang="ts">
	import { cn, colorCapsulaCss } from './utils';

	type Props = {
		label: string;
		/** Nombre del campo al enviar el formulario (funciona sin JavaScript: son radios nativos). */
		name: string;
		/** Token del color elegido (`cap-lungo`). */
		value?: string;
		options: { value: string; label: string }[];
		error?: string;
		class?: string;
	};
	let { label, name, value = $bindable(''), options, error, class: className }: Props = $props();
</script>

<!-- Un radio nativo por color, con su muestra y su nombre: el color nunca es la única señal (constitución XI). -->
<fieldset class={cn('flex flex-col gap-1.5', className)}>
	<legend class="mb-1.5 text-[13px] font-semibold leading-[18px] text-ink">{label}</legend>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each options as opcion (opcion.value)}
			<label
				class="flex min-h-11 cursor-pointer items-center gap-2 rounded-chip border border-ink-muted/75 bg-glass px-3 text-[15px] text-ink has-[:checked]:border-2 has-[:checked]:border-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
			>
				<input type="radio" {name} value={opcion.value} bind:group={value} required class="sr-only" />
				<span
					class="size-5 shrink-0 rounded-full ring-1 ring-black/15"
					style="background:{colorCapsulaCss(opcion.value)}"
					aria-hidden="true"
				></span>
				<span>{opcion.label}</span>
			</label>
		{/each}
	</div>
	{#if error}<p class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</fieldset>
