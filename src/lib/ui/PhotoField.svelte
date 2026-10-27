<script lang="ts">
	import Camera from '@lucide/svelte/icons/camera';
	import { cn } from './utils';

	type Props = {
		label: string;
		/** Archivo elegido (bindable). */
		file?: File | null;
		/** Nombre del campo del formulario: sin él, la foto no se envía sin JavaScript (constitución XVII). */
		name?: string;
		hint?: string;
		/** RF-005: el servidor valida de verdad (tipo real, 5 MB). Esto es solo un aviso temprano. */
		maxBytes?: number;
		class?: string;
	};
	let { label, file = $bindable(null), name, hint, maxBytes = 5 * 1024 * 1024, class: className }: Props = $props();
	let entrada: HTMLInputElement | undefined = $state();

	const uid = $props.id();
	const id = `ph-${uid}`;
	let error = $state('');
	let previewUrl = $state<string | null>(null);

	function onpick(e: Event) {
		const f = e.currentTarget instanceof HTMLInputElement ? (e.currentTarget.files?.[0] ?? null) : null;
		error = '';
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		if (!f) {
			file = null;
			return;
		}
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
			error = 'Elige una foto JPEG, PNG o WebP.';
			file = null;
			return;
		}
		if (f.size > maxBytes) {
			error = `La foto pesa más de ${Math.round(maxBytes / 1024 / 1024)} MB.`;
			file = null;
			return;
		}
		file = f;
		previewUrl = URL.createObjectURL(f);
	}
	function clear() {
		file = null;
		if (entrada) entrada.value = '';
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<span class="text-[13px] font-semibold leading-[18px] text-ink" id="{id}-l">{label}</span>
	<div class="flex items-center gap-3 rounded-tile border-[1.5px] border-dashed border-ink-muted/75 p-3">
		{#if previewUrl}
			<img src={previewUrl} alt="Vista previa de la foto elegida" class="size-14 rounded-chip object-cover" />
			<span class="min-w-0 flex-1 truncate text-[14px]">{file?.name}</span>
			<button type="button" class="min-h-11 rounded-full px-3 text-[14px] font-semibold text-accent" onclick={clear}>Quitar</button>
		{:else}
			<label for={id} class="flex min-h-11 flex-1 cursor-pointer items-center gap-3 text-[15px] font-medium text-ink">
				<Camera class="size-5 text-accent" aria-hidden="true" />
				<span>Hacer o elegir foto</span>
			</label>
		{/if}
		<!-- Con la vista previa, la etiqueta «Hacer o elegir foto» desaparece: el campo sigue nombrado por el título del campo. -->
		<input
			{id}
			bind:this={entrada}
			{name}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			class="sr-only"
			onchange={onpick}
			aria-labelledby={previewUrl ? `${id}-l` : undefined}
			aria-describedby={hint ? `${id}-h` : undefined}
		/>
	</div>
	{#if hint}<p id="{id}-h" class="text-[13px] leading-[18px] text-ink-muted">{hint}</p>{/if}
	{#if error}<p role="alert" class="text-[13px] font-medium leading-[18px] text-negative">{error}</p>{/if}
</div>
