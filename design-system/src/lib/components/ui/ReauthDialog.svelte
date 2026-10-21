<script lang="ts">
	import Sheet from './Sheet.svelte';
	import Button from './Button.svelte';
	import PasswordField from './PasswordField.svelte';

	type Props = {
		open?: boolean;
		/** Devuelve true si la contraseña es correcta. Debe validarse en el servidor. */
		onsubmit: (password: string) => Promise<boolean> | boolean;
		onsuccess?: () => void;
	};
	let { open = $bindable(false), onsubmit, onsuccess }: Props = $props();

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';
		const ok = await onsubmit(password);
		loading = false;
		if (!ok) {
			error = 'La contraseña no es correcta.';
			return;
		}
		password = '';
		open = false;
		onsuccess?.();
	}
</script>

<!-- RN-050 / RF-138: las acciones de administrador piden la contraseña si pasaron más de 15 minutos. -->
<Sheet bind:open title="Confirma tu contraseña" description="Por seguridad, las acciones de administración la piden cada 15 minutos.">
	<form id="reauth-form" class="pt-2" onsubmit={submit}>
		<PasswordField bind:value={password} {error} autocomplete="current-password" />
	</form>
	{#snippet footer()}
		<Button type="submit" form="reauth-form" size="lg" block {loading}>Continuar</Button>
	{/snippet}
</Sheet>
