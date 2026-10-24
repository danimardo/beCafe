<script lang="ts">
	import Droplets from '@lucide/svelte/icons/droplets';
	import Trophy from '@lucide/svelte/icons/trophy';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import type { ResolvedPathname } from '$app/types';
	import { textos } from '#lib/shared/textos';
	import Glass from './Glass.svelte';
	import Button from './Button.svelte';

	type Persona = { nombre: string; hace: string; esPropio: boolean };

	type Props = {
		/** Último relleno vigente de cualquiera (RF-170). `null`: «Sin rellenos registrados». */
		ultimo: Persona | null;
		/** Aguador del mes anterior (RF-176). `null` o sin nombres: la franja no aparece. */
		aguador?: { mes: string; nombres: string; incluyeAlUsuario: boolean } | null;
		/** Sin conexión: el botón se desactiva con una explicación. El relleno nunca va a la cola (RN-081). */
		enConexion?: boolean;
		/** Rechazo del servidor por intervalo (409 RELLENO_RECIENTE, RF-172). Se muestra hasta el siguiente intento. */
		rechazo?: Persona | null;
		/** Identificador del intento, generado en la página. */
		clienteId: string;
		/** Enlace de la acción de envío con JavaScript (`use:enhance`). */
		enhancer?: (formulario: HTMLFormElement) => void;
		/** Destino de «Ver rellenos recientes». Sin destino, el enlace no aparece. */
		historialHref?: ResolvedPathname;
		class?: string;
	};
	let {
		ultimo,
		aguador = null,
		enConexion = true,
		rechazo = null,
		clienteId,
		enhancer = () => {},
		historialHref,
		class: className,
	}: Props = $props();

	const textoUltimo = $derived(ultimo ? textos.rellenos.ultimo(ultimo.nombre, ultimo.hace) : textos.rellenos.sinRellenos);
	const textoRechazo = $derived(
		rechazo
			? rechazo.esPropio
				? textos.rellenos.rellenoPropio(rechazo.hace)
				: textos.rellenos.rellenoDeOtra(rechazo.nombre, rechazo.hace)
			: '',
	);
</script>

<Glass as="section" aria-labelledby="refill-title" class={['flex flex-col gap-3', className].filter(Boolean).join(' ')}>
	<div class="flex items-center gap-3">
		<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true"
			><Droplets class="size-6" /></span
		>
		<div class="min-w-0 flex-1">
			<h2 id="refill-title" class="type-title">{textos.rellenos.titulo}</h2>
			<p class="text-[14px] leading-5 text-ink-muted">{textoUltimo}</p>
		</div>
	</div>

	<form method="post" action="?/rellenar" use:enhancer>
		<input type="hidden" name="clienteId" value={clienteId} />
		<Button
			type="submit"
			variant="soft"
			size="lg"
			block
			disabled={!enConexion}
			aria-describedby={!enConexion ? 'refill-offline' : undefined}
		>
			<Droplets class="size-5" aria-hidden="true" />
			{textos.rellenos.heRellenado}
		</Button>
	</form>

	{#if !enConexion}
		<p id="refill-offline" class="flex items-start gap-2 text-[14px] leading-5 text-ink-muted">
			<WifiOff class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
			<span>{textos.rellenos.sinConexion}</span>
		</p>
	{/if}

	{#if rechazo}
		<p class="flex items-start gap-2 text-[14px] font-medium leading-5" role="alert">
			<TriangleAlert class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
			<span>{textoRechazo}</span>
		</p>
	{/if}

	{#if aguador && aguador.nombres}
		<p class="-mx-1 flex items-center gap-2 rounded-tile bg-accent-soft px-3 py-2 text-[14px] leading-5">
			<Trophy class="size-4 shrink-0 text-accent" aria-hidden="true" />
			<span>
				<b>{textos.rellenos.aguador(aguador.mes, aguador.nombres)}</b>{aguador.incluyeAlUsuario ? ` ${textos.rellenos.tu}` : ''}
			</span>
		</p>
	{/if}

	{#if historialHref}
		<a href={historialHref} class="-mb-1 self-start text-[14px] font-medium text-accent underline-offset-2 hover:underline"
			>{textos.rellenos.verRecientes}</a
		>
	{/if}
</Glass>
