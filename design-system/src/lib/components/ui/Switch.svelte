<script lang="ts">
	import { Switch } from 'bits-ui';
	import { cn } from '#lib/utils';

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
	<label for={id} class="min-w-0 flex-1">
		<span class="block text-[15px] font-medium leading-5 text-ink">{label}</span>
		{#if description}<span class="block text-[13px] leading-[18px] text-ink-muted">{description}</span>{/if}
	</label>
	<Switch.Root
		{id}
		bind:checked
		{disabled}
		onCheckedChange={(v) => onchange?.(v)}
		class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink-muted bg-transparent p-0.5 motion-safe:transition data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-60"
	>
		<Switch.Thumb
			class="pointer-events-none block size-5 rounded-full bg-ink-muted motion-safe:transition data-[state=checked]:translate-x-6 data-[state=checked]:bg-white"
		/>
	</Switch.Root>
</div>
