<script lang="ts">
	import CapsuleIllustration from './CapsuleIllustration.svelte';
	import { cn, colorCapsulaCss } from './utils';

	type Props = {
		name: string;
		/** Color del tipo de cápsula (hex), elegido por el administrador (RF-001). */
		color: string;
		/** Foto subida por el administrador (RF-005). Si falta o no carga, se dibuja la ilustración con `color`. */
		photoUrl?: string | null;
		/** sm 36 · md 48 · lg 64 · xl 88 (tarjeta de cápsula) */
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
	};
	let { name, color, photoUrl = null, size = 'md', class: className }: Props = $props();
	const sizes = { sm: 'size-9', md: 'size-12', lg: 'size-16', xl: 'size-[88px]' } as const;
	const ring = { sm: 'border-2', md: 'border-[3px]', lg: 'border-[3px]', xl: 'border-4' } as const;
	let failed = $state(false);
	let imgEl: HTMLImageElement | undefined = $state();

	$effect(() => {
		const el = imgEl;
		if (!el) return;
		if (el.complete && el.naturalWidth === 0) {
			failed = true;
			return;
		}
		const alFallar = () => {
			failed = true;
		};
		el.addEventListener('error', alFallar, { once: true });
		return () => el.removeEventListener('error', alFallar);
	});
</script>

<!-- Decorativo (aria-hidden): el nombre del tipo siempre va como texto al lado.
     Foto: recortada en círculo con aro del color del tipo.
     Sin foto (o si falla la carga): ilustración vectorial teñida con el color (RF-183). -->
{#if photoUrl && !failed}
	<span
		aria-hidden="true"
		class={cn('inline-block shrink-0 rounded-full bg-glass shadow-sm', ring[size], sizes[size], className)}
		style="border-color:{colorCapsulaCss(color)}"
	>
		<img bind:this={imgEl} src={photoUrl} alt="" loading="lazy" class="size-full rounded-full object-cover" />
	</span>
{:else}
	<span aria-hidden="true" data-name={name} class={cn('inline-block shrink-0', sizes[size], className)}>
		<CapsuleIllustration {color} class="size-full" />
	</span>
{/if}
