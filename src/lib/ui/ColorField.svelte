<script module lang="ts">
	import { RadioGroup } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from './utils';

	export const capsulePresets = [
		{ value: '#3b2a6b', name: 'Morado' },
		{ value: '#c0392b', name: 'Rojo' },
		{ value: '#c9a227', name: 'Dorado' },
		{ value: '#2e8b57', name: 'Verde' },
		{ value: '#e8d3a9', name: 'Crema' },
		{ value: '#1c1c1e', name: 'Negro' },
		{ value: '#2f6fb0', name: 'Azul' },
		{ value: '#c2547a', name: 'Rosa' },
	];
</script>

<script lang="ts">
	type Props = {
		label: string;
		/** Color elegido en hexadecimal (bindable). */
		value?: string;
		presets?: { value: string; name: string }[];
		class?: string;
	};
	let { label, value = $bindable('#3b2a6b'), presets = capsulePresets, class: className }: Props = $props();
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<span id="color-label" class="text-[13px] font-semibold leading-[18px] text-ink">{label}</span>
	<RadioGroup.Root bind:value aria-labelledby="color-label" orientation="horizontal" class="flex flex-wrap gap-2">
		{#each presets as p (p.value)}
			<RadioGroup.Item
				value={p.value}
				aria-label={p.name}
				class="relative flex size-11 items-center justify-center rounded-full border-2 border-transparent data-[state=checked]:border-ink"
			>
				<span class="size-8 rounded-full ring-1 ring-black/10" style="background:{p.value}"></span>
				{#if value === p.value}
					<Check class="absolute size-4 {p.value === '#e8d3a9' ? 'text-black' : 'text-white'}" aria-hidden="true" />
				{/if}
			</RadioGroup.Item>
		{/each}
	</RadioGroup.Root>
</div>
