<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { Badge, Banner, Button, Glass, ListRow, PageHeader, SegmentedControl, Section, Sheet, TextField } from '#lib';
	import { backups, daysSinceRestoreTest } from '#lib/mock';

	let open = $state(false);
	let result = $state<'ok' | 'fallo'>('ok');
	let note = $state('');
</script>

<PageHeader eyebrow="Administración" title="Copias de seguridad">
	{#snippet actions()}<Button variant="soft" onclick={() => (open = true)}>Registrar prueba</Button>{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3">
	{#if daysSinceRestoreTest > 100}
		<Banner tone="warning" title="Prueba de restauración pendiente">Han pasado {daysSinceRestoreTest} días desde la última. Se recomienda una cada trimestre.</Banner>
	{/if}
	{#if backups.some((b) => !b.ok)}
		<Banner tone="negative" title="Hay copias fallidas">Revisa el error de la copia del 18 oct y los logs en Coolify.</Banner>
	{/if}
</div>

<Glass as="div" class="py-1">
	<ul class="divide-y divide-hairline">
		{#each backups as b (b.id)}
			<ListRow title={b.at} subtitle={b.ok ? `Copia correcta · ${b.size}` : b.error}>
				{#snippet leading()}
					{#if b.ok}<CircleCheck class="size-6 text-positive" aria-hidden="true" />{:else}<CircleAlert class="size-6 text-negative" aria-hidden="true" />{/if}
				{/snippet}
				{#snippet trailing()}<Badge tone={b.ok ? 'positive' : 'negative'}>{b.ok ? 'Correcta' : 'Fallida'}</Badge>{/snippet}
			</ListRow>
		{/each}
	</ul>
</Glass>

<Section title="Última prueba de restauración">
	<Glass as="div">
		<p class="text-[15px] leading-5">Hace <b>{daysSinceRestoreTest} días</b> · resultado: correcta</p>
		<p class="text-[13px] leading-[18px] text-ink-muted">Restaurar = descargar el archivo del bucket, parar la app, sustituir /data, arrancar y verificar saldos.</p>
	</Glass>
</Section>

<Sheet bind:open title="Registrar prueba de restauración" description="Anota el resultado de la última prueba que hiciste.">
	<form id="restore" class="flex flex-col gap-4 pt-2" onsubmit={(e) => { e.preventDefault(); open = false; }}>
		<SegmentedControl bind:value={result} label="Resultado" options={[{ value: 'ok', label: 'Correcta' }, { value: 'fallo', label: 'Con fallos' }]} />
		<TextField label="Notas" rows={3} bind:value={note} hint="Qué copia usaste y qué verificaste." />
	</form>
	{#snippet footer()}<Button type="submit" form="restore" size="lg" block>Guardar resultado</Button>{/snippet}
</Sheet>
