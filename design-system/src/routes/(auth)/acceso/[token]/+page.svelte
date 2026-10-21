<script lang="ts">
	import { page } from '$app/state';
	import LinkOff from '@lucide/svelte/icons/link-2-off';
	import { Banner, Button, EmptyState, Glass, PasswordField } from '#lib';

	let password = $state('');
	let repeat = $state('');

	// Estado del enlace (solo demostración): /acceso/x?estado=caducado | usado. El servidor es quien lo decide (RN-052).
	const linkState = $derived(page.url.searchParams.get('estado'));

	// RN-053: ≥ 15 caracteres y no figurar en la lista de contraseñas comunes. La lista real se comprueba en el servidor;
	// aquí solo unas pocas para mostrar el mensaje.
	const common = ['passwordpassword', 'contraseñacontraseña', '123456789012345', 'qwertyuiopasdfgh', 'cafecafecafecafe'];
	const tooShort = $derived(password.length > 0 && password.length < 15);
	const isCommon = $derived(password.length >= 15 && common.includes(password.toLowerCase()));
	const mismatch = $derived(repeat.length > 0 && repeat !== password);
	const canSubmit = $derived(password.length >= 15 && !isCommon && repeat === password);
</script>

<!-- RF-132: con un enlace válido se define la contraseña (RN-053). -->
<Glass as="section" radius="sheet" class="p-6">
	{#if linkState === 'caducado' || linkState === 'usado'}
		<EmptyState
			title={linkState === 'caducado' ? 'Este enlace ha caducado' : 'Este enlace ya se ha usado'}
			description={linkState === 'caducado'
				? 'Los enlaces de invitación duran 24 horas y los de recuperación, 1 hora. Pide uno nuevo a un administrador.'
				: 'Cada enlace sirve una sola vez, y uno nuevo anula los anteriores. Si ya tienes contraseña, entra con ella; si no, pide otro enlace a un administrador.'}
		>
			{#snippet icon()}<LinkOff class="size-7" />{/snippet}
			{#snippet action()}<Button href="/login" variant="soft">Ir a entrar</Button>{/snippet}
		</EmptyState>
	{:else}
		<h1 class="type-title-lg">Elige tu contraseña</h1>
		<p class="mb-4 mt-1 text-[14px] leading-[19px] text-ink-muted">Este enlace es de un solo uso y caduca pronto.</p>
		<form class="flex flex-col gap-4" onsubmit={(e) => e.preventDefault()}>
			{#if isCommon}
				<Banner tone="negative" title="Contraseña demasiado común">Aparece en listas de contraseñas conocidas. Prueba con una frase larga que solo tú recuerdes.</Banner>
			{/if}
			<PasswordField
				label="Contraseña nueva"
				bind:value={password}
				autocomplete="new-password"
				hint="Mínimo 15 caracteres. Una frase larga es mejor que símbolos raros."
				error={tooShort ? 'Faltan caracteres: mínimo 15.' : undefined}
			/>
			<PasswordField label="Repite la contraseña" bind:value={repeat} autocomplete="new-password" error={mismatch ? 'Las contraseñas no coinciden.' : undefined} />
			<Button type="submit" size="lg" block disabled={!canSubmit}>Guardar y entrar</Button>
		</form>
	{/if}
</Glass>
