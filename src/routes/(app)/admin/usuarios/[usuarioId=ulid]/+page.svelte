<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button, CopyField, PageHeader, PasswordField, Section, SelectField } from '#lib/ui';
	import { formatDate } from '#lib/shared/fechas/formato';
	import { textos } from '#lib/shared/textos';

	type Formulario = {
		errores?: Partial<Record<string, { mensaje: string }>>;
		valores?: Record<string, unknown>;
		enlace?: string;
		expiraEn?: string;
		confirmacion?: string;
	} | null;

	let { data, form }: PageProps = $props();
	const formulario: Formulario = $derived(form);
	const errores = $derived(formulario?.errores ?? {});
	const persona = $derived(data.persona);
	const opcionesRol = [
		{ value: 'miembro', label: textos.admin.miembro },
		{ value: 'administrador', label: textos.admin.administrador },
	];
</script>

<svelte:head>
	<title>{persona.nombre} · {textos.admin.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={persona.nombre} eyebrow={textos.admin.titulo} />
	<p class="text-ink-muted">
		{persona.email} · {persona.estado === 'baja' ? 'De baja' : 'Activa'} · {persona.tieneContrasena
			? textos.admin.conContrasena
			: textos.admin.sinContrasena}
	</p>
	<a class="text-accent underline" href={resolve('/(app)/admin/usuarios')}>{textos.admin.titulo}</a>

	{#if errores.general}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
	{/if}
	{#if data.bajaRegistrada}
		<p role="status">{textos.economia.bajaRegistrada}</p>
	{/if}
	{#if formulario?.confirmacion}
		<p role="status">{formulario.confirmacion}</p>
	{/if}
	{#if formulario?.enlace}
		<CopyField
			label={textos.admin.enlaceDeAcceso}
			value={formulario.enlace}
			hint={formulario.expiraEn ? `Caduca el ${formatDate(formulario.expiraEn, true)}.` : undefined}
		/>
	{/if}

	{#if persona.estado !== 'baja'}
		<a class="text-accent underline" href={resolve('/(app)/admin/usuarios/[usuarioId=ulid]/baja', { usuarioId: persona.id })}
			>{textos.economia.darDeBaja}</a
		>
	{/if}

	<Section title={textos.admin.cambiarRol}>
		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<form method="post" action="?/cambiarRol" use:enhance class="flex flex-col gap-4" novalidate>
				<SelectField label={textos.admin.rol} name="rol" value={persona.rol} options={opcionesRol} error={errores.rol?.mensaje} />
				{#if errores.contrasenaActual}
					<PasswordField
						label={textos.admin.contrasenaActual}
						name="contrasenaActual"
						autocomplete="current-password"
						hint={textos.admin.ayudaReautenticacion}
						error={errores.contrasenaActual.mensaje}
					/>
				{/if}
				<Button type="submit" variant="soft" block>{textos.admin.cambiarRol}</Button>
			</form>
		</div>
	</Section>

	{#if persona.estado === 'activo'}
		<Section title={textos.admin.generarEnlace}>
			<div class="rounded-panel border border-hairline bg-wall-base p-5">
				<form method="post" action="?/generarEnlace" use:enhance class="flex flex-col gap-4" novalidate>
					{#if errores.contrasenaActual}
						<PasswordField
							label={textos.admin.contrasenaActual}
							name="contrasenaActual"
							autocomplete="current-password"
							hint={textos.admin.ayudaReautenticacion}
							error={errores.contrasenaActual.mensaje}
						/>
					{/if}
					<Button type="submit" variant="soft" block>{textos.admin.generarEnlace}</Button>
				</form>
			</div>
		</Section>
	{:else}
		<Section title={textos.admin.reactivar}>
			<div class="rounded-panel border border-hairline bg-wall-base p-5">
				<form method="post" action="?/reactivar" use:enhance class="flex flex-col gap-4" novalidate>
					{#if errores.contrasenaActual}
						<PasswordField
							label={textos.admin.contrasenaActual}
							name="contrasenaActual"
							autocomplete="current-password"
							hint={textos.admin.ayudaReautenticacion}
							error={errores.contrasenaActual.mensaje}
						/>
					{/if}
					<Button type="submit" block>{textos.admin.reactivar}</Button>
				</form>
			</div>
		</Section>
	{/if}
</div>
