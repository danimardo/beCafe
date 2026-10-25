<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import {
		Button,
		ConfirmDialog,
		ListRow,
		PageHeader,
		PasswordField,
		Section,
		Switch,
		TarjetaInstalacion,
		ThemeToggle,
		usarMascota,
		usarTema,
	} from '#lib/ui';
	import { crearInstalacion, type EstadoInstalacion } from '#lib/client/instalacion';
	import { textos } from '#lib/shared/textos';
	import FotoPersona from '../FotoPersona.svelte';
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
	const mascota = usarMascota();
	let confirmando = $state(false);
	let formularioSesiones: HTMLFormElement | undefined;

	// RF-206: la opción de instalar está siempre en Perfil, aunque se haya descartado la tarjeta de Inicio.
	let estadoInstalacion = $state<EstadoInstalacion>('no_disponible');
	let instalacion: ReturnType<typeof crearInstalacion> | undefined;
	onMount(() => {
		instalacion = crearInstalacion(window, (estado) => (estadoInstalacion = estado));
		return () => instalacion?.destruir();
	});
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

	<Section title="Instalar la aplicación">
		{#if estadoInstalacion === 'instalable' || estadoInstalacion === 'ios'}
			<TarjetaInstalacion compacta estado={estadoInstalacion} oninstalar={() => void instalacion?.instalar()} />
		{:else}
			<p class="rounded-panel border border-hairline bg-wall-base p-4 text-[15px] leading-6 text-ink-muted">
				{estadoInstalacion === 'instalada'
					? 'beCafé ya está instalada en este dispositivo.'
					: 'Este navegador no ofrece instalar la aplicación. Prueba con Chrome en Android o con Safari en iPhone y iPad.'}
			</p>
		{/if}
	</Section>

	<Section title={textos.apariencia.titulo}>
		<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5">
			<ThemeToggle />
			<Switch
				label={textos.apariencia.reducirTransparencia}
				description={textos.apariencia.ayudaTransparencia}
				checked={tema.transparencia === 'reducida'}
				onchange={(marcado: boolean) => tema.cambiarTransparencia(marcado ? 'reducida' : 'normal')}
			/>
			<Switch
				label="Mostrar a Capsulito"
				description="Muestra u oculta la mascota del departamento en este dispositivo."
				checked={mascota.visible}
				onchange={(marcado: boolean) => mascota.setVisible(marcado)}
			/>
			<Switch
				label="Voz de Capsulito"
				description="Activa las locuciones de voz de Capsulito en este dispositivo."
				checked={mascota.vozActiva}
				onchange={(marcado: boolean) => mascota.setVozActiva(marcado)}
			/>
			<Button type="button" variant="soft" block onclick={() => mascota.repetirBienvenida()}>Ver la bienvenida otra vez</Button>
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

<ConfirmDialog
	bind:open={confirmando}
	title={textos.perfil.confirmarCierreGlobal}
	description={textos.perfil.descripcionCierreGlobal}
	confirmLabel={textos.perfil.confirmarCierreGlobal}
	cancelLabel={textos.perfil.cancelar}
	tone="danger"
	onconfirm={() => formularioSesiones?.submit()}
/>
