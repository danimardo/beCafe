<script lang="ts">
	import Glass from './Glass.svelte';
	import { TEXTO_PRIVACIDAD, VERSION_PRIVACIDAD } from '#lib/shared/privacidad';

	type Props = {
		/** Versión del texto que se muestra (RF-160). Por defecto, la vigente. */
		version?: number;
		class?: string;
	};
	let { version = VERSION_PRIVACIDAD, class: className }: Props = $props();
</script>

<!-- El texto sale de `#lib/shared/privacidad`: una sola fuente para la pantalla de aceptación y para la consulta (constitución I). -->
<Glass
	as="article"
	class={['space-y-3 text-[15px] leading-[22px]', className].filter(Boolean).join(' ')}
	aria-label="Texto de privacidad, versión {version}"
>
	{#each TEXTO_PRIVACIDAD as bloque, indice (indice)}
		{#if bloque.tipo === 'titulo'}
			<h2 class="type-title-lg">{bloque.texto}</h2>
		{:else if bloque.tipo === 'parrafo'}
			<p>
				{#if bloque.entrada}<b>{bloque.entrada}</b>
				{/if}{bloque.texto}
			</p>
		{:else}
			<div>
				{#if bloque.entrada}<p><b>{bloque.entrada}</b></p>{/if}
				<ul class="mt-1 list-disc space-y-1 pl-5">
					{#each bloque.elementos as elemento (elemento)}
						<li>{elemento}</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</Glass>
