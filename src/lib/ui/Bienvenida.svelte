<script lang="ts">
	import Award from '@lucide/svelte/icons/award';
	import Coffee from '@lucide/svelte/icons/coffee';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Hand from '@lucide/svelte/icons/hand';
	import Package from '@lucide/svelte/icons/package';
	import PiggyBank from '@lucide/svelte/icons/piggy-bank';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Wallet from '@lucide/svelte/icons/wallet';
	import type { ResolvedPathname } from '$app/types';
	import { Dialog } from 'bits-ui';
	import { ESCENAS_BIENVENIDA, type IconoBienvenida } from '#lib/shared/mascota/bienvenida';
	import Button from './Button.svelte';
	import { buttonClasses } from './utils';
	import Capsulito from './Capsulito.svelte';
	import { usarMascota } from './contextos/mascota.svelte';

	type Props = {
		/** Nombre de pila de quien entra, para el saludo. Vacío antes de entrar. */
		nombre?: string;
		/** `antesDeEntrar` (RF-195): empieza con «Empezar» y termina con «Entrar» o «Soy visitante». */
		modo?: 'autenticada' | 'antesDeEntrar';
		/** En `antesDeEntrar`: se llegó con un enlace de visitante. */
		visitante?: boolean;
		/** En `antesDeEntrar` con enlace: destino de «Entrar» (la pantalla de acceso). */
		hrefEntrar?: ResolvedPathname;
	};
	let { nombre = '', modo = 'autenticada', visitante = false, hrefEntrar }: Props = $props();
	const antes = $derived(modo === 'antesDeEntrar');
	// «Empezar» es el gesto que permite reproducir audio (política de reproducción automática de los navegadores).
	let empezada = $state(false);
	const mascota = usarMascota();

	const iconos: Record<IconoBienvenida, typeof Hand> = {
		hand: Hand,
		package: Package,
		coffee: Coffee,
		'shopping-bag': ShoppingBag,
		'piggy-bank': PiggyBank,
		droplets: Droplets,
		award: Award,
		sparkles: Sparkles,
		wallet: Wallet,
	};
	const escenas = ESCENAS_BIENVENIDA.map((escena) => ({ ...escena, icon: iconos[escena.icono] }));
	let paso = $state(0);
	const actual = $derived(escenas[paso] ?? escenas[0]);
	const ultimo = $derived(paso === escenas.length - 1);

	// Se abre sola la primera vez (mascota.bienvenidaVista = false y mascota.visible = true). Cerrarla la marca como vista.
	let open = $state(false);
	$effect(() => {
		const abrir = mascota.visible && !mascota.bienvenidaVista;
		open = abrir;
		if (abrir) paso = 0;
	});

	// Cuando cambia de escena con el diálogo abierto y la voz activa, reproduce la locución de la escena (`intro_01..08`).
	$effect(() => {
		if (open && mascota.vozActiva && (!antes || empezada)) {
			mascota.hablar(actual.id, true);
		}
	});

	function cerrar() {
		open = false;
		mascota.marcarBienvenidaVista();
	}

	function alternarVoz() {
		const nuevo = !mascota.vozActiva;
		mascota.setVozActiva(nuevo);
		if (nuevo && (!antes || empezada)) {
			mascota.hablar(actual.id, true);
		}
	}

	function empezar() {
		empezada = true;
		if (mascota.vozActiva) mascota.hablar(actual.id, true);
	}
</script>

