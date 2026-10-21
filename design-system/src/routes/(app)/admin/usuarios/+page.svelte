<script lang="ts">
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import { Avatar, Badge, Banner, Button, CopyField, Glass, ListRow, Money, PageHeader, ReauthDialog, SegmentedControl, SelectField, Sheet, Stepper, TextField, formatMoney } from '#lib';
	import { members as seed } from '#lib/mock';
	import type { Member } from '#lib/mock';

	// Copia local solo para que la demo reaccione; en la app real manda el servidor (RN-041 se valida allí).
	let members = $state<Member[]>(seed.map((m) => ({ ...m })));
	const activeAdmins = $derived(members.filter((m) => m.active && m.role === 'administrador').length);
	const newLink = () => `https://capsulas.example.com/acceso/${crypto.randomUUID().replaceAll('-', '')}`;

	// ---- Alta (RF-130) y enlace de invitación (RF-131, RN-052) ----
	let newOpen = $state(false);
	let newName = $state('');
	let newEmail = $state('');
	let newRole = $state('miembro');
	let inviteLink = $state('');
	let copied = $state(false);

	function createUser(e: SubmitEvent) {
		e.preventDefault();
		if (!newName.trim() || !newEmail.trim()) return;
		inviteLink = newLink();
	}
	async function copy() {
		try {
			await navigator.clipboard.writeText(inviteLink);
			copied = true;
		} catch {}
	}
	// Al cerrar la hoja (con «Hecho», la X o Escape) se limpia el formulario.
	$effect(() => {
		if (!newOpen) {
			inviteLink = '';
			newName = newEmail = '';
			copied = false;
		}
	});
	const closeNew = () => (newOpen = false);

	// ---- Baja con liquidación (RF-135, RN-017, RN-018, RN-044) ----
	let bajaOpen = $state(false);
	let target = $state<Member | null>(null);
	let step = $state(0);
	let settlement = $state<'paga' | 'incobrable'>('paga');
	let reauthOpen = $state(false);

	function startBaja(m: Member) {
		manageOpen = false;
		target = m;
		step = 0;
		settlement = 'paga';
		bajaOpen = true;
	}
	const balance = $derived(target?.balanceCents ?? 0);
	const others = members.filter((m) => m.active).length - 1;
	const steps = ['Saldo', 'Liquidar', 'Confirmar'];

	// ---- Gestionar usuario: cambiar rol (RF-134), enlace de recuperación (RF-131), reactivar (RF-136) ----
	let manageOpen = $state(false);
	let manageId = $state('');
	const managed = $derived(members.find((m) => m.id === manageId) ?? null);
	let roleDraft = $state('miembro');
	let roleError = $state('');
	let roleSaved = $state(false);
	let recoveryLink = $state('');
	let reactivated = $state(false);

	function openManage(m: Member) {
		manageId = m.id;
		roleDraft = m.role;
		roleError = '';
		roleSaved = false;
		recoveryLink = '';
		reactivated = false;
		manageOpen = true;
	}
	// RN-041: siempre debe quedar al menos un administrador activo. El servidor lo vuelve a comprobar.
	function wouldLeaveNoAdmin(m: Member) {
		return m.active && m.role === 'administrador' && activeAdmins <= 1;
	}
	$effect(() => {
		roleDraft;
		roleError = '';
		roleSaved = false;
	});
	const roleChanged = $derived(!!managed && roleDraft !== managed.role);
	function saveRole() {
		if (!managed) return;
		if (roleDraft !== 'administrador' && wouldLeaveNoAdmin(managed)) {
			roleError = 'No se puede: debe quedar al menos un administrador activo. Nombra antes a otra persona.';
			return;
		}
		pending = 'rol';
		reauthOpen = true;
	}
	function genRecovery() {
		recoveryLink = newLink(); // RN-052: caduca en 1 h, un solo uso, invalida los anteriores
	}
	function reactivate() {
		pending = 'reactivar';
		reauthOpen = true;
	}

	// Una sola reautenticación (RN-050) para todas las acciones sensibles de esta pantalla.
	let pending = $state<'baja' | 'rol' | 'reactivar' | null>(null);
	function afterReauth() {
		if (pending === 'baja') {
			if (target) target.active = false;
			bajaOpen = false;
		} else if (pending === 'rol' && managed) {
			managed.role = roleDraft as Member['role'];
			roleSaved = true;
		} else if (pending === 'reactivar' && managed) {
			managed.active = true;
			recoveryLink = newLink(); // nuevo enlace de 1 h para que elija contraseña
			reactivated = true;
		}
		pending = null;
	}
