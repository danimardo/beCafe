<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import {
		Avatar,
		Banner,
		Button,
		CopyField,
		ListRow,
		PageHeader,
		PasswordField,
		PhotoField,
		Section,
		SelectField,
		TextField,
	} from '#lib/ui';
	import { formatDate } from '#lib/shared/fechas/formato';
	import { TAMANO_MAXIMO_FOTO } from '#lib/shared/contratos/capsulas';
	import { textos } from '#lib/shared/textos';

	type Formulario = {
		errores?: Partial<Record<string, { mensaje: string }>>;
		valores?: Record<string, unknown>;
		origen?: 'alta';
		enlace?: string;
		expiraEn?: string;
		confirmacion?: string;
	} | null;

	let { data, form }: PageProps = $props();
	let foto = $state<File | null>(null);
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

<div class="flex flex-col gap-6">
	<PageHeader title={textos.admin.titulo} />

	{#if data.administradoresActivos === 1}
		<Banner tone="warning" title={textos.admin.soloUnAdmin} />
	{/if}

	<Section title={textos.admin.darDeAlta}>
		<p class="text-ink-muted">{textos.admin.ayuda}</p>
		<div class="rounded-panel border border-hairline bg-wall-base p-5">
			<form method="post" action="?/alta" enctype="multipart/form-data" use:enhance class="grid gap-4 md:grid-cols-2" novalidate>
				{#if errores.general}
					<p role="alert" class="md:col-span-2 rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{errores.general.mensaje}</p>
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
				<div class="md:col-span-2 md:max-w-sm">
					<PhotoField name="foto" label={textos.fotoPersona.campoAlta} bind:file={foto} maxBytes={TAMANO_MAXIMO_FOTO} />
					{#if errores.foto}<p role="alert" class="text-[13px] font-medium leading-[18px] text-negative">{errores.foto.mensaje}</p>{/if}
					{#if formulario?.errores && !formulario.enlace}<p class="mt-1 text-[13px] text-ink-muted">
							{textos.fotoPersona.volverAAdjuntar}
						</p>{/if}
				</div>
				{#if errores.contrasenaActual}
					<PasswordField
						class="md:col-span-2 md:max-w-sm"
						label={textos.admin.contrasenaActual}
						name="contrasenaActual"
						autocomplete="current-password"
						hint={textos.admin.ayudaReautenticacion}
						error={errores.contrasenaActual.mensaje}
					/>
				{/if}
				<div class="md:col-span-2"><Button type="submit">{textos.admin.darDeAlta}</Button></div>
			</form>
			{#if formulario?.enlace && formulario.origen === 'alta'}
				<div class="mt-4 flex flex-col gap-3">
					<p role="status">{formulario.confirmacion}</p>
					<CopyField
						anunciar
						label={textos.admin.enlaceDeAcceso}
						value={formulario.enlace}
						hint={formulario.expiraEn ? `Caduca el ${formatDate(formulario.expiraEn, true)}.` : undefined}
					/>
				</div>
			{/if}
		</div>
	</Section>

	<Section title={textos.admin.titulo}>
		<ul class="flex flex-col">
			{#each data.personas as persona (persona.id)}
				<ListRow
					title={persona.nombre}
					subtitle={`${persona.email} · ${etiquetaRol(persona.rol)} · ${persona.estado === 'baja' ? 'De baja' : 'Activa'}`}
					href={resolve('/(app)/admin/usuarios/[usuarioId=ulid]', { usuarioId: persona.id })}
				>
					{#snippet leading()}<Avatar name={persona.nombre} usuarioId={persona.id} fotoUrl={persona.fotoUrl} />{/snippet}
				</ListRow>
			{/each}
		</ul>
	</Section>
</div>
