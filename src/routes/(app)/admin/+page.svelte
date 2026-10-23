<script lang="ts">
	import { resolve } from '$app/paths';
	import { PageHeader, Section, ListRow } from '#lib/ui';
	import { textos } from '#lib/shared/textos';
</script>

<svelte:head>
	<title>{textos.admin.titulo} · beCafé</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
	<PageHeader title={textos.admin.titulo} />
	<Section>
		<ul class="flex flex-col">
			<ListRow title={textos.capsulas.titulo} subtitle={textos.capsulas.ayuda} href={resolve('/(app)/admin/capsulas')} />
			<ListRow title={textos.admin.titulo} subtitle={textos.admin.ayuda} href={resolve('/(app)/admin/usuarios')} />
			<ListRow title={textos.economia.enlaceControl} href={resolve('/(app)/admin/control')} />
		</ul>
	</Section>
</main>
