<script lang="ts">
	import { cn } from './utils';
	import { initials } from '#lib/shared/texto';
	import { colorAvatar, ilustracionAvatar } from '#lib/shared/avatar';
	import { ILUSTRACIONES } from './avatares';

	type Props = {
		name: string;
		/** Identificador de la persona: fija el color y la ilustración (RF-209, RF-222). Sin él, el color neutro y las iniciales. */
		usuarioId?: string;
		/** Dirección de su foto (RF-208). Si falta o no carga, se muestra su ilustración (RF-222) o, sin identificador, las iniciales. */
		fotoUrl?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	};
	let { name, usuarioId, fotoUrl = null, size = 'sm', class: className }: Props = $props();

	// Tailwind necesita las clases escritas completas para generarlas.
	const COLORES = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'] as const;
	const color = $derived(usuarioId === undefined ? 'bg-accent-soft' : (COLORES[colorAvatar(usuarioId)] ?? 'bg-accent-soft'));
	const Ilustracion = $derived(usuarioId === undefined ? undefined : ILUSTRACIONES[ilustracionAvatar(usuarioId)]);
	let fotoFallida = $state(false);
	const mostrarFoto = $derived(fotoUrl !== null && !fotoFallida);
</script>

<!-- Decorativo: el nombre completo siempre aparece como texto al lado. La foto es `alt=""`; sin foto, una ilustración de un trazo; las iniciales, de respaldo. -->
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
	{:else if Ilustracion}
		<Ilustracion />
	{:else}
		{initials(name)}
	{/if}
</span>