</script>

<PageHeader eyebrow="Administración" title="Usuarios">
	{#snippet actions()}<Button onclick={() => (newOpen = true)}><UserPlus class="size-4" aria-hidden="true" /> Nuevo usuario</Button>{/snippet}
</PageHeader>

<Glass as="div" class="py-1">
	<ul class="divide-y divide-hairline">
		{#each members as m (m.id)}
			<ListRow title={m.name} subtitle={m.active ? m.note : 'Dado de baja'} stackTrailing>
				{#snippet leading()}<Avatar name={m.name} />{/snippet}
				{#snippet trailing()}
					<span class="flex flex-wrap items-center justify-end gap-2">
						<Badge tone={m.role === 'administrador' ? 'accent' : 'neutral'} class="capitalize">{m.role}</Badge>
						<span class="min-w-16 text-right text-[15px] font-semibold"><Money cents={m.balanceCents} signed tone /></span>
						<Button variant="soft" onclick={() => openManage(m)} aria-label="Gestionar a {m.name}">Gestionar</Button>
					</span>
				{/snippet}
			</ListRow>
		{/each}
	</ul>
</Glass>

<Sheet bind:open={newOpen} title="Nuevo usuario" description="Se genera un enlace de un solo uso para que elija su contraseña." >
	{#if !inviteLink}
		<form id="new-user" class="flex flex-col gap-4 pt-2" onsubmit={createUser}>
			<TextField label="Nombre" bind:value={newName} required />
			<TextField label="Correo" type="email" bind:value={newEmail} required />
			<SelectField label="Rol" bind:value={newRole} options={[{ value: 'miembro', label: 'Miembro' }, { value: 'administrador', label: 'Administrador' }]} />
		</form>
	{:else}
		<div class="flex flex-col gap-3 pt-2">
			<Banner tone="info" title="Cuenta creada">Envía este enlace a {newName}. Caduca en 24 horas y solo se puede usar una vez.</Banner>
			<TextField label="Enlace de invitación" value={inviteLink} readonly />
		</div>
	{/if}
	{#snippet footer()}
		{#if !inviteLink}
			<Button type="submit" form="new-user" size="lg" block>Crear y generar enlace</Button>
		{:else}
			<div class="flex flex-col gap-2">
				<Button size="lg" block onclick={copy}>
					{#if copied}<Check class="size-5" aria-hidden="true" /> Enlace copiado{:else}<Copy class="size-5" aria-hidden="true" /> Copiar enlace{/if}
				</Button>
				<Button variant="ghost" size="lg" block onclick={closeNew}>Hecho</Button>
			</div>
		{/if}
	{/snippet}
</Sheet>

<Sheet bind:open={bajaOpen} title="Dar de baja a {target?.name ?? ''}" description="La baja exige dejar su saldo en 0. No se borra ningún dato.">
	<div class="flex flex-col gap-5 pt-2">
		<Stepper {steps} current={step} />
		{#if target && wouldLeaveNoAdmin(target)}
			<Banner tone="negative" title="Es el único administrador">
				No se puede dar de baja: debe quedar al menos un administrador activo (RN-041). Cambia antes el rol de otra persona.
			</Banner>
		{/if}
		{#if step === 0}
			<Glass radius="tile" class="text-center">
				<p class="text-[13px] leading-[18px] text-ink-muted">Saldo actual</p>
				<p class="type-amount"><Money cents={balance} signed tone /></p>
				<p class="text-[14px] leading-[19px] text-ink-muted">
					{balance < 0 ? 'Debe dinero a la hucha.' : balance > 0 ? 'Tiene dinero a favor.' : 'Está a cero: se puede dar de baja directamente.'}
				</p>
			</Glass>
		{:else if step === 1}
			{#if balance < 0}
				<SegmentedControl
					bind:value={settlement}
					label="Cómo se liquida la deuda"
					options={[{ value: 'paga', label: 'Ha pagado' }, { value: 'incobrable', label: 'Incobrable' }]}
				/>
				<p class="text-[14px] leading-[19px] text-ink-muted">
					{#if settlement === 'paga'}
						Se registra su pago como una aportación de {formatMoney(-balance)} a la hucha.
					{:else}
						Se reparte la deuda de {formatMoney(-balance)} entre los otros {others} miembros activos, aproximadamente {formatMoney(Math.ceil(-balance / others))} cada uno.
					{/if}
				</p>
			{:else if balance > 0}
				<p class="text-[14px] leading-[19px] text-ink-muted">Se registra la devolución de {formatMoney(balance)} en efectivo desde la hucha. La hucha teórica bajará lo mismo.</p>
			{:else}
				<p class="text-[14px] leading-[19px] text-ink-muted">No hace falta liquidar nada.</p>
			{/if}
		{:else}
			<Banner tone="warning" title="Resumen">
				{target?.name} quedará dado de baja con saldo {formatMoney(0)}. Podrás reactivarlo más adelante, siempre con saldo 0.
			</Banner>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex gap-2">
			{#if step > 0}<Button variant="soft" size="lg" onclick={() => (step -= 1)}>Atrás</Button>{/if}
			{#if step < steps.length - 1}
				<Button size="lg" class="flex-1" onclick={() => (step += 1)}>Continuar</Button>
			{:else}
				<Button variant="danger" size="lg" class="flex-1" disabled={!!target && wouldLeaveNoAdmin(target)} onclick={() => { pending = 'baja'; reauthOpen = true; }}>Confirmar baja</Button>
			{/if}
		</div>
	{/snippet}
</Sheet>

<!-- RN-050: confirmar la baja pide la contraseña si pasaron más de 15 minutos. -->
<ReauthDialog bind:open={reauthOpen} onsubmit={() => true} onsuccess={afterReauth} />

<Sheet bind:open={manageOpen} title={managed?.name ?? ''} description={managed?.active ? 'Rol, acceso y baja.' : 'Usuario dado de baja.'}>
	{#if managed}
		<div class="flex flex-col gap-5 pt-2">
			{#if !managed.active}
				{#if reactivated}
					<Banner tone="info" title="Usuario reactivado">
						Envía este enlace a {managed.name}. Caduca en 1 hora y solo se puede usar una vez.
					</Banner>
					<CopyField label="Enlace de acceso" value={recoveryLink} />
				{:else}
					<Banner tone="info" title="Reactivar">
						Solo se puede reactivar con saldo {formatMoney(0)} (el actual es {formatMoney(managed.balanceCents)}). Se genera un enlace nuevo de 1 hora para que elija contraseña.
					</Banner>
				{/if}
			{:else}
				<div class="flex flex-col gap-2">
					<SelectField label="Rol" bind:value={roleDraft} options={[{ value: 'miembro', label: 'Miembro' }, { value: 'administrador', label: 'Administrador' }]} />
					{#if roleError}<p class="text-[13px] leading-[18px] text-negative" role="alert">{roleError}</p>{/if}
					{#if roleSaved}<p class="flex items-center gap-1.5 text-[13px] text-positive" role="status"><Check class="size-4" aria-hidden="true" /> Rol actualizado.</p>{/if}
					<Button variant="soft" disabled={!roleChanged} onclick={saveRole}>Guardar rol</Button>
				</div>
				<div class="flex flex-col gap-2 border-t border-hairline pt-4">
					<p class="text-[14px] font-semibold">Acceso</p>
					<p class="text-[13px] leading-[18px] text-ink-muted">Si {managed.name.split(' ')[0]} ha olvidado la contraseña, genera un enlace de un solo uso. Caduca en 1 hora y anula los enlaces anteriores.</p>
					{#if recoveryLink}
						<CopyField label="Enlace de recuperación" value={recoveryLink} />
					{:else}
						<Button variant="soft" onclick={genRecovery}><KeyRound class="size-4" aria-hidden="true" /> Generar enlace de recuperación</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	{#snippet footer()}
		{#if managed && !managed.active && !reactivated}
			<Button size="lg" block disabled={managed.balanceCents !== 0} onclick={reactivate}><UserCheck class="size-5" aria-hidden="true" /> Reactivar usuario</Button>
		{:else if managed?.active}
			<Button variant="danger" size="lg" block onclick={() => managed && startBaja(managed)}>Dar de baja…</Button>
		{:else}
			<Button variant="ghost" size="lg" block onclick={() => (manageOpen = false)}>Hecho</Button>
		{/if}
	{/snippet}
</Sheet>
