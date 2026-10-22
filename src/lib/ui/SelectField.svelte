<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from './utils';

	type Props = {
		label: string;
		value?: string;
		options: { value: string; label: string }[];
		hint?: string;
		error?: string;
		/** Nombre del campo al enviar el formulario sin JavaScript. */
		name?: string;
		class?: string;
	};
	let { label, value = $bindable(''), options, hint, error, name, class: className }: Props = $props();
	const uid = $props.id();
	const id = `s-${uid}`;
</script>

<!-- Se usa el <select> nativo a propósito: en móvil abre el selector del sistema, que es accesible y cómodo. -->
<div class={cn('flex flex-col gap-1.5', className)}>
	<label for={id} class="text-[13px] font-semibold leading-[18px] text-ink">{label}</label>
	<div class="relative">
		<select
			{id}
			{name}
			bind:value
			aria-invalid={error ? true : undefined}
			class={cn(
				'min-h-12 w-full appearance-none rounded-chip border bg-glass pl-3 pr-10 text-[15px] text-ink shadow-[inset_0_1px_0_var(--glass-highlight)]',
				error ? 'border-negative' : 'border-ink-muted/75',
			)}
		>
			{#each options as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
		</select>
		<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
	</div>
	{#if hint}<p class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</div>
