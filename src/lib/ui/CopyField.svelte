<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import TextField from './TextField.svelte';
	import Button from './Button.svelte';
	import { textos } from '#lib/shared/textos';

	type Props = {
		label: string;
		/** Texto que se muestra y se copia (p. ej. el enlace de invitación o de recuperación, RF-131). */
		value: string;
		hint?: string;
		/**
		 * El enlace acaba de generarse (RF-239): el campo recibe el foco, la vista se desplaza hasta él y el lector de pantalla
		 * oye que está listo. Sin JavaScript solo actúa `autofocus`, que escribe el servidor.
		 */
		anunciar?: boolean;
		class?: string;
	};
	let { label, value, hint, anunciar = false, class: className }: Props = $props();

	let copied = $state(false);
	let failed = $state(false);
	let raiz: HTMLDivElement | undefined = $state();

	function campo(): HTMLInputElement | null {
		return raiz?.querySelector('input') ?? null;
	}

	/** Respaldo sin contexto seguro (http por IP): `navigator.clipboard` no existe, pero `execCommand('copy')` sí (RF-238). */
	function copiarSeleccionando(): boolean {
		const input = campo();
		if (!input) return false;
		input.focus();
		input.select();
		try {
			return document.execCommand('copy');
		} catch {
			return false;
		}
	}

	async function copiarConApi(): Promise<boolean> {
		// Sin contexto seguro (http por IP) el navegador ni siquiera define `navigator.clipboard`.
		if (!window.isSecureContext || !('clipboard' in navigator)) return false;
		try {
			await navigator.clipboard.writeText(value);
			return true;
		} catch {
			return false;
		}
	}

	async function copy() {
		failed = false;
		if ((await copiarConApi()) || copiarSeleccionando()) {
			copied = true;
			setTimeout(() => (copied = false), 4000);
			return;
		}
		// Ningún método copia: el texto queda seleccionado para que se copie a mano.
		campo()?.select();
		failed = true;
	}

	// Sincroniza con el DOM: lleva la vista y el foco al enlace recién generado (RF-239). SvelteKit termina de aplicar la acción
	// (recarga de datos y foco) después de montar este campo y deja la vista arriba; por eso se espera a dos fotogramas.
	$effect(() => {
		if (!anunciar) return;
		let fotograma = requestAnimationFrame(() => {
			fotograma = requestAnimationFrame(() => {
				const input = campo();
				if (!input) return;
				const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				input.scrollIntoView({ block: 'center', behavior: reducido ? 'instant' : 'smooth' });
				input.focus({ preventScroll: true });
			});
		});
		return () => cancelAnimationFrame(fotograma);
	});
</script>

<div bind:this={raiz} class={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
	<TextField
		{label}
		{value}
		{hint}
		readonly
		autofocus={anunciar}
		onfocus={(e: FocusEvent) => {
			if (e.currentTarget instanceof HTMLInputElement) e.currentTarget.select();
		}}
	/>
	<Button variant="soft" block onclick={copy}>
		{#if copied}<Check class="size-5" aria-hidden="true" /> Enlace copiado{:else}<Copy class="size-5" aria-hidden="true" /> Copiar enlace{/if}
	</Button>
	<p class="sr-only" role="status">{copied ? 'Enlace copiado al portapapeles' : anunciar ? textos.admin.enlaceListo : ''}</p>
	{#if failed}<p class="text-[13px] leading-[18px] text-negative">No se pudo copiar solo. Selecciona el texto y cópialo.</p>{/if}
</div>
