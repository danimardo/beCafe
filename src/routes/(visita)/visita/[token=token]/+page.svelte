<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Banner, Bienvenida, Button, Corto, TextField, usarMascota } from '#lib/ui';
	import { TEXTO_VISITANTES } from '#lib/shared/privacidad';
	import { textos } from '#lib/shared/textos';

	let { data, form }: PageProps = $props();
	const mascota = usarMascota();
	type Formulario = { errores?: Partial<Record<string, { mensaje: string }>>; valores?: Record<string, unknown> } | null;
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const nombreEscrito = $derived(typeof formulario?.valores?.nombre === 'string' ? formulario.valores.nombre : '');
	const motivo = $derived(
		data.motivo === 'caducado'
			? textos.visitantes.enlaceCaducado
			: data.motivo === 'revocado'
				? textos.visitantes.enlaceRevocado
				: textos.visitantes.enlaceDesconocido,
	);
</script>

<svelte:head>
	<title>{textos.visitantes.tituloEntrada} · beCafé</title>
</svelte:head>

{#if data.valido}
	<!-- RF-249 y RF-195: con un enlace vigente, primero el corto y después la bienvenida, antes de pedir el nombre. -->
	{#if mascota.cortoPendiente}
		<Corto onTerminar={() => mascota.cerrarCorto()} onSaltar={() => mascota.cerrarCorto()} />
	{:else}
		<Bienvenida modo="antesDeEntrar" visitante hrefEntrar={resolve('/(auth)/login')} />
	{/if}
{/if}

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
	{#if data.valido}
		<h1 class="font-serif text-3xl font-semibold text-ink">{textos.visitantes.tituloEntrada}</h1>
		<p class="text-ink-muted">{textos.visitantes.ayudaEntrada}</p>

		<form
			method="post"
			action="?/entrar"
			use:enhance
			class="flex flex-col gap-5 rounded-panel border border-hairline bg-wall-base p-5"
			novalidate
		>
			{#if errores.general}
				<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
			{/if}
			<TextField
				label={textos.visitantes.nombre}
				name="nombre"
				autocomplete="name"
				maxlength={60}
				required
				value={nombreEscrito}
				hint={textos.visitantes.ayudaNombre}
				error={errores.nombre?.mensaje}
			/>
			<section aria-labelledby="privacidad-visitantes" class="flex flex-col gap-2">
				<h2 id="privacidad-visitantes" class="text-[15px] font-semibold text-ink">{textos.visitantes.privacidadTitulo}</h2>
				<p class="text-[13px] leading-[18px] text-ink-muted">{TEXTO_VISITANTES}</p>
				<label class="flex min-h-11 items-center gap-3 text-[15px] text-ink">
					<input
						type="checkbox"
						name="privacidad"
						value="si"
						required
						class="size-5 accent-accent"
						aria-invalid={errores.privacidad ? 'true' : undefined}
						aria-describedby={errores.privacidad ? 'privacidad-error' : undefined}
					/>
					{textos.visitantes.privacidadCasilla}
				</label>
				{#if errores.privacidad}
					<p id="privacidad-error" class="text-[13px] text-negative">{errores.privacidad.mensaje}</p>
				{/if}
			</section>
			<Button type="submit" size="lg" block>{textos.visitantes.entrar}</Button>
		</form>
	{:else}
		<h1 class="font-serif text-3xl font-semibold text-ink">{textos.visitantes.enlaceNoValidoTitulo}</h1>
		<Banner tone="negative" title={motivo} />
	{/if}
</main>
