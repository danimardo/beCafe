<script lang="ts" generics="T extends string">
	import { RadioGroup } from 'bits-ui';
	import { cn } from './utils';

	type Props = {
		/** Valor seleccionado (bindable). */
		value?: T;
		options: { value: T; label: string }[];
		/** Nombre accesible del grupo, p. ej. «Periodo». */
		label: string;
		onchange?: (value: T) => void;
		class?: string;
	};
	let { value = $bindable(), options, label, onchange, class: className }: Props = $props();
</script>

<RadioGroup.Root
	bind:value
	orientation="horizontal"
	aria-label={label}
	onValueChange={(v) => {
		const elegida = options.find((o) => o.value === v);
		if (elegida) onchange?.(elegida.value);
	}}
	class={cn('glass flex w-full gap-0.5 rounded-full p-[3px]', className)}
>
	{#each options as o (o.value)}
		<RadioGroup.Item
			value={o.value}
			class="min-h-10 flex-1 rounded-full px-3 text-sm font-semibold text-ink-muted motion-safe:transition data-[state=checked]:bg-accent-soft data-[state=checked]:text-ink data-[state=checked]:shadow-[inset_0_1px_0_var(--glass-highlight)]"
		>
			{o.label}
		</RadioGroup.Item>
	{/each}
</RadioGroup.Root>
