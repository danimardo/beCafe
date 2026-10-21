<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import TextField from './TextField.svelte';
	import Button from './Button.svelte';

	type Props = {
		label: string;
		/** Texto que se muestra y se copia (p. ej. el enlace de invitación o de recuperación, RF-131). */
		value: string;
		hint?: string;
		class?: string;
	};
	let { label, value, hint, class: className }: Props = $props();

	let copied = $state(false);
	let failed = $state(false);

	async function copy() {
		failed = false;
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => (copied = false), 4000);
		} catch {
			// Sin permiso del portapapeles: se selecciona el texto para que se copie a mano.
			failed = true;
		}
	}
</script>

<div class={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
	<TextField {label} {value} {hint} readonly onfocus={(e: FocusEvent) => (e.currentTarget as HTMLInputElement).select()} />
	<Button variant="soft" block onclick={copy}>
		{#if copied}<Check class="size-5" aria-hidden="true" /> Enlace copiado{:else}<Copy class="size-5" aria-hidden="true" /> Copiar enlace{/if}
	</Button>
	<p class="sr-only" role="status">{copied ? 'Enlace copiado al portapapeles' : ''}</p>
	{#if failed}<p class="text-[13px] leading-[18px] text-negative">No se pudo copiar solo. Selecciona el texto y cópialo.</p>{/if}
</div>
