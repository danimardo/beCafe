<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button, TextField, PasswordField, opcionesFormulario, usarAvisos } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	type Formulario = { errores?: Partial<Record<string, { mensaje: string }>>; valores?: Record<string, unknown> } | null;

	let { form }: PageProps = $props();
	const avisos = usarAvisos();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const correoEscrito = $derived(typeof formulario?.valores?.email === 'string' ? formulario.valores.email : '');
</script>

<svelte:head>
	<title>{textos.inicioSesion.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
	<h1 class="font-serif text-3xl font-semibold text-ink">{textos.inicioSesion.titulo}</h1>
	<p class="text-ink-muted">{textos.inicioSesion.ayuda}</p>

	<!-- Superficie estable: el formulario no va sobre cristal (constitución XVIII). -->
	<div class="rounded-panel border border-hairline bg-wall-base p-5">
		<form method="post" use:enhance={opcionesFormulario(avisos)} class="flex flex-col gap-4" novalidate>
			{#if errores.general}
				<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
			{/if}
			<TextField
				label={textos.acceso.correo}
				name="email"
				type="email"
				autocomplete="username"
				inputmode="email"
				value={correoEscrito}
				error={errores.email?.mensaje}
				required
			/>
			<PasswordField
				label={textos.acceso.contrasena}
				name="contrasena"
				autocomplete="current-password"
				minlength={1}
				error={errores.contrasena?.mensaje}
			/>
			<Button type="submit" block>{textos.acceso.entrar}</Button>
		</form>
	</div>
</main>
