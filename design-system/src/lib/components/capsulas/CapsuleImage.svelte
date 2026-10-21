<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		name: string;
		/** Color del tipo de cápsula (hex), elegido por el administrador (RF-001). */
		color: string;
		/** Foto subida por el administrador (RF-005). Si falta, se dibuja la cápsula con `color`. */
		photoUrl?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	};
	let { name, color, photoUrl = null, size = 'md', class: className }: Props = $props();
	const sizes = { sm: 'size-9', md: 'size-12', lg: 'size-16' };
</script>

<!-- Decorativo (aria-hidden): el nombre del tipo siempre va como texto al lado. -->
{#if photoUrl}
	<span aria-hidden="true" class={cn('inline-block shrink-0 rounded-full border-[3px] bg-glass', sizes[size], className)} style="border-color:{color}">
		<img src={photoUrl} alt="" loading="lazy" class="size-full rounded-full object-cover" />
	</span>
{:else}
	<span
		aria-hidden="true"
		data-name={name}
		class={cn('inline-block shrink-0 rounded-full', sizes[size], className)}
		style="background: radial-gradient(circle at 34% 28%, rgba(255,255,255,.55), rgba(255,255,255,0) 38%), {color};
		box-shadow: inset 0 0 0 4px rgba(0,0,0,.16), inset 0 0 0 5px rgba(255,255,255,.18), inset 0 -6px 10px rgba(0,0,0,.3), 0 4px 10px rgba(0,0,0,.22);"
	></span>
{/if}
