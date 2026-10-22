<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	import type { ResolvedPathname } from '$app/types';

	type Props = { href: ResolvedPathname; label: string };
	let { href, label }: Props = $props();
</script>

<!-- Enlace de vuelta para pantallas de segundo nivel (p. ej. Saldos → Detalle de mi saldo). Va encima de PageHeader. -->
<a
	{href}
	class="-ml-2 mt-1 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-accent hover:bg-accent-soft"
>
	<ChevronLeft class="size-5" aria-hidden="true" />{label}
</a>
