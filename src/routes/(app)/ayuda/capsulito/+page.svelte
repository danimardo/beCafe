<script lang="ts">
	import { resolve } from '$app/paths';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import { BackLink, Button, Capsulito, Glass, PageHeader, Section, Switch, usarMascota } from '#lib/ui';
	import { ESCENAS_BIENVENIDA } from '#lib/shared/mascota/bienvenida';
	import type { FormaBoca } from '#lib/shared/mascota/lip-sync';
	import {
		EXPRESIONES,
		EXPRESION_USO,
		MOMENTOS,
		POSES,
		POSE_USO,
		type Expresion,
		type MomentoId,
		type Pose,
		type VarianteFrase,
	} from '#lib/shared/mascota/momentos';

	const mascota = usarMascota();

	let momentoActivo = $state<MomentoId>('saludo-manana');
	let poseForzada = $state<Pose>('saludando');
	let expresionForzada = $state<Expresion>('feliz');
	let modo = $state<'rive' | 'svg'>('rive');
	let speechDemo = $state(false);
	let bocaManual = $state<FormaBoca>(0);

	const BOCAS: readonly { valor: FormaBoca; etiqueta: string }[] = [
		{ valor: 0, etiqueta: '0 · Reposo (M/B/P)' },
		{ valor: 1, etiqueta: '1 · Entreabierta' },
		{ valor: 2, etiqueta: '2 · Estrecha (E/I)' },
		{ valor: 3, etiqueta: '3 · Media (consonantes)' },
		{ valor: 4, etiqueta: '4 · Abierta (A)' },
		{ valor: 5, etiqueta: '5 · Redondeada (O)' },
		{ valor: 6, etiqueta: '6 · Cerrada redonda (U)' },
		{ valor: 7, etiqueta: '7 · Dientes (F/V/Z/S)' },
	];

	const listaMomentos: {
		id: string;
		pose: Pose;
		expresion: Expresion;
		variantes: readonly VarianteFrase[];
	}[] = Object.entries(MOMENTOS).map(([id, def]) => ({
		id,
		pose: def.pose,
		expresion: def.expresion,
		variantes: def.variantes,
	}));

	function seleccionarPose(pose: Pose) {
		poseForzada = pose;
		const encontrado = Object.entries(MOMENTOS).find(([, def]) => def.pose === pose);
		if (encontrado) {
			const [id] = encontrado;
			if (esMomentoId(id)) momentoActivo = id;
		}
	}

	function esMomentoId(valor: string): valor is MomentoId {
		return Object.prototype.hasOwnProperty.call(MOMENTOS, valor);
	}
</script>

