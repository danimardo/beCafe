<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { cn } from '#lib/utils';

	type Props = {
		label?: string;
		value?: string;
		hint?: string;
		error?: string;
		autocomplete?: 'current-password' | 'new-password';
		/** RT-007 / RN-047: mínimo 15 caracteres. */
		minlength?: number;
		class?: string;
	};
	let {
		label = 'Contraseña',
		value = $bindable(''),
		hint,
		error,
		autocomplete = 'current-password',
		minlength = 15,
		class: className
	}: Props = $props();

	const uid = $props.id();
	const id = `p-${uid}`;
	let visible = $state(false);
	const describedBy = $derived([hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined);
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<label for={id} class="text-[13px] font-semibold leading-[18px] text-ink">{label}</label>
	<div class="relative">
		<input
			{id}
			bind:value
			type={visible ? 'text' : 'password'}
			{autocomplete}
			{minlength}
			aria-invalid={error ? true : undefined}
			aria-describedby={describedBy}
			class={cn(
				'min-h-12 w-full rounded-chip border bg-glass pl-3 pr-12 text-[15px] text-ink shadow-[inset_0_1px_0_var(--glass-highlight)]',
				error ? 'border-negative' : 'border-ink-muted/75'
			)}
		/>
		<button
			type="button"
			class="absolute right-0.5 top-0.5 inline-flex size-11 items-center justify-center rounded-full text-ink-muted"
			aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
		>
			{#if visible}<EyeOff class="size-5" aria-hidden="true" />{:else}<Eye class="size-5" aria-hidden="true" />{/if}
		</button>
	</div>
	{#if hint}<p id="{id}-hint" class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p id="{id}-err" class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</div>
