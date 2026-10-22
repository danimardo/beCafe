<script lang="ts">
	import { cn } from './utils';
	import { initials } from '#lib/shared/texto';

	type Props = { name: string; size?: 'sm' | 'md'; class?: string };
	let { name, size = 'sm', class: className }: Props = $props();
</script>

<!-- Decorativo: el nombre completo siempre aparece como texto al lado. -->
<span
	aria-hidden="true"
	class={cn(
		'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-ink',
		size === 'sm' ? 'size-9 text-[13px]' : 'size-11 text-[15px]',
		className,
	)}>{initials(name)}</span
>
