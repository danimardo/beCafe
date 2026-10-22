<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Banner, Button, CopyField, ListRow, PageHeader, PasswordField, Section, SelectField, TextField } from '#lib/ui';
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
	const valor = (campo: string): string => {
		const dato = formulario?.valores?.[campo];
		return typeof dato === 'string' ? dato : '';
	};
	const etiquetaRol = (rol: string): string => (rol === 'administrador' ? textos.admin.administrador : textos.admin.miembro);
	const opcionesRol = [
		{ value: 'miembro', label: textos.admin.miembro },
		{ value: 'administrador', label: textos.admin.administrador },
	];
</script>

<svelte:head>
	<title>{textos.admin.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
	<PageHeader title={textos.admin.titulo} />

	{#if data.administradoresActivos === 1}
		<Banner tone="warning" title={textos.admin.soloUnAdmin} />
	{/if}

	<Section title={textos.admin.darDeAlta}>
		<p class="text-ink-muted">{textos.admin.ayuda}</p>
		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<form method="post" action="?/alta" use:enhance class="flex flex-col gap-4" novalidate>
				{#if errores.general}
					<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
				{/if}
				<TextField label={textos.admin.nombre} name="nombre" value={valor('nombre')} error={errores.nombre?.mensaje} required />
				<TextField
					label={textos.admin.correo}
					name="email"
					type="email"
					inputmode="email"
					value={valor('email')}
					error={errores.email?.mensaje}
					required
				/>
				<SelectField
					label={textos.admin.rol}
					name="rol"
					value={valor('rol') || 'miembro'}
					options={opcionesRol}
					error={errores.rol?.mensaje}
				/>
				{#if errores.contrasenaActual}
					<PasswordField
						label={textos.admin.contrasenaActual}
						name="contrasenaActual"
						autocomplete="current-password"
						hint={textos.admin.ayudaReautenticacion}
						error={errores.contrasenaActual.mensaje}
					/>
				{/if}
				<Button type="submit" block>{textos.admin.darDeAlta}</Button>
			</form>
		</div>

		{#if formulario?.enlace}
			<p role="status">{formulario.confirmacion}</p>
			<CopyField
				label={textos.admin.enlaceDeAcceso}
				value={formulario.enlace}
				hint={formulario.expiraEn ? `Caduca el ${formatDate(formulario.expiraEn, true)}.` : undefined}
			/>
		{/if}
	</Section>

	<Section title={textos.admin.titulo}>
		{#each data.personas as persona (persona.id)}
			<ListRow
				title={persona.nombre}
				subtitle={`${persona.email} · ${etiquetaRol(persona.rol)} · ${persona.estado === 'baja' ? 'De baja' : 'Activa'}`}
				href={resolve('/(app)/admin/usuarios/[usuarioId=ulid]', { usuarioId: persona.id })}
			/>
		{/each}
	</Section>
</main>
