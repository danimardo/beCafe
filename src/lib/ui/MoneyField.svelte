<script lang="ts">
	import { cn } from './utils';
	import { formatMoneyPlain, parseMoney } from '#lib/shared/dinero';

	type Props = {
		label: string;
		/** Importe en céntimos (bindable). null si está vacío o no es válido. */
		cents?: number | null;
		hint?: string;
		error?: string;
		required?: boolean;
		/** Si cambias `cents` desde fuera, cambia también esta clave para refrescar el texto. */
		class?: string;
	};
	let { label, cents = $bindable(null), hint, error, required, class: className }: Props = $props();

	const uid = $props.id();
	const id = `m-${uid}`;
	let text = $state(cents == null ? '' : formatMoneyPlain(cents));
	const describedBy = $derived([hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined);
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<label for={id} class="text-[13px] font-semibold leading-[18px] text-ink">
		{label}{#if required}<span aria-hidden="true" class="text-negative"> *</span>{/if}
	</label>
	<div class="relative">
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			placeholder="0,00"
			{required}
			bind:value={text}
			oninput={() => (cents = parseMoney(text))}
			onblur={() => (text = cents == null ? text : formatMoneyPlain(cents))}
			aria-invalid={error ? true : undefined}
			aria-describedby={describedBy}
			class={cn(
				'min-h-12 w-full rounded-chip border bg-glass pl-3 pr-9 text-right text-[15px] tabular-nums text-ink placeholder:text-ink-muted shadow-[inset_0_1px_0_var(--glass-highlight)]',
				error ? 'border-negative' : 'border-ink-muted/75',
			)}
		/>
		<span aria-hidden="true" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-muted">€</span>
	</div>
	{#if hint}<p id="{id}-hint" class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p id="{id}-err" class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</div>
