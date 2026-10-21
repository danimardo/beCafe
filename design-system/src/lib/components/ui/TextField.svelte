<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils';

	type Props = Omit<HTMLInputAttributes, 'value' | 'class'> & {
		label: string;
		value?: string;
		/** Ayuda bajo el campo. */
		hint?: string;
		/** Mensaje de error; marca el campo como inválido. */
		error?: string;
		/** Si se indica, el campo es un área de texto de esas filas (p. ej. motivo de anulación). */
		rows?: number;
		class?: string;
	};
	let { label, value = $bindable(''), hint, error, rows, class: className, required, ...rest }: Props = $props();

	const uid = $props.id();
	const id = `f-${uid}`;
	const describedBy = $derived([hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined);
	const field =
		'w-full rounded-chip border bg-glass px-3 text-[15px] text-ink placeholder:text-ink-muted shadow-[inset_0_1px_0_var(--glass-highlight)] outline-offset-2';
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<label for={id} class="text-[13px] font-semibold leading-[18px] text-ink">
		{label}{#if required}<span aria-hidden="true" class="text-negative"> *</span>{/if}
	</label>
	{#if rows}
		<textarea {id} {rows} bind:value {required} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
			class={cn(field, 'py-2.5', error ? 'border-negative' : 'border-ink-muted/75')}></textarea>
	{:else}
		<input {id} bind:value {required} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
			class={cn(field, 'min-h-12', error ? 'border-negative' : 'border-ink-muted/75')} {...rest} />
	{/if}
	{#if hint}<p id="{id}-hint" class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p id="{id}-err" class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</div>
