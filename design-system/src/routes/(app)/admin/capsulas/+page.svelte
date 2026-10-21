<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash';
	import { Badge, Button, CapsuleImage, ColorField, ConfirmDialog, Glass, IconButton, ListRow, PageHeader, PhotoField, Sheet, StockBadge, TextField } from '#lib';
	import { capsules as initial, type CapsuleType } from '#lib/mock';

	let items = $state<CapsuleType[]>(structuredClone(initial));
	let formOpen = $state(false);
	let editing = $state<CapsuleType | null>(null);
	let removeTarget = $state<CapsuleType | null>(null);
	let removeOpen = $state(false);

	// Campos del formulario (RF-001)
	let name = $state('');
	let brand = $state('');
	let intensity = $state('');
	let threshold = $state('10');
	let color = $state('#3b2a6b');
	let photo = $state<File | null>(null);
	let submitted = $state(false);

	const nameTaken = $derived(items.some((c) => c.active && c.id !== editing?.id && c.name.toLowerCase() === name.trim().toLowerCase())); // RF-002

	function openNew() {
		editing = null;
		name = brand = intensity = '';
		threshold = '10';
		color = '#3b2a6b';
		photo = null;
		submitted = false;
		formOpen = true;
	}
	function openEdit(c: CapsuleType) {
		editing = c;
		name = c.name;
		brand = c.brand;
		intensity = c.intensity?.toString() ?? '';
		threshold = String(c.threshold);
		color = c.color;
		photo = null;
		submitted = false;
		formOpen = true;
	}
	function save(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (!name.trim() || nameTaken) return;
		formOpen = false;
	}
	function toggleActive(c: CapsuleType) {
		c.active = !c.active; // RF-004: retirar / volver a activar
	}
	function askRemove(c: CapsuleType) {
		removeTarget = c;
		removeOpen = true;
	}
</script>

<PageHeader eyebrow="Administración" title="Cápsulas">
	{#snippet actions()}<Button onclick={openNew}><Plus class="size-4" aria-hidden="true" /> Nuevo tipo</Button>{/snippet}
</PageHeader>

<Glass as="div" class="py-1">
	<ul class="divide-y divide-hairline">
		{#each items as c (c.id)}
			<ListRow title={c.name} subtitle="{c.brand}{c.intensity ? ` · Int. ${c.intensity}` : ''} · umbral {c.threshold}" stackTrailing>
				{#snippet leading()}<CapsuleImage name={c.name} color={c.color} photoUrl={c.photoUrl} size="md" />{/snippet}
				{#snippet trailing()}
					<span class="flex flex-wrap items-center justify-end gap-2">
						{#if !c.active}<Badge tone="neutral">Retirada</Badge>
						{:else if c.stock <= 0}<StockBadge level="out" />
						{:else if c.stock <= c.threshold}<StockBadge level="low" />{/if}
						<span class="hidden text-[15px] font-semibold tabular-nums sm:inline">{c.stock} uds</span>
						<IconButton label="Editar {c.name}" variant="ghost" onclick={() => openEdit(c)}><Pencil class="size-[18px]" aria-hidden="true" /></IconButton>
						<Button variant="soft" onclick={() => toggleActive(c)}>{c.active ? 'Retirar' : 'Activar'}</Button>
						{#if !c.hasRecords}
							<!-- RF-006: solo se puede borrar un tipo sin registros. Con registros, solo retirar. -->
							<IconButton label="Borrar {c.name}" variant="ghost" onclick={() => askRemove(c)}><Trash class="size-[18px] text-negative" aria-hidden="true" /></IconButton>
						{/if}
					</span>
				{/snippet}
			</ListRow>
		{/each}
	</ul>
</Glass>

<Sheet bind:open={formOpen} title={editing ? 'Editar tipo' : 'Nuevo tipo de cápsula'} description={editing ? 'Editar no cambia el stock ni el coste medio.' : 'No aparecerá en la pantalla principal hasta que se compre por primera vez.'}>
	<form id="capsule-form" class="flex flex-col gap-4 pt-2" onsubmit={save}>
		<TextField label="Nombre" bind:value={name} required error={submitted && !name.trim() ? 'Escribe un nombre.' : submitted && nameTaken ? 'Ya existe un tipo activo con ese nombre.' : undefined} />
		<TextField label="Marca" bind:value={brand} />
		<div class="grid grid-cols-2 gap-3">
			<TextField label="Intensidad (1–13)" type="number" inputmode="numeric" min="1" max="13" bind:value={intensity} hint="Opcional." />
			<TextField label="Umbral mínimo" type="number" inputmode="numeric" min="0" bind:value={threshold} hint="Avisa al llegar a este stock." />
		</div>
		<ColorField label="Color" bind:value={color} />
		<PhotoField label="Foto" bind:file={photo} hint="JPEG, PNG o WebP de hasta 5 MB. Sin foto se dibuja la cápsula con su color." />
	</form>
	{#snippet footer()}<Button type="submit" form="capsule-form" size="lg" block>{editing ? 'Guardar cambios' : 'Crear tipo'}</Button>{/snippet}
</Sheet>

<ConfirmDialog
	bind:open={removeOpen}
	title="¿Borrar {removeTarget?.name}?"
	description="Este tipo no tiene registros, así que se puede borrar del todo. No se puede deshacer."
	confirmLabel="Borrar"
	tone="danger"
	onconfirm={() => (items = items.filter((c) => c.id !== removeTarget?.id))}
/>
