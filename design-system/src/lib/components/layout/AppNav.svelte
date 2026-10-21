<script lang="ts">
	import BrandMark from './BrandMark.svelte';
	import { page } from '$app/state';
	import Avatar from '../ui/Avatar.svelte';
	import { cn } from '#lib/utils';
	import type { NavItem } from './types';

	type Props = {
		items: NavItem[];
		/** Solo para administradores: se muestra en la barra lateral (escritorio). En móvil se entra desde Perfil. */
		adminItems?: NavItem[];
		user: { name: string; role: 'miembro' | 'administrador' };
	};
	let { items, adminItems = [], user }: Props = $props();

	const isActive = (item: NavItem) =>
		item.href === '/'
			? page.url.pathname === '/'
			: [item.href, ...(item.alsoActive ?? [])].some((h) => page.url.pathname.startsWith(h));
</script>

<!-- MÓVIL: píldora flotante de cristal con las 5 secciones. -->
<nav
	aria-label="Principal"
	class="glass-strong fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex rounded-full p-1.5 md:hidden"
>
	{#each items as item (item.href)}
		{@const active = isActive(item)}
		<a
			href={item.href}
			aria-current={active ? 'page' : undefined}
			class={cn(
				'flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium leading-[13px] motion-safe:transition',
				active ? 'bg-accent-soft text-accent' : 'text-ink-muted'
			)}
		>
			<item.icon class="size-[22px]" aria-hidden="true" />
			{item.label}
		</a>
	{/each}
</nav>

<!-- ESCRITORIO (md+): barra lateral de cristal, con el bloque de administración. -->
<aside class="glass-strong fixed inset-y-3 left-3 z-40 hidden w-60 flex-col rounded-sheet p-4 md:flex">
	<a href="/" class="mb-5 flex px-2 py-1" aria-label="beCafé, inicio"><BrandMark /></a>
	<nav aria-label="Principal" class="flex flex-col gap-1">
		{#each items as item (item.href)}
			{@const active = isActive(item)}
			<a
				href={item.href}
				aria-current={active ? 'page' : undefined}
				class={cn(
					'flex min-h-11 items-center gap-3 rounded-tile px-3 text-[15px] font-medium motion-safe:transition',
					active ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-accent-soft'
				)}
			>
				<item.icon class="size-5" aria-hidden="true" />
				{item.label}
			</a>
		{/each}
	</nav>
	{#if adminItems.length}
		<p class="type-eyebrow mb-1 mt-6 px-3 text-ink-muted">Administración</p>
		<nav aria-label="Administración" class="flex flex-col gap-1">
			{#each adminItems as item (item.href)}
				{@const active = isActive(item)}
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					class={cn(
						'flex min-h-11 items-center gap-3 rounded-tile px-3 text-[15px] font-medium motion-safe:transition',
						active ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-accent-soft'
					)}
				>
					<item.icon class="size-5" aria-hidden="true" />
					{item.label}
				</a>
			{/each}
		</nav>
	{/if}
	<a href="/perfil" class="mt-auto flex items-center gap-3 rounded-tile px-2 py-2 hover:bg-accent-soft">
		<Avatar name={user.name} size="md" />
		<span class="min-w-0">
			<span class="block truncate text-[15px] font-semibold leading-5">{user.name}</span>
			<span class="block text-[13px] capitalize leading-[18px] text-ink-muted">{user.role}</span>
		</span>
	</a>
</aside>
