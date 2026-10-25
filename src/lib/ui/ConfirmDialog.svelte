<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { buttonClasses } from './utils';

	type Props = {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		/** «danger» para acciones destructivas o con consecuencias económicas. */
		tone?: 'primary' | 'danger';
		onconfirm: () => void;
		/** Contenido extra bajo la descripción (p. ej. el importe por persona de un reparto). */
		children?: Snippet;
	};
	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Confirmar',
		cancelLabel = 'Cancelar',
		tone = 'primary',
		onconfirm,
		children,
	}: Props = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="animate-fade-in fixed inset-0 z-50 bg-scrim" />
		<AlertDialog.Content
			class="animate-sheet-in border border-hairline bg-wall-base shadow-[var(--shadow-glass)] fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-sheet p-6 text-ink"
		>
			<AlertDialog.Title class="type-title-lg">{title}</AlertDialog.Title>
			<AlertDialog.Description class="mt-2 text-[15px] leading-5 text-ink-muted">{description}</AlertDialog.Description>
			{#if children}<div class="mt-3">{@render children()}</div>{/if}
			<div class="mt-6 flex flex-col gap-2">
				<AlertDialog.Action class={buttonClasses(tone === 'danger' ? 'danger' : 'primary', 'lg', true)} onclick={onconfirm}>
					{confirmLabel}
				</AlertDialog.Action>
				<AlertDialog.Cancel class={buttonClasses('ghost', 'lg', true)}>{cancelLabel}</AlertDialog.Cancel>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
