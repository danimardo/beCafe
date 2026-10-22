<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { cn } from './utils';

	type Props = { steps: string[]; /** Índice del paso actual, desde 0. */ current: number; class?: string };
	let { steps, current, class: className }: Props = $props();
</script>

<ol class={cn('flex items-center gap-2', className)} aria-label="Progreso">
	{#each steps as step, i (step)}
		<li class="flex flex-1 items-center gap-2" aria-current={i === current ? 'step' : undefined}>
			<span
				class={cn(
					'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
					i < current && 'bg-accent text-on-accent',
					i === current && 'border-2 border-accent text-accent',
					i > current && 'border-2 border-ink-muted/75 text-ink-muted',
				)}
			>
				{#if i < current}<Check class="size-4" aria-hidden="true" /><span class="sr-only">Completado: </span>{:else}{i + 1}{/if}
			</span>
			<span class={cn('truncate text-[13px] font-medium', i === current ? 'text-ink' : 'text-ink-muted')}>{step}</span>
			{#if i < steps.length - 1}<span class="h-px flex-1 bg-hairline" aria-hidden="true"></span>{/if}
		</li>
	{/each}
</ol>
