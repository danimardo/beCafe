<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button, ConfirmDialog, ListRow, PageHeader, PasswordField, Section } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
	import FotoPersona from '../FotoPersona.svelte';

	type Formulario = {
		errores?: Partial<Record<string, { mensaje: string }>>;
		confirmacion?: string;
	} | null;

	let { data, form }: PageProps = $props();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const rol = $derived(data.rol === 'administrador' ? textos.admin.administrador : textos.admin.miembro);

	let confirmando = $state(false);
	let formularioSesiones: HTMLFormElement | undefined;
</script>

<svelte:head>
	<title>{textos.perfil.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.perfil.titulo} />
	<div class="flex flex-wrap gap-4 text-[15px]">
		<a class="text-accent underline" href={resolve('/(app)/privacidad')}>{textos.privacidad.enlace}</a>
		<a class="text-accent underline" href={resolve('/(app)/ayuda/capsulito')}>Laboratorio de Capsulito</a>
	</div>

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

	<div class="grid gap-6 lg:grid-cols-2 lg:items-start">
		<div class="flex flex-col gap-6">
			<div class="rounded-panel border border-hairline bg-wall-base p-2">
				<ul class="flex flex-col">
					<ListRow title={textos.ajustes.enPerfil} subtitle={textos.ajustes.enPerfilAyuda} href={resolve('/(app)/ajustes')} />
				</ul>
			</div>

			{#if data.rol === 'administrador'}
				<Section title="Administración">
					<div class="rounded-panel border border-hairline bg-wall-base p-2">
						<ul class="flex flex-col">
							<ListRow title="Panel de administración" href={resolve('/(app)/admin')} />
							<ListRow title={textos.capsulas.titulo} href={resolve('/(app)/admin/capsulas')} />
							<ListRow title={textos.admin.titulo} href={resolve('/(app)/admin/usuarios')} />
							<ListRow title="Arqueos y recuentos" href={resolve('/(app)/admin/control')} />
							<ListRow title={textos.configuracion.titulo} href={resolve('/(app)/admin/configuracion')} />
							<ListRow title={textos.copias.titulo} href={resolve('/(app)/admin/copias')} />
						</ul>
					</div>
				</Section>
			{/if}

			<Section title={textos.fotoPersona.titulo}>
				<FotoPersona nombre={data.nombre} usuarioId={data.id} fotoUrl={data.fotoUrl} error={errores.foto?.mensaje} />
			</Section>
		</div>

		<div class="flex flex-col gap-6">
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
				<div class="flex flex-col gap-3 rounded-panel border border-hairline bg-wall-base p-5">
					<form method="post" action="/logout" use:enhance>
						<Button type="submit" variant="soft" block>{textos.inicio.cerrarSesion}</Button>
					</form>
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
		</div>
	</div>
</div>

<ConfirmDialog
	bind:open={confirmando}
	title={textos.perfil.confirmarCierreGlobal}
	description={textos.perfil.descripcionCierreGlobal}
	confirmLabel={textos.perfil.confirmarCierreGlobal}
	cancelLabel={textos.perfil.cancelar}
	tone="danger"
	onconfirm={() => formularioSesiones?.submit()}
/>
