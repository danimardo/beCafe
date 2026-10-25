<script lang="ts">
	import type { LayoutProps } from './$types';
	import { BrandMark } from '#lib/ui';

	// Pantallas del visitante sin cuenta (plan F10 D3). Sin navegación de miembro y sobre superficie estable (constitución XVIII).
	let { children }: LayoutProps = $props();
</script>

<div class="min-h-dvh">
	<header class="mx-auto flex w-full max-w-3xl items-center px-4 pt-5">
		<BrandMark />
	</header>
	{@render children()}
</div>
