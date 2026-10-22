<script lang="ts">
	import Sheet from './Sheet.svelte';
	import Button from './Button.svelte';
	import Banner from './Banner.svelte';
	import Badge from './Badge.svelte';
	import Money from './Money.svelte';
	import { kindLabels, voidPolicy, type MovementDetail, type Viewer } from './movimientos';

	type Props = {
		open?: boolean;
		movement: MovementDetail | null;
		viewer: Viewer;
		/** Plazo de autoanulación en minutos (RN-032, configurable). */
		graceMinutes: number;
		/** El usuario pulsa «Anular»: abre el diálogo de motivo (VoidDialog) en la pantalla. */
		onvoid: (m: MovementDetail) => void;
		/** El usuario quita de la cola un consumo aún no enviado (RF-063). */
		ondequeue?: (m: MovementDetail) => void;
	};
	let { open = $bindable(false), movement, viewer, graceMinutes, onvoid, ondequeue }: Props = $props();

	const policy = $derived(movement ? voidPolicy(movement, viewer, graceMinutes) : null);
	const descripcion = $derived(movement ? kindLabels[movement.kind] : undefined);
</script>

<!-- RF-112 (origen del movimiento) y RF-062 (quién puede anular y qué ve el resto). PROPUESTO: hoja de detalle al tocar la fila. -->
<Sheet bind:open title={movement ? movement.title : 'Detalle'} description={descripcion}>
	{#if movement}
		<div class="flex flex-col gap-4 pt-1">
			{#if movement.cents !== undefined}
				<p class="type-amount" class:line-through={!!movement.voided} class:opacity-70={!!movement.voided}>
					<Money cents={movement.cents} signed tone={!movement.voided} />
				</p>
			{/if}

			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px] leading-5">
				<dt class="text-ink-muted">Fecha</dt>
				<dd class="text-right font-medium">{movement.at}</dd>
				<dt class="text-ink-muted">Lo hizo</dt>
				<dd class="text-right font-medium">
					{movement.authorName}{#if movement.authorId === viewer.id}
						(tú){/if}
				</dd>
				<dt class="text-ink-muted">Estado</dt>
				<dd class="text-right">
					{#if movement.voided}<Badge tone="neutral">Anulado</Badge>
					{:else if movement.pending}<Badge tone="warning">Pendiente de enviar</Badge>
					{:else}<Badge tone="positive">Vigente</Badge>{/if}
				</dd>
			</dl>

			{#if movement.origin}
				<div class="border-t border-hairline pt-3">
					<h3 class="type-eyebrow mb-1 text-ink-muted">De dónde viene</h3>
					<p class="text-[15px] leading-5">{movement.origin}</p>
				</div>
			{/if}

			{#if movement.voided}
				<div class="border-t border-hairline pt-3">
					<h3 class="type-eyebrow mb-1 text-ink-muted">Anulación</h3>
					<p class="text-[15px] leading-5">{movement.voided.by} · {movement.voided.at}</p>
					<p class="text-[14px] leading-[19px] text-ink-muted">Motivo: {movement.voided.reason}</p>
				</div>
			{/if}

			{#if policy?.action === 'none'}
				<Banner tone="info">{policy.message}</Banner>
			{/if}
		</div>
	{/if}
	{#snippet footer()}
		{#if movement && policy?.action === 'void'}
			<Button
				variant="danger"
				size="lg"
				block
				onclick={() => {
					open = false;
					onvoid(movement);
				}}>Anular este registro</Button
			>
		{:else if movement && policy?.action === 'dequeue'}
			<Button
				variant="soft"
				size="lg"
				block
				onclick={() => {
					open = false;
					ondequeue?.(movement);
				}}>Quitar de la cola sin enviar</Button
			>
		{:else}
			<Button variant="soft" size="lg" block onclick={() => (open = false)}>Cerrar</Button>
		{/if}
	{/snippet}
</Sheet>