{#snippet iconoGrande()}
	{#if actual}
		<span class="flex size-40 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
			<actual.icon class="size-16" />
		</span>
	{/if}
{/snippet}

<Dialog.Root bind:open onOpenChange={(v) => !v && cerrar()}>
	<Dialog.Portal>
		<Dialog.Overlay class="animate-fade-in fixed inset-0 z-50 bg-scrim" />
		<Dialog.Content
			class="animate-sheet-in glass-strong fixed inset-0 z-50 flex flex-col overflow-y-auto items-center rounded-none px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:inset-auto md:max-h-[90dvh] md:rounded-sheet md:pt-5 text-center text-ink md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:pb-6"
		>
			<div class="mb-2 flex w-full items-center justify-between gap-2">
				<span class="text-[13px] font-medium text-ink-muted">
					{#if !antes || empezada}Escena {paso + 1} de {escenas.length}{/if}
				</span>
				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={alternarVoz}
						aria-pressed={mascota.vozActiva}
						aria-label={mascota.vozActiva ? 'Silenciar voz' : 'Activar voz'}
						class="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-ink hover:brightness-95"
					>
						{#if mascota.vozActiva}
							<Volume2 class="size-5 text-accent" aria-hidden="true" />
						{:else}
							<VolumeX class="size-5 text-ink-muted" aria-hidden="true" />
						{/if}
					</button>
					{#if !ultimo && (!antes || empezada)}
						<Button variant="ghost" onclick={cerrar}>Saltar</Button>
					{/if}
				</div>
			</div>

			<!-- En móvil la hoja ocupa toda la pantalla y su contenido queda centrado en vertical. -->
			<div class="flex w-full flex-1 flex-col items-center justify-center">
				{#if antes && !empezada}
					<Capsulito momento="acceso-hola" size="xl" mensaje={null} />
					<Dialog.Title class="type-title-lg mt-4">Conoce a Capsulito</Dialog.Title>
					<Dialog.Description class="mt-2 max-w-xs text-[15px] leading-5 text-ink-muted">
						Te cuento en un minuto cómo funciona beCafé. Si activas la voz, Capsulito te lo cuenta en alto.
					</Dialog.Description>
					<div class="mt-5 grid w-full grid-cols-1 gap-3">
						<Button size="lg" onclick={empezar}>Empezar</Button>
						<Button variant="ghost" onclick={cerrar}>Saltar</Button>
					</div>
				{:else}
					{#if actual}
						{#key paso}
							<Capsulito
								momento={actual.momento}
								poseRiv={actual.poseRiv}
								expresion={actual.expresion}
								{nombre}
								size="xl"
								bocadillo="arriba"
								fallback={iconoGrande}
							/>
						{/key}
						<Dialog.Title class="type-title-lg mt-4">{actual.titulo}</Dialog.Title>
						<Dialog.Description class="mt-2 max-w-xs text-[15px] leading-5 text-ink-muted">
							{actual.texto}
						</Dialog.Description>
					{/if}

					<div class="mt-4 flex gap-1.5" role="img" aria-label="Paso {paso + 1} de {escenas.length}">
						{#each escenas as escena, i (escena.id)}
							<span class={['h-2 rounded-full motion-safe:transition-all', i === paso ? 'w-6 bg-accent' : 'w-2 bg-ink-muted/40'].join(' ')}
							></span>
						{/each}
					</div>

					<div class={['mt-5 grid w-full gap-3', paso > 0 && !(antes && ultimo && visitante) ? 'grid-cols-2' : 'grid-cols-1'].join(' ')}>
						{#if paso > 0}
							<Button variant="soft" size="lg" onclick={() => (paso = Math.max(0, paso - 1))}>Anterior</Button>
						{/if}
						{#if ultimo && antes}
							{#if visitante}
								<Button size="lg" onclick={cerrar}>Soy visitante</Button>
								{#if hrefEntrar}<a href={hrefEntrar} class={buttonClasses('soft', 'lg')}>Entrar</a>{/if}
							{:else}
								<Button size="lg" onclick={cerrar}>Entrar</Button>
							{/if}
						{:else if ultimo}
							<Button size="lg" onclick={cerrar}>¡A por el café!</Button>
						{:else}
							<Button size="lg" onclick={() => (paso = paso + 1)}>Siguiente</Button>
						{/if}
					</div>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
