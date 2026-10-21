<script lang="ts">
	import EmptyState from '../ui/EmptyState.svelte';
	import Glass from '../ui/Glass.svelte';
	import VoidDialog from '../ui/VoidDialog.svelte';
	import MovementRow from './MovementRow.svelte';
	import MovementDetailSheet from './MovementDetailSheet.svelte';
	import { toasts } from '#lib/toast.svelte';
	import { voidConsequence, type MovementDetail, type Viewer } from '#lib/movements';

	type Props = {
		/** Movimientos a mostrar (ya filtrados y paginados). Al anular, se marca `voided` en el elemento. */
		items: MovementDetail[];
		viewer: Viewer;
		/** Plazo de autoanulación en minutos (RN-032). */
		graceMinutes: number;
		/** Se llama tras confirmar una anulación, con el id y el motivo; aquí iría la petición al servidor. */
		onvoided?: (id: string, reason: string) => void;
		emptyTitle?: string;
		emptyDescription?: string;
	};
	let { items, viewer, graceMinutes, onvoided, emptyTitle = 'No hay movimientos', emptyDescription = 'Prueba con otro filtro o muestra los anulados.' }: Props = $props();

	// Detalle y anulación (RF-062, RF-112). El servidor vuelve a comprobar permisos y plazo.
	let detail = $state<MovementDetail | null>(null);
	let detailOpen = $state(false);
	let voidTarget = $state<MovementDetail | null>(null);
	let voidOpen = $state(false);

	function confirmVoid(reason: string) {
		if (!voidTarget) return;
		onvoided?.(voidTarget.id, reason);
		toasts.showUndo({
			title: 'Registro anulado',
			detail: voidTarget.kind === 'relleno' ? 'Ya no cuenta en el ranking.' : 'Ya no cuenta en saldos ni stock.',
			kind: 'ok',
			onundo: () => {}
		});
	}
</script>

<Glass as="div" class="py-1">
	{#if items.length}
		<ul class="divide-y divide-hairline">
			{#each items as m (m.id)}
				<MovementRow
					kind={m.kind}
					title={m.title}
					subtitle={m.subtitle ?? `${m.at} · ${m.authorName}`}
					cents={m.cents}
					voided={!!m.voided}
					pending={m.pending}
					onclick={() => {
						detail = m;
						detailOpen = true;
					}}
				/>
			{/each}
		</ul>
	{:else}
		<EmptyState title={emptyTitle} description={emptyDescription} />
	{/if}
</Glass>

<MovementDetailSheet
	bind:open={detailOpen}
	movement={detail}
	{viewer}
	{graceMinutes}
	onvoid={(m) => {
		voidTarget = m;
		voidOpen = true;
	}}
/>
<VoidDialog
	bind:open={voidOpen}
	subject={voidTarget ? `${voidTarget.title} · ${voidTarget.at}` : ''}
	consequence={voidTarget ? voidConsequence(voidTarget) : undefined}
	onconfirm={confirmVoid}
/>