<svelte:head>
	<title>Laboratorio de Capsulito · beCafé</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<BackLink href={resolve('/(app)/ayuda')} label="Volver a la ayuda" />
	<PageHeader title="Laboratorio de Capsulito" eyebrow="Ayuda y demostración" />

	<Glass class="flex flex-col gap-5 p-5">
		<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex flex-col items-center gap-2">
				{#key `${momentoActivo}-${expresionForzada}-${modo}-${speechDemo}-${bocaManual}`}
					<Capsulito
						momento={momentoActivo}
						expresion={expresionForzada}
						size="xl"
						{modo}
						{speechDemo}
						boca={speechDemo ? undefined : bocaManual}
						bocadillo="arriba"
					/>
				{/key}
			</div>

			<div class="flex flex-1 flex-col gap-4">
				<div class="flex flex-wrap gap-2">
					<Button type="button" variant={modo === 'rive' ? 'primary' : 'soft'} onclick={() => (modo = 'rive')}>Modo Rive (.riv)</Button>
					<Button type="button" variant={modo === 'svg' ? 'primary' : 'soft'} onclick={() => (modo = 'svg')}>Modo SVG / WebP</Button>
				</div>

				<Switch
					label="Demostración de habla continua"
					description="Alterna las formas de boca de Rive automáticamente sin audio."
					checked={speechDemo}
					onchange={(v: boolean) => (speechDemo = v)}
				/>

				<div class="flex flex-col gap-1.5">
					<p class="text-[13px] font-semibold text-ink">Forma de boca (0..7)</p>
					<div class="flex flex-wrap gap-1.5">
						{#each BOCAS as opcion (opcion.valor)}
							<button
								type="button"
								onclick={() => {
									speechDemo = false;
									bocaManual = opcion.valor;
								}}
								aria-pressed={!speechDemo && bocaManual === opcion.valor}
								class="min-h-9 rounded-chip border border-hairline bg-wall-base px-2.5 py-1 text-[12px] font-medium text-ink aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
							>
								{opcion.etiqueta}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</Glass>

	<Section title="8 poses de Capsulito">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each POSES as pose (pose)}
				<button
					type="button"
					onclick={() => seleccionarPose(pose)}
					aria-pressed={poseForzada === pose}
					class="flex items-center gap-3 rounded-panel border border-hairline bg-wall-base p-3 text-left aria-pressed:border-accent aria-pressed:bg-accent-soft/40"
				>
					<span class="min-w-0 flex-1">
						<span class="block text-[15px] font-semibold capitalize text-ink">{pose}</span>
						<span class="mt-0.5 block text-[13px] leading-[18px] text-ink-muted">{POSE_USO[pose]}</span>
					</span>
				</button>
			{/each}
		</div>
	</Section>

	<Section title="6 expresiones faciales">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each EXPRESIONES as exp (exp)}
				<button
					type="button"
					onclick={() => (expresionForzada = exp)}
					aria-pressed={expresionForzada === exp}
					class="flex items-center gap-3 rounded-panel border border-hairline bg-wall-base p-3 text-left aria-pressed:border-accent aria-pressed:bg-accent-soft/40"
				>
					<span class="min-w-0 flex-1">
						<span class="block text-[15px] font-semibold capitalize text-ink">{exp}</span>
						<span class="mt-0.5 block text-[13px] leading-[18px] text-ink-muted">{EXPRESION_USO[exp]}</span>
					</span>
				</button>
			{/each}
		</div>
	</Section>

	<Section title="8 escenas de bienvenida">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each ESCENAS_BIENVENIDA as escena, idx (escena.id)}
				<div class="flex flex-col justify-between gap-3 rounded-panel border border-hairline bg-wall-base p-4">
					<div>
						<p class="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
							Escena {idx + 1} · {escena.id}
						</p>
						<h3 class="mt-0.5 text-[16px] font-semibold text-ink">{escena.titulo}</h3>
						<p class="mt-1 text-[14px] leading-5 text-ink-muted">{escena.texto}</p>
					</div>
					<div class="flex items-center gap-2">
						<Button
							type="button"
							variant="soft"
							onclick={() => {
								momentoActivo = escena.momento;
								expresionForzada = escena.expresion;
								mascota.hablar(escena.id, true);
							}}
						>
							<Volume2 class="size-4" aria-hidden="true" />
							<span>Escuchar {escena.id}</span>
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</Section>

	<Section title="Catálogo de momentos y locuciones">
		<div class="flex flex-col gap-3">
			{#each listaMomentos as item (item.id)}
				<div class="flex flex-col gap-2 rounded-panel border border-hairline bg-wall-base p-4">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h3 class="text-[15px] font-semibold text-ink">{item.id}</h3>
							<p class="text-[12px] text-ink-muted">
								Pose: {item.pose} · Expresión: {item.expresion}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							onclick={() => {
								if (esMomentoId(item.id)) momentoActivo = item.id;
								expresionForzada = item.expresion;
							}}
						>
							Probar pose
						</Button>
					</div>
					<ul class="flex flex-col gap-1.5 text-[14px] text-ink">
						{#each item.variantes as variante (variante.id)}
							<li class="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-1.5">
								<span>«{variante.texto}»</span>
								{#if variante.conAudio}
									<Button
										type="button"
										variant="soft"
										onclick={() => {
											if (esMomentoId(item.id)) momentoActivo = item.id;
											expresionForzada = item.expresion;
											mascota.hablar(variante.id, true);
										}}
									>
										<Volume2 class="size-4" aria-hidden="true" />
										<span>Escuchar {variante.id}</span>
									</Button>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</Section>
</div>
