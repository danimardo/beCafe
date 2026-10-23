<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button, ConfirmDialog, PageHeader, PasswordField, Section, Switch, ThemeToggle, usarTema } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import SeccionAvisos from './SeccionAvisos.svelte';

	type Formulario = {
		errores?: Partial<Record<string, { mensaje: string }>>;
		confirmacion?: string;
	} | null;

	let { data, form }: PageProps = $props();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const rol = $derived(data.rol === 'administrador' ? textos.admin.administrador : textos.admin.miembro);

	const tema = usarTema();
	let confirmando = $state(false);
	let formularioSesiones: HTMLFormElement | undefined;
</script>

<svelte:head>
	<title>{textos.perfil.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
	<PageHeader title={textos.perfil.titulo} />
	<a class="text-accent underline" href={resolve('/(app)/privacidad')}>{textos.privacidad.enlace}</a>

	<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px] text-ink">
		<dt class="text-ink-muted">{textos.perfil.nombre}</dt>
		<dd>{data.nombre}</dd>
		<dt class="text-ink-muted">{textos.perfil.correo}</dt>
		<dd>{data.email}</dd>
		<dt class="text-ink-muted">{textos.perfil.rol}</dt>
		<dd>{rol}</dd>
	</dl>

	{#if errores.general}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
	{/if}
	{#if formulario?.confirmacion}
		<p role="status" class="text-[15px] text-ink">{formulario.confirmacion}</p>
	{/if}

	<Section title={textos.apariencia.titulo}>
		<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5">
			<ThemeToggle />
			<Switch
				label={textos.apariencia.reducirTransparencia}
				description={textos.apariencia.ayudaTransparencia}
				checked={tema.transparencia === 'reducida'}
				onchange={(marcado: boolean) => tema.cambiarTransparencia(marcado ? 'reducida' : 'normal')}
			/>
		</div>
	</Section>

	<SeccionAvisos preferencias={data.preferencias} />

	<Section title={textos.perfil.cambiarContrasena}>
		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<form method="post" action="?/cambiarContrasena" use:enhance class="flex flex-col gap-4" novalidate>
				<PasswordField
					label={textos.perfil.contrasenaActual}
					name="contrasenaActual"
					autocomplete="current-password"
					error={errores.contrasenaActual?.mensaje}
				/>
				<PasswordField
					label={textos.acceso.nuevaContrasena}
					name="contrasenaNueva"
					autocomplete="new-password"
					hint={textos.acceso.ayudaContrasena}
					error={errores.contrasenaNueva?.mensaje}
				/>
				<PasswordField
					label={textos.acceso.repetirContrasena}
					name="repeticion"
					autocomplete="new-password"
					error={errores.repeticion?.mensaje}
				/>
				<p class="text-[14px] text-ink-muted">{textos.perfil.ayudaCambio}</p>
				<Button type="submit" block>{textos.perfil.cambiarContrasena}</Button>
			</form>
		</div>
	</Section>

	<Section title={textos.perfil.cerrarSesionesGlobal}>
		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<!-- Con JavaScript, el botón abre la confirmación; sin JavaScript, envía directamente el formulario. -->
			<form bind:this={formularioSesiones} method="post" action="?/cerrarSesionesGlobal">
				<Button
					type="submit"
					variant="soft"
					block
					onclick={(evento: MouseEvent) => {
						evento.preventDefault();
						confirmando = true;
					}}
				>
					{textos.perfil.cerrarSesionesGlobal}
				</Button>
			</form>
		</div>
	</Section>
</main>

<ConfirmDialog
	bind:open={confirmando}
	title={textos.perfil.confirmarCierreGlobal}
	description={textos.perfil.descripcionCierreGlobal}
	confirmLabel={textos.perfil.confirmarCierreGlobal}
	cancelLabel={textos.perfil.cancelar}
	tone="danger"
	onconfirm={() => formularioSesiones?.submit()}
/>
