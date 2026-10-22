<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button, PasswordField, Banner, opcionesFormulario, usarAvisos } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	type Formulario = { errores?: Partial<Record<string, { mensaje: string }>> } | null;

	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
</script>

<svelte:head>
	<title>{textos.acceso.enlaceValido} · beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
	{#if data.valido}
		<h1 class="font-serif text-3xl font-semibold text-ink">{textos.acceso.enlaceValido}</h1>
		<p class="text-ink-muted">{textos.acceso.ayudaContrasena}</p>

		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<form method="post" use:enhance={opcionesFormulario(avisos)} class="flex flex-col gap-4" novalidate>
				{#if errores.general}
					<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
				{/if}
				<PasswordField
					label={textos.acceso.nuevaContrasena}
					name="contrasena"
					autocomplete="new-password"
					hint={textos.acceso.ayudaContrasena}
					error={errores.contrasena?.mensaje}
				/>
				<PasswordField
					label={textos.acceso.repetirContrasena}
					name="repeticion"
					autocomplete="new-password"
					error={errores.repeticion?.mensaje}
				/>
				<Button type="submit" block>{textos.acceso.guardar}</Button>
			</form>
		</div>
	{:else}
		<h1 class="font-serif text-3xl font-semibold text-ink">{textos.acceso.tituloNoValido}</h1>
		<Banner tone="negative" title={textos.acceso.enlaceNoValido}>
			{#snippet actions()}
				<a class="text-accent underline" href={resolve('/(auth)/login')}>{textos.inicioSesion.titulo}</a>
			{/snippet}
		</Banner>
	{/if}
</main>
