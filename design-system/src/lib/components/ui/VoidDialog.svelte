<script lang="ts">
	import Sheet from './Sheet.svelte';
	import Button from './Button.svelte';
	import TextField from './TextField.svelte';

	type Props = {
		open?: boolean;
		/** Qué se anula, p. ej. «Consumo de Ristretto · 18 oct». */
		subject: string;
		/** Consecuencia económica que se explicará al usuario antes de confirmar. */
		consequence?: string;
		onconfirm: (reason: string) => void;
	};
	let { open = $bindable(false), subject, consequence, onconfirm }: Props = $props();

	let reason = $state('');
	let touched = $state(false);
	const invalid = $derived(reason.trim().length === 0);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		touched = true;
		if (invalid) return;
		onconfirm(reason.trim());
		reason = '';
		touched = false;
		open = false;
	}
</script>

<!-- RN-030: anular exige motivo. Anular es la única forma de corregir; nada se borra. -->
<Sheet bind:open title="Anular registro" description={subject}>
	<form id="void-form" class="flex flex-col gap-4 pt-2" onsubmit={submit}>
		{#if consequence}<p class="text-[14px] leading-[19px] text-ink-muted">{consequence}</p>{/if}
		<TextField
			label="Motivo"
			rows={3}
			required
			bind:value={reason}
			hint="Queda guardado junto con tu nombre y la fecha."
			error={touched && invalid ? 'Escribe el motivo de la anulación.' : undefined}
		/>
	</form>
	{#snippet footer()}
		<Button type="submit" form="void-form" variant="danger" size="lg" block>Anular registro</Button>
	{/snippet}
</Sheet>
