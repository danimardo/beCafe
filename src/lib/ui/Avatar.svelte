<script lang="ts">
	import { cn } from './utils';
	import { initials } from '#lib/shared/texto';
	import { colorAvatar } from '#lib/shared/avatar';

	type Props = {
		name: string;
		/** Identificador de la persona: fija el color de las iniciales (RF-209). Sin él, el color neutro. */
		usuarioId?: string;
		/** Dirección de su foto (RF-208). Si falta o no carga, se muestran las iniciales. */
		fotoUrl?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	};
	let { name, usuarioId, fotoUrl = null, size = 'sm', class: className }: Props = $props();

	// Tailwind necesita las clases escritas completas para generarlas.
	const COLORES = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'] as const;
	const color = $derived(usuarioId === undefined ? 'bg-accent-soft' : (COLORES[colorAvatar(usuarioId)] ?? 'bg-accent-soft'));
	let fotoFallida = $state(false);
	const mostrarFoto = $derived(fotoUrl !== null && !fotoFallida);
</script>

<!-- Decorativo: el nombre completo siempre aparece como texto al lado. La foto es `alt=""`; las iniciales, de respaldo. -->
<span
	aria-hidden="true"
	class={cn(
		'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-ink',
		color,
		size === 'sm' ? 'size-9 text-[13px]' : size === 'md' ? 'size-11 text-[15px]' : 'size-24 text-[28px]',
		className,
	)}
>
	{#if mostrarFoto}
		<img src={fotoUrl} alt="" class="size-full object-cover" onerror={() => (fotoFallida = true)} />
	{:else}
		{initials(name)}
	{/if}
</span>
