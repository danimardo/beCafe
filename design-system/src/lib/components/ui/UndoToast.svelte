<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import CapsuleImage from '../capsulas/CapsuleImage.svelte';
	import type { UndoToastData } from '#lib/toast.svelte';

	type Props = { toast: UndoToastData; onclose: () => void };
	let { toast, onclose }: Props = $props();

	// RF-013: el aviso dura 5 s. Se pausa al pasar el puntero o al enfocar (WCAG 2.2.1, tiempo ajustable).
	const total = $derived(toast.duration ?? 5000);
	let remaining = 0;
	let startedAt = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let paused = $state(false);

	function start() {
		startedAt = performance.now();
		paused = false;
		clearTimeout(timer);
		timer = setTimeout(onclose, remaining);
	}
	function pause() {
		if (paused) return;
		clearTimeout(timer);
		remaining -= performance.now() - startedAt;
		paused = true;
	}
	$effect(() => {
		remaining = total;
		start();
		return () => clearTimeout(timer);
	});
</script>

<div
	role="group"
	aria-label={toast.onundo ? 'Registro hecho' : 'Aviso'}
	class="animate-toast-in glass-strong pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-[28px] py-2 pl-3 pr-2"
	onpointerenter={pause}
	onpointerleave={start}
	onfocusin={pause}
	onfocusout={start}
>
	{#if toast.kind === 'ok' || toast.kind === 'warning'}
		<span
			class={['flex size-9 shrink-0 items-center justify-center rounded-full', toast.kind === 'ok' ? 'bg-positive-soft text-positive' : 'bg-warning-soft text-warning'].join(' ')}
			aria-hidden="true"
		>
			{#if toast.kind === 'ok'}<Check class="size-5" />{:else}<TriangleAlert class="size-5" />{/if}
		</span>
	{:else}
		<CapsuleImage name={toast.title} color={toast.color ?? '#3b2a6b'} photoUrl={toast.photoUrl} size="sm" />
	{/if}
	<div class="min-w-0 flex-1 text-[14px] leading-[18px]">
		<p class="truncate font-semibold">{toast.title}</p>
		{#if toast.detail}<p class="truncate text-[13px] text-ink-muted">{toast.detail}</p>{/if}
		{#if toast.warning}
			<p class="mt-0.5 flex items-start gap-1 text-[13px] font-medium leading-[17px] text-warning">
				<TriangleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{toast.warning}</span>
			</p>
		{/if}
	</div>
	{#if toast.onundo}
		<button
			type="button"
			class="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-4 text-[15px] font-semibold text-on-accent"
			onclick={() => {
				toast.onundo?.();
				onclose();
			}}
		>
			<Undo2 class="size-4" aria-hidden="true" /> Deshacer
		</button>
	{:else}
		<button
			type="button"
			class="inline-flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-accent-soft"
			aria-label="Cerrar aviso"
			onclick={onclose}
		>
			<X class="size-5" aria-hidden="true" />
		</button>
	{/if}
	<!-- Barra de tiempo restante: decorativa -->
	<span
		aria-hidden="true"
		class="absolute inset-x-6 bottom-0 h-0.5 origin-left rounded-full bg-accent/60"
		style="animation: toast-timer {total}ms linear forwards; animation-play-state: {paused ? 'paused' : 'running'};"
	></span>
</div>

<style>
	@keyframes toast-timer {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		span[aria-hidden='true'] {
			animation: none !important;
		}
	}
</style>
