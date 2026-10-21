<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		/** «sm» 36 px (barra lateral), «md» 40 px (pantalla bloqueante), «lg» 64 px (acceso). */
		size?: 'sm' | 'md' | 'lg';
		/** Muestra «beCafé» al lado (en serif). Sin él, solo el icono. */
		wordmark?: boolean;
		class?: string;
	};
	let { size = 'sm', wordmark = true, class: className }: Props = $props();

	const box = { sm: 'size-9', md: 'size-10', lg: 'size-16' };
	const text = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' };
</script>

<!-- Logotipo de beCafé (archivo de marca): /brand/becafe-mark.png, ya con sus esquinas redondeadas. El nombre se escribe siempre «beCafé» (RT-011). -->
<span class={cn('inline-flex items-center gap-2.5', size === 'lg' && 'flex-col gap-3', className)}>
	<img src="/brand/becafe-mark.png" alt="" aria-hidden="true" width="256" height="256" class={cn('shrink-0 drop-shadow-sm', box[size])} />
	{#if wordmark}<span class={cn('font-serif font-semibold', text[size])}>beCafé</span>{:else}<span class="sr-only">beCafé</span>{/if}
</span>
