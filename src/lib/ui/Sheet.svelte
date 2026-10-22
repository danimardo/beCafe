<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import IconButton from './IconButton.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
		/** Zona fija inferior con las acciones (botón principal). */
		footer?: Snippet;
	};
	let { open = $bindable(false), title, description, children, footer }: Props = $props();
</script>

<!-- Móvil: hoja que sube desde abajo. Escritorio (md+): diálogo centrado. -->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-fade-in fixed inset-0 z-50 bg-scrim" />
		<Dialog.Content
			class="animate-sheet-in glass-strong fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-sheet border-b-0 text-ink md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:border-b"
		>
			<div class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-ink-muted/50 md:hidden" aria-hidden="true"></div>
			<div class="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
				<div class="min-w-0">
					<Dialog.Title class="type-title-lg">{title}</Dialog.Title>
					{#if description}
						<Dialog.Description class="mt-1 text-[13px] leading-[18px] text-ink-muted">{description}</Dialog.Description>
					{/if}
				</div>
				<Dialog.Close>
					{#snippet child({ props })}
						<IconButton {...props} label="Cerrar" variant="ghost"><X class="size-5" aria-hidden="true" /></IconButton>
					{/snippet}
				</Dialog.Close>
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{@render children()}</div>
			{#if footer}
				<div class="shrink-0 border-t border-hairline px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{@render footer()}</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
