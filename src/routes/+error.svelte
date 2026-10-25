<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ErrorPage, type ErrorKind } from '#lib/ui';
	import { textos } from '#lib/shared/textos';

	// 403 y 404 tienen página propia; el resto de 4xx usa «peticion» y 5xx, «servidor» (contracts/formularios.md).
	const kind: ErrorKind = $derived(
		page.status === 403 ? 'sin-permiso' : page.status === 404 ? 'no-encontrada' : page.status < 500 ? 'peticion' : 'servidor',
	);
	// Solo el 403 muestra el mensaje del servidor, que es texto propio de la aplicación. Cualquier otro error muestra el
	// texto genérico y, en la 500, el código de incidencia, sin detalles internos (constitución XIII).
	const mensaje = $derived(page.status === 403 ? page.error?.message : undefined);
	const codigo = $derived(kind === 'servidor' ? page.error?.codigo : undefined);
	const titulo = $derived(
		{
			peticion: textos.errorPagina.peticion.titulo,
			'no-encontrada': textos.errorPagina.noEncontrada.titulo,
			'sin-permiso': textos.errorPagina.sinPermiso.titulo,
			servidor: textos.errorPagina.servidor.titulo,
			'sin-conexion': textos.errorPagina.sinConexion.titulo,
		}[kind],
	);
</script>

<svelte:head>
	<title>{titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
	<ErrorPage {kind} code={codigo} message={mensaje} inicioHref={resolve('/(app)')} />
</main>
