<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button, CapsulitoEntrada, Corto, PasswordField, Banner, opcionesFormulario, usarAvisos, usarMascota } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	let { data, form }: PageProps = $props();
	const avisos = usarAvisos();
	const mascota = usarMascota();
	type Formulario = { errores?: Partial<Record<string, { mensaje: string }>> } | null;

	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});

	// Capsulito de la entrada (RF-225, F12): se tapa los ojos en cualquiera de las dos contraseñas y reacciona al resultado.
	let taparOjos = $state(false);
	let estado = $state<'reposo' | 'fallo' | 'exito'>('reposo');

	function alEnfocarOEscribir(evento: Event) {
		const campo = evento.target;
		if (!(campo instanceof HTMLInputElement)) return;
		if (campo.name === 'contrasena' || campo.name === 'repeticion') {
			taparOjos = true;
			if (estado === 'fallo') estado = 'reposo';
		}
	}

	function alSalirDelCampo(evento: FocusEvent) {
		const campo = evento.target;
		if (campo instanceof HTMLInputElement && (campo.name === 'contrasena' || campo.name === 'repeticion')) taparOjos = false;
	}

	const enviar: SubmitFunction = async (entrada) => {
		taparOjos = false;
		const base = await opcionesFormulario(avisos)(entrada);
		return async (opciones) => {
			if (opciones.result.type === 'failure') estado = 'fallo';
			// Con la redirección se celebra y se navega sin esperar: la entrada no se retrasa.
			if (opciones.result.type === 'redirect') estado = 'exito';
			if (typeof base === 'function') await base(opciones);
			else await opciones.update();
		};
	};
</script>

<svelte:head>
	<title>{textos.acceso.enlaceValido} · beCafé</title>
</svelte:head>

<!-- RF-249: con un enlace de alta o recuperación vigente, el corto va antes del formulario. No hay bienvenida: la ve la persona al entrar en Inicio. -->
{#if data.valido && mascota.cortoPendiente}
	<Corto onTerminar={() => mascota.cerrarCorto()} onSaltar={() => mascota.cerrarCorto()} />
{/if}

<main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
	{#if data.valido}
		<CapsulitoEntrada class="self-center" mirarX={50} {taparOjos} {estado} />
		<h1 class="font-serif text-3xl font-semibold text-ink">{textos.acceso.enlaceValido}</h1>
		<p class="text-ink-muted">{textos.acceso.ayudaContrasena}</p>

		<!-- Superficie estable: el formulario no va sobre cristal (constitución XVIII). -->
		<div
			class="rounded-panel border border-hairline bg-wall-base p-5"
			role="presentation"
			oninput={alEnfocarOEscribir}
			onfocusin={alEnfocarOEscribir}
			onfocusout={alSalirDelCampo}
		>
			<form method="post" use:enhance={enviar} class="flex flex-col gap-4" novalidate>
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
