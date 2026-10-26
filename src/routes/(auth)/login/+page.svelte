<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import type { PageProps } from './$types';
	import {
		Bienvenida,
		Button,
		CapsulitoEntrada,
		Corto,
		TextField,
		PasswordField,
		opcionesFormulario,
		usarAvisos,
		usarMascota,
	} from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	type Formulario = { errores?: Partial<Record<string, { mensaje: string }>>; valores?: Record<string, unknown> } | null;

	let { form }: PageProps = $props();
	const avisos = usarAvisos();
	const mascota = usarMascota();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const correoEscrito = $derived(typeof formulario?.valores?.email === 'string' ? formulario.valores.email : '');

	// Capsulito de la entrada (RF-225): mira el texto del correo, se tapa los ojos en la contraseña y reacciona al resultado.
	const LARGO_CORREO_A_DERECHA = 30;
	let mirarX = $state(50);
	let taparOjos = $state(false);
	let estado = $state<'reposo' | 'fallo' | 'exito'>('reposo');

	function alEscribirOEnfocar(evento: Event) {
		const campo = evento.target;
		if (!(campo instanceof HTMLInputElement)) return;
		if (campo.name === 'email') {
			taparOjos = false;
			if (estado === 'fallo') estado = 'reposo';
			const posicion = campo.selectionStart ?? campo.value.length;
			mirarX = Math.min(100, (posicion / LARGO_CORREO_A_DERECHA) * 100);
		} else if (campo.name === 'contrasena') {
			taparOjos = true;
			mirarX = 50;
		}
	}

	function alSalirDelCampo(evento: FocusEvent) {
		if (evento.target instanceof HTMLInputElement && evento.target.name === 'contrasena') taparOjos = false;
	}

	const enviar: SubmitFunction = async (entrada) => {
		taparOjos = false;
		const base = await opcionesFormulario(avisos)(entrada);
		return async (opciones) => {
			if (opciones.result.type === 'failure') estado = 'fallo';
			// Con la redirección se celebra y se navega sin esperar: la entrada no se retrasa (CA-225).
			if (opciones.result.type === 'redirect') estado = 'exito';
			if (typeof base === 'function') await base(opciones);
			else await opciones.update();
		};
	};
</script>

<svelte:head>
	<title>{textos.inicioSesion.titulo} · beCafé</title>
</svelte:head>

<!-- RF-249 y RF-195: si el dispositivo nunca vio la bienvenida, se muestra antes del formulario primero el corto y después la bienvenida. -->
{#if mascota.cortoPendiente}
	<Corto onTerminar={() => mascota.cerrarCorto()} onSaltar={() => mascota.cerrarCorto()} />
{:else}
	<Bienvenida modo="antesDeEntrar" />
{/if}

<main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
	<CapsulitoEntrada class="self-center" {mirarX} {taparOjos} {estado} />
	<h1 class="font-serif text-3xl font-semibold text-ink">{textos.inicioSesion.titulo}</h1>
	<p class="text-ink-muted">{textos.inicioSesion.ayuda}</p>

	<!-- Superficie estable: el formulario no va sobre cristal (constitución XVIII). -->
	<div
		class="rounded-panel border border-hairline bg-wall-base p-5"
		role="presentation"
		oninput={alEscribirOEnfocar}
		onfocusin={alEscribirOEnfocar}
		onfocusout={alSalirDelCampo}
		onkeyup={alEscribirOEnfocar}
		onclick={alEscribirOEnfocar}
	>
		<form method="post" use:enhance={enviar} class="flex flex-col gap-4" novalidate>
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
