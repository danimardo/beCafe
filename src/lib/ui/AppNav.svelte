<script lang="ts">
	import BrandMark from './BrandMark.svelte';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import Avatar from './Avatar.svelte';
	import { cn } from './utils';
	import type { NavItem } from './types';

	type Props = {
		items: NavItem[];
		/** Solo para administradores: se muestra en la barra lateral (escritorio). En móvil se entra desde Perfil. */
		adminItems?: NavItem[];
		user: { name: string; role: 'miembro' | 'administrador'; id?: string; fotoUrl?: string | null };
		/** Destinos de la marca y del perfil, ya resueltos con `resolve()`. Sin destino, el elemento no es un enlace. */
		inicioHref?: ResolvedPathname;
		perfilHref?: ResolvedPathname;
	};
	let { items, adminItems = [], user, inicioHref, perfilHref }: Props = $props();

	const isActive = (item: NavItem) =>
		item.href === '/' ? page.url.pathname === '/' : [item.href, ...(item.alsoActive ?? [])].some((h) => page.url.pathname.startsWith(h));

	// Carril (md–lg): icono arriba y etiqueta corta debajo. Barra completa (lg+): icono y etiqueta en fila.
	const link = (active: boolean) =>
		cn(
			'flex min-h-11 flex-col items-center justify-center gap-1 rounded-tile px-1 py-2 text-[11px] font-medium leading-[13px] motion-safe:transition',
			'lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-0 lg:text-[15px] lg:leading-5',
			active ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-accent-soft',
		);
</script>

<!-- MÓVIL: píldora flotante de cristal con las 5 secciones. -->
<nav
	aria-label="Principal"
	data-tour="navegacion"
	data-sveltekit-preload-data="tap"
	class="glass-strong fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex rounded-full p-1.5 md:hidden"
>
	{#each items as item (item.href)}
		{@const active = isActive(item)}
		<a
			href={item.href}
			aria-current={active ? 'page' : undefined}
			class={cn(
				'flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium leading-[13px] motion-safe:transition',
				active ? 'bg-accent-soft text-accent' : 'text-ink-muted',
			)}
		>
			<item.icon class="size-[22px]" aria-hidden="true" />
			{item.label}
		</a>
	{/each}
</nav>

<!-- TABLETA (md–lg): carril de 96 px. ESCRITORIO (lg+): barra lateral de 240 px con el bloque de administración. -->
<aside
	data-sveltekit-preload-data="tap"
	class="glass-strong fixed inset-y-3 left-3 z-40 hidden w-24 flex-col overflow-y-auto rounded-sheet p-2 md:flex lg:w-60 lg:p-4"
>
	{#if inicioHref}
		<a href={inicioHref} class="mb-4 flex justify-center px-2 py-1 lg:mb-5 lg:justify-start">
			<span class="lg:hidden"><BrandMark wordmark={false} /></span>
			<span class="hidden lg:inline"><BrandMark /></span>
		</a>
	{:else}
		<div class="mb-4 flex justify-center px-2 py-1 lg:mb-5 lg:justify-start">
			<span class="lg:hidden"><BrandMark wordmark={false} /></span>
			<span class="hidden lg:inline"><BrandMark /></span>
		</div>
	{/if}
	<nav aria-label="Principal" data-tour="navegacion" class="flex flex-col gap-1">
		{#each items as item (item.href)}
			{@const active = isActive(item)}
			<a href={item.href} aria-current={active ? 'page' : undefined} class={link(active)}>
				<item.icon class="size-[22px] lg:size-5" aria-hidden="true" />
				<span class="max-w-full truncate">{item.label}</span>
			</a>
		{/each}
	</nav>
	{#if adminItems.length}
		<p class="type-eyebrow mb-1 mt-6 hidden px-3 text-ink-muted lg:block">Administración</p>
		<hr class="mx-2 my-3 border-hairline lg:hidden" />
		<nav aria-label="Administración" class="flex flex-col gap-1">
			{#each adminItems as item (item.href)}
				{@const active = isActive(item)}
				<a href={item.href} aria-current={active ? 'page' : undefined} class={link(active)} title={item.label}>
					<item.icon class="size-[22px] lg:size-5" aria-hidden="true" />
					<span class="max-w-full truncate lg:hidden">{item.short ?? item.label}</span>
					<span class="hidden lg:inline">{item.label}</span>
				</a>
			{/each}
		</nav>
	{/if}
	{#snippet cuenta()}
		<Avatar name={user.name} usuarioId={user.id} fotoUrl={user.fotoUrl} size="md" />
		<span class="sr-only min-w-0 lg:not-sr-only lg:block">
			<span class="block truncate text-[15px] font-semibold leading-5"><span class="sr-only">Tu perfil:</span> {user.name}</span>
			<span aria-hidden="true" class="block text-[13px] capitalize leading-[18px] text-ink-muted">{user.role}</span>
		</span>
	{/snippet}
	{#if perfilHref}
		<a
			href={perfilHref}
			class="mt-auto flex flex-col items-center gap-1 rounded-tile px-1 py-2 hover:bg-accent-soft lg:flex-row lg:gap-3 lg:px-2"
		>
			{@render cuenta()}
		</a>
	{:else}
		<div class="mt-auto flex flex-col items-center gap-1 rounded-tile px-1 py-2 lg:flex-row lg:gap-3 lg:px-2">
			{@render cuenta()}
		</div>
	{/if}
</aside>
