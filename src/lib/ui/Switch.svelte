<script lang="ts">
	import { Switch } from 'bits-ui';
	import { cn } from './utils';

	type Props = {
		checked?: boolean;
		label: string;
		description?: string;
		/** Bloqueado y activado, p. ej. el aviso de deuda, que no se puede desactivar (RF-102). */
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
		class?: string;
	};
	let { checked = $bindable(false), label, description, disabled = false, onchange, class: className }: Props = $props();
	const uid = $props.id();
	const id = `sw-${uid}`;
</script>

<div class={cn('flex min-h-11 items-center justify-between gap-4 py-1', className)}>
	<!-- El nombre accesible es la etiqueta; la ayuda va en aria-describedby, no dentro del nombre. -->
	<div class="min-w-0 flex-1">
		<label for={id} class="block text-[15px] font-medium leading-5 text-ink">{label}</label>
		{#if description}<p id="{id}-ayuda" class="text-[13px] leading-[18px] text-ink-muted">{description}</p>{/if}
	</div>
	<Switch.Root
		{id}
		aria-describedby={description ? `${id}-ayuda` : undefined}
		bind:checked
		{disabled}
		onCheckedChange={(v) => onchange?.(v)}
		class="interruptor relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink-muted bg-transparent p-0.5 motion-safe:transition data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-60"
	>
		<Switch.Thumb
			class="interruptor-pulgar pointer-events-none block size-5 rounded-full bg-ink-muted motion-safe:transition data-[state=checked]:translate-x-6 data-[state=checked]:bg-white"
		/>
	</Switch.Root>
</div>
