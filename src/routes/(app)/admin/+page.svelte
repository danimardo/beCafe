<script lang="ts">
	import { resolve } from '$app/paths';
	import { PageHeader, Section, ListRow } from '#lib/ui';
	import type { PageProps } from './$types';
	import { textos } from '#lib/shared/textos';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{textos.admin.titulo} · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title={textos.admin.titulo} />
	<Section>
		<ul class="flex flex-col">
			<ListRow title={textos.capsulas.titulo} subtitle={textos.capsulas.ayuda} href={resolve('/(app)/admin/capsulas')} />
			<ListRow title={textos.admin.titulo} subtitle={textos.admin.ayuda} href={resolve('/(app)/admin/usuarios')} />
			<ListRow title={textos.economia.enlaceControl} href={resolve('/(app)/admin/control')} />
			<ListRow
				title={textos.visitantes.tituloAdmin}
				subtitle={data.cafesVisitantePendientes > 0
					? textos.notificaciones.cafeVisitantePendiente.texto(data.cafesVisitantePendientes)
					: textos.visitantes.sinPendientes}
				href={resolve('/(app)/admin/visitantes')}
			/>
			<ListRow title={textos.copias.titulo} subtitle={textos.copias.ayuda} href={resolve('/(app)/admin/copias')} />
			<ListRow title={textos.configuracion.titulo} subtitle={textos.configuracion.ayuda} href={resolve('/(app)/admin/configuracion')} />
		</ul>
	</Section>
</div>
