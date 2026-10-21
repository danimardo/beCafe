<script lang="ts">
	import { page } from '$app/state';
	import { Banner, Button, Glass, PasswordField, TextField } from '#lib';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// RN-048: 5 fallos seguidos bloquean 15 minutos. Contador solo de demostración: el conteo y el bloqueo viven en el servidor.
	// Demo directa: /login?estado=bloqueada
	let fails = $state(0);
	const locked = $derived(fails >= 5 || page.url.searchParams.get('estado') === 'bloqueada');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (locked) return;
		// RF-133: el mismo mensaje si el correo no existe o la contraseña es incorrecta.
		fails += 1;
		error = 'Correo o contraseña incorrectos.';
	}
</script>

<Glass as="section" radius="sheet" class="p-6">
	<h1 class="type-title-lg mb-4">Entrar</h1>
	<form class="flex flex-col gap-4" onsubmit={submit}>
		{#if locked}
			<!-- Mensaje genérico (propuesto): no revela si el correo existe, para respetar RF-133. -->
			<Banner tone="warning" title="Acceso bloqueado temporalmente">
				Demasiados intentos. Vuelve a probar dentro de 15 minutos o pide un enlace de recuperación a un administrador.
			</Banner>
		{:else if error}
			<Banner tone="negative">{error}</Banner>
		{/if}
		<TextField label="Correo" type="email" autocomplete="email" inputmode="email" bind:value={email} required />
		<PasswordField bind:value={password} />
		<Button type="submit" size="lg" block {loading} disabled={locked}>Entrar</Button>
	</form>
</Glass>
<p class="mt-4 text-center text-[13px] leading-[18px] text-ink-muted">
	¿Has olvidado la contraseña? Pide un enlace de recuperación a un administrador.
</p>
