<script lang="ts">
	import { enhance } from '$app/forms';
	import { Avatar, Button, EncuadreFoto } from '#lib/ui';
	import { TAMANO_MAXIMO_FOTO } from '#lib/shared/contratos/capsulas';
	import { textos } from '#lib/shared/textos';

	// Foto de una persona (RF-208): la comparten Perfil (la propia) y la ficha de Usuarios (la administra un administrador).
	// Dos formularios con nombre: `foto` sube y `quitarFoto` borra. Funcionan sin JavaScript.
	type Props = {
		nombre: string;
		usuarioId: string;
		fotoUrl: string | null;
		/** Mensaje de error del campo `foto` devuelto por la acción. */
		error?: string;
		propia?: boolean;
	};
	let { nombre, usuarioId, fotoUrl, error, propia = true }: Props = $props();
	let foto = $state<File | null>(null);
</script>

<div class="flex flex-col gap-4 rounded-panel border border-hairline bg-wall-base p-5">
	<div class="flex items-center gap-4">
		<Avatar name={nombre} {usuarioId} {fotoUrl} size="lg" />
		<p class="text-[13px] leading-[18px] text-ink-muted">{propia ? textos.fotoPersona.ayuda : textos.fotoPersona.ayudaOtra}</p>
	</div>
	{#if error}
		<p role="alert" class="rounded-chip bg-negative-soft px-3 py-2 text-[15px] text-ink">{error}</p>
	{/if}
	<form
		method="post"
		action="?/foto"
		enctype="multipart/form-data"
		class="flex flex-col gap-3"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
				foto = null;
			}}
	>
		<EncuadreFoto name="foto" guia="redonda" label={textos.fotoPersona.campo} bind:file={foto} maxBytes={TAMANO_MAXIMO_FOTO} />
		<Button type="submit" variant="soft">{textos.fotoPersona.guardar}</Button>
	</form>
	{#if fotoUrl}
		<form method="post" action="?/quitarFoto" use:enhance>
			<input type="hidden" name="quitar" value="si" />
			<Button type="submit" variant="ghost">{textos.fotoPersona.quitar}</Button>
		</form>
	{/if}
</div>
