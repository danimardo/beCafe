<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Settings from '@lucide/svelte/icons/settings';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { Avatar, Badge, Button, ConfirmDialog, Glass, ListRow, PageHeader, PasswordField, Section, Sheet, Switch, ThemeToggle } from '#lib';
	import { me } from '#lib/mock';

	let lowStock = $state(true);
	let monthly = $state(true);
	// RF-101/102: solo los administradores ven estas tres; un miembro nunca las recibe (CA-101).
	let negStock = $state(true);
	let negHucha = $state(true);
	let backupFail = $state(true);
	let passwordOpen = $state(false);
	let signOutAllOpen = $state(false);
	let current = $state('');
	let next = $state('');
</script>

<PageHeader eyebrow="Tu cuenta" title="Perfil" />

<Glass as="section" class="flex items-center gap-4">
	<Avatar name={me.name} size="md" />
	<div class="min-w-0">
		<p class="type-title truncate">{me.name}</p>
		<p class="truncate text-[13px] leading-[18px] text-ink-muted">{me.email}</p>
	</div>
	<Badge tone="accent" class="ml-auto capitalize">{me.role}</Badge>
</Glass>

{#if me.role === 'administrador'}
	<!-- En móvil la administración se alcanza desde aquí; en escritorio también está en la barra lateral. -->
	<Glass as="div" class="mt-3 py-1">
		<ul>
			<ListRow href="/admin" title="Administración" subtitle="Cápsulas, usuarios, arqueos, configuración y copias">
				{#snippet leading()}<span class="flex size-9 items-center justify-center rounded-full bg-accent text-on-accent" aria-hidden="true"><Settings class="size-[18px]" /></span>{/snippet}
				{#snippet trailing()}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/snippet}
			</ListRow>
		</ul>
	</Glass>
{/if}

<Section title="Apariencia">
	<ThemeToggle />
	<p class="mt-2 text-[13px] leading-[18px] text-ink-muted">«Automático» sigue el modo claro u oscuro de tu dispositivo.</p>
</Section>

<Section title="Notificaciones">
	<Glass as="div" class="divide-y divide-hairline py-1">
		<Switch bind:checked={lowStock} label="Stock bajo" description="Cuando un tipo de cápsula está a punto de acabarse." />
		<Switch bind:checked={monthly} label="Resumen mensual" description="Tu consumo y tu saldo el día 1 de cada mes." />
		<!-- RF-102: el aviso de deuda no se puede desactivar. -->
		<Switch checked disabled label="Aviso de deuda" description="Obligatorio: te avisa si tu saldo baja del límite." />
	</Glass>
	{#if me.role === 'administrador'}
		<h3 class="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Avisos de administración</h3>
		<Glass as="div" class="divide-y divide-hairline py-1">
			<Switch bind:checked={negStock} label="Stock negativo" description="Cuando alguien registra una cápsula que no constaba en stock." />
			<Switch bind:checked={negHucha} label="Hucha en negativo" description="Cuando el saldo teórico de la hucha baja de 0." />
			<Switch bind:checked={backupFail} label="Fallo de copia de seguridad" description="Cuando la copia automática no se completa." />
		</Glass>
	{/if}
</Section>

<Section title="Seguridad">
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			<ListRow title="Cambiar contraseña" subtitle="Mínimo 15 caracteres" onclick={() => (passwordOpen = true)}>
				{#snippet leading()}<KeyRound class="size-5 text-accent" aria-hidden="true" />{/snippet}
				{#snippet trailing()}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/snippet}
			</ListRow>
			<ListRow title="Cerrar sesión en todos los dispositivos" onclick={() => (signOutAllOpen = true)}>
				{#snippet leading()}<LogOut class="size-5 text-accent" aria-hidden="true" />{/snippet}
				{#snippet trailing()}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/snippet}
			</ListRow>
		</ul>
	</Glass>
</Section>

<Section title="Ayuda y privacidad">
	<Glass as="div" class="py-1">
		<ul class="divide-y divide-hairline">
			<ListRow href="/ayuda" title="Instalar la app y activar avisos">
				{#snippet leading()}<Smartphone class="size-5 text-accent" aria-hidden="true" />{/snippet}
				{#snippet trailing()}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/snippet}
			</ListRow>
			<ListRow href="/privacidad" title="Texto de privacidad">
				{#snippet leading()}<ShieldCheck class="size-5 text-accent" aria-hidden="true" />{/snippet}
				{#snippet trailing()}<ChevronRight class="size-5 text-ink-muted" aria-hidden="true" />{/snippet}
			</ListRow>
		</ul>
	</Glass>
</Section>

<div class="mt-6"><Button href="/login" variant="glass" block>Cerrar sesión</Button></div>

<Sheet bind:open={passwordOpen} title="Cambiar contraseña">
	<form id="pw" class="flex flex-col gap-4 pt-2" onsubmit={(e) => { e.preventDefault(); passwordOpen = false; }}>
		<PasswordField label="Contraseña actual" bind:value={current} />
		<PasswordField label="Contraseña nueva" bind:value={next} autocomplete="new-password" hint="Mínimo 15 caracteres. Sin reglas de composición: una frase larga es lo mejor." />
	</form>
	{#snippet footer()}<Button type="submit" form="pw" size="lg" block>Guardar contraseña</Button>{/snippet}
</Sheet>

<ConfirmDialog
	bind:open={signOutAllOpen}
	title="¿Cerrar sesión en todos los dispositivos?"
	description="Tendrás que volver a entrar con tu contraseña en cada uno de ellos."
	confirmLabel="Cerrar todas las sesiones"
	tone="danger"
	onconfirm={() => {}}
/>
