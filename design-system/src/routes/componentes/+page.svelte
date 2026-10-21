<script lang="ts">
	import { onMount } from 'svelte';
	import Specimen from './Specimen.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Package from '@lucide/svelte/icons/package';
	import {
		AlertsPanel, Avatar, BarChart, Badge, Banner, Button, CapsuleImage, CapsuleRow, ColorField, ConfirmDialog, EmptyState, Glass,
		IconButton, KpiTile, ListRow, Money, MoneyField, MovementRow, PageHeader, PasswordField, PhotoField, ReauthDialog, SegmentedControl,
		Section, SelectField, CopyField, ErrorPage, BrandMark, Pagination, WaterRefillCard, MovementList, BackLink, NotificationItem, RegularizationSummary, Sheet, Skeleton, SplitBar, Stepper, StockBadge, Switch, TextField, ThemeToggle, UndoToast, VoidDialog, theme
	} from '#lib';
	import { favourites, weekly, regularizationDemo, aguador, historyAll, viewer, graceMinutes } from '#lib/mock';
	import { notifications } from '#lib/notifications.svelte';
	let regOpen = $state(false);
	let pg = $state(2);

	onMount(() => theme.init());

	let seg = $state('mes');
	let sw1 = $state(true);
	let sw2 = $state(false);
	let cents = $state<number | null>(1700);
	let color = $state('#c0392b');
	let sheet = $state(false);
	let confirm = $state(false);
	let voidOpen = $state(false);
	let reauth = $state(false);
	let text = $state('');
	let sel = $state('semanal');
	let pw = $state('');
</script>

<svelte:head><title>Componentes · beCafé</title></svelte:head>

<div class="wall-blobs min-h-dvh">
	<main class="mx-auto max-w-4xl px-5 py-8 md:px-8">
		<PageHeader eyebrow="Sistema de diseño" title="Componentes" bell={false}>
			{#snippet actions()}<div class="w-64"><ThemeToggle /></div>{/snippet}
		</PageHeader>
		<p class="mb-8 max-w-2xl text-[15px] leading-5 text-ink-muted">
			Catálogo vivo de todo lo que hay en <code>src/lib</code>. Cambia entre Automático, Claro y Oscuro arriba para verlos en los dos modos.
		</p>

		<Specimen name="Glass" description="Superficie de cristal. «strong» es más opaca y se usa para lo que flota encima (navegación, avisos, hojas).">
			<div class="grid gap-4 sm:grid-cols-2">
				<Glass><p class="type-title">Cristal estándar</p><p class="text-[13px] leading-[18px] text-ink-muted">Tarjetas, filas, paneles.</p></Glass>
				<Glass strong><p class="type-title">Cristal fuerte</p><p class="text-[13px] leading-[18px] text-ink-muted">Barra de navegación, avisos, hojas.</p></Glass>
			</div>
		</Specimen>

		<Specimen name="Button" description="Un único botón primario por pantalla. Altura mínima de 44 px.">
			<div class="flex flex-wrap items-center gap-3">
				<Button>Primario</Button>
				<Button variant="soft">Suave</Button>
				<Button variant="ghost">Texto</Button>
				<Button variant="glass">Cristal</Button>
				<Button variant="danger">Anular</Button>
				<Button disabled>Desactivado</Button>
				<Button loading>Enviando</Button>
				<Button href="/"><Plus class="size-4" aria-hidden="true" /> Enlace con icono</Button>
			</div>
			<div class="mt-4 max-w-sm"><Button size="lg" block>Grande, a todo el ancho</Button></div>
		</Specimen>

		<Specimen name="IconButton" description="Botón solo con icono. La etiqueta es obligatoria (nombre accesible).">
			<div class="flex gap-3">
				<IconButton label="Añadir"><Plus class="size-5" aria-hidden="true" /></IconButton>
				<IconButton label="Añadir" variant="ghost"><Plus class="size-5" aria-hidden="true" /></IconButton>
				<IconButton label="Añadir" variant="accent"><Plus class="size-5" aria-hidden="true" /></IconButton>
			</div>
		</Specimen>

		<Specimen name="Badge" description="Siempre con texto; el icono es decorativo. El color nunca es la única señal.">
			<div class="flex flex-wrap gap-2">
				<Badge>Neutral</Badge><Badge tone="accent">Administrador</Badge><Badge tone="positive">Correcta</Badge>
				<Badge tone="negative">Fallida</Badge><Badge tone="warning">Pendiente</Badge>
				<StockBadge level="low" /><StockBadge level="out" />
			</div>
		</Specimen>

		<Specimen name="Money" description="Importes en céntimos enteros. Los saldos llevan signo explícito (+/−) además del color.">
			<div class="flex flex-wrap items-baseline gap-6 text-xl font-semibold">
				<Money cents={2340} /> <Money cents={410} signed tone /> <Money cents={-620} signed tone /> <Money cents={0} signed tone />
			</div>
		</Specimen>

		<Specimen name="Avatar" description="Iniciales del nombre. Decorativo.">
			<div class="flex items-center gap-3"><Avatar name="Ana Martín" /><Avatar name="Luis Torres" size="md" /></div>
		</Specimen>

		<Specimen name="SegmentedControl" description="Selector exclusivo de 2–3 opciones, con teclado (flechas).">
			<div class="max-w-sm"><SegmentedControl bind:value={seg} label="Periodo" options={[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }, { value: 'anio', label: 'Año' }]} /></div>
		</Specimen>

		<Specimen name="TextField" description="Etiqueta siempre visible, ayuda y error enlazados con aria-describedby. Con «rows» es un área de texto.">
			<div class="grid max-w-md gap-4">
				<TextField label="Nombre" bind:value={text} hint="Como lo verán los compañeros." />
				<TextField label="Correo" value="ana@" error="Escribe un correo completo." />
				<TextField label="Motivo" rows={3} value="" required />
			</div>
		</Specimen>

		<Specimen name="PasswordField" description="Con botón para mostrar u ocultar. Mínimo 15 caracteres (RT-007).">
			<div class="max-w-md"><PasswordField bind:value={pw} hint="Mínimo 15 caracteres." /></div>
		</Specimen>

		<Specimen name="MoneyField" description="Acepta «17», «17,5» o «1.234,50» y entrega céntimos enteros.">
			<div class="max-w-xs"><MoneyField label="Importe" bind:cents hint="Máximo 500 €." /></div>
		</Specimen>

		<Specimen name="SelectField" description="Selector nativo del sistema: cómodo y accesible en móvil.">
			<div class="max-w-xs"><SelectField label="Recordatorio" bind:value={sel} options={[{ value: 'diario', label: 'Cada día' }, { value: 'semanal', label: 'Cada semana' }]} /></div>
		</Specimen>

		<Specimen name="Switch" description="Interruptor con etiqueta y descripción. Puede ir bloqueado y activado (aviso de deuda).">
			<Glass class="max-w-md divide-y divide-hairline py-1">
				<Switch bind:checked={sw1} label="Stock bajo" description="Cuando un tipo está a punto de acabarse." />
				<Switch bind:checked={sw2} label="Resumen mensual" />
				<Switch checked disabled label="Aviso de deuda" description="Obligatorio." />
			</Glass>
		</Specimen>

		<Specimen name="PhotoField" description="Foto con validación temprana de tipo y tamaño (la validación real es del servidor, RF-005).">
			<div class="max-w-md"><PhotoField label="Foto del ticket (opcional)" /></div>
		</Specimen>

		<Specimen name="ColorField" description="Color del tipo de cápsula, entre 8 presets con nombre.">
			<ColorField label="Color" bind:value={color} />
		</Specimen>

		<Specimen name="Sheet" description="Hoja que sube desde abajo en móvil y diálogo centrado en escritorio. Gestiona foco, Escape y lectores de pantalla.">
			<div class="flex flex-wrap gap-3">
				<Button onclick={() => (sheet = true)}>Abrir hoja</Button>
				<Button variant="soft" onclick={() => (confirm = true)}>Abrir confirmación</Button>
				<Button variant="soft" onclick={() => (voidOpen = true)}>Abrir anulación</Button>
				<Button variant="soft" onclick={() => (reauth = true)}>Abrir reautenticación</Button>
			</div>
		</Specimen>

		<Specimen name="UndoToast" description="Aviso «Deshacer» de 5 s tras registrar un consumo. Se pausa al pasar el puntero o enfocar. Se monta dentro de ToastRegion (región viva).">
			<div class="max-w-md"><UndoToast toast={{ id: 'demo', title: 'Ristretto registrado', detail: '−0,35 € · quedan 41', color: '#3b2a6b', onundo: () => {}, duration: 600000 }} onclose={() => {}} /></div>
		</Specimen>

		<Specimen name="Banner" description="Avisos en línea. «negative» se anuncia al instante (role=alert); el resto, sin interrumpir (role=status).">
			<div class="grid gap-3 md:grid-cols-2">
				<Banner tone="info" title="Información">Los avisos solo funcionan si instalas la app.</Banner>
				<Banner tone="warning" title="La hucha se quedaría en negativo">Tras esta compra quedaría en −0,60 €.</Banner>
				<Banner tone="negative" title="No se pudo guardar">Revisa el importe e inténtalo de nuevo.</Banner>
				<Banner tone="offline" title="Sin conexión">Tu café se guardó en el móvil y se enviará al volver la red.
					{#snippet actions()}<Button variant="soft">Reintentar</Button>{/snippet}
				</Banner>
			</div>
		</Specimen>

		<Specimen name="EmptyState" description="Pantalla o lista sin datos.">
			<Glass><EmptyState title="Todavía no hay compras" description="Cuando alguien registre una, aparecerá aquí.">
				{#snippet icon()}<Package class="size-6" />{/snippet}
				{#snippet action()}<Button>Nueva compra</Button>{/snippet}
			</EmptyState></Glass>
		</Specimen>

		<Specimen name="Skeleton" description="Marcador de carga. Se queda quieto con «reducir movimiento».">
			<Glass class="flex max-w-sm flex-col gap-3"><Skeleton class="h-5 w-40" /><Skeleton class="h-4 w-64" /><Skeleton class="h-4 w-52" /></Glass>
		</Specimen>

		<Specimen name="ListRow" description="Fila genérica con icono/avatar a la izquierda y contenido a la derecha. Úsala dentro de <ul class='divide-y divide-hairline'>.">
			<Glass class="py-1"><ul class="divide-y divide-hairline">
				<ListRow title="Marta Ruiz" subtitle="Compró el 18 oct">{#snippet leading()}<Avatar name="Marta Ruiz" />{/snippet}{#snippet trailing()}<Money cents={410} signed tone />{/snippet}</ListRow>
				<ListRow title="Luis Torres" subtitle="Por debajo del límite" href="/saldos">{#snippet leading()}<Avatar name="Luis Torres" />{/snippet}{#snippet trailing()}<Money cents={-620} signed tone />{/snippet}</ListRow>
			</ul></Glass>
		</Specimen>

		<Specimen name="Stepper" description="Progreso de asistentes de varios pasos (baja de usuario).">
			<div class="max-w-md"><Stepper steps={['Saldo', 'Liquidar', 'Confirmar']} current={1} /></div>
		</Specimen>

		<Specimen name="ThemeToggle" description="Automático / Claro / Oscuro. Persiste en el dispositivo y, con theme.onPersist, en el perfil.">
			<div class="max-w-sm"><ThemeToggle /></div>
		</Specimen>

		<Specimen name="CapsuleImage" description="Foto del tipo dentro de un aro de su color. Sin foto, se dibuja la cápsula con ese color.">
			<div class="flex items-center gap-4">
				<CapsuleImage name="Ristretto" color="#3b2a6b" size="sm" /><CapsuleImage name="Lungo" color="#c0392b" /><CapsuleImage name="Vainilla" color="#e8d3a9" size="lg" />
				<CapsuleImage name="Foto" color="#2e8b57" photoUrl="/demo-capsule.svg" size="sm" /><CapsuleImage name="Foto" color="#2e8b57" photoUrl="/demo-capsule.svg" /><CapsuleImage name="Foto" color="#c9a227" photoUrl="/demo-capsule.svg" size="lg" />
			</div>
		</Specimen>

		<Specimen name="CapsuleRow" description="El componente principal: un toque registra el café; el botón de persona lo registra para un invitado.">
			<ul class="flex max-w-md flex-col gap-2">
				<CapsuleRow name="Ristretto" brand="Nespresso" intensity={10} stock={42} threshold={10} avgCostCents={35} color="#3b2a6b" daysLeft={21} onregister={() => {}} onregisterGuest={() => {}} />
				<CapsuleRow name="Lungo Forte" brand="Nespresso" intensity={8} stock={6} threshold={10} avgCostCents={38} color="#c0392b" daysLeft={3} onregister={() => {}} onregisterGuest={() => {}} />
				<CapsuleRow name="Caramelo" brand="Nespresso" stock={-1} threshold={10} avgCostCents={40} color="#c2547a" photoUrl="/demo-capsule.svg" onregister={() => {}} onregisterGuest={() => {}} />
			</ul>
		</Specimen>

		<Specimen name="AlertsPanel" description="Panel de avisos de la pantalla principal (RF-021).">
			<div class="max-w-md"><AlertsPanel huchaCents={2340} myBalanceCents={-245} lowStock={['Lungo Forte', 'Vainilla']} debtors={[{ name: 'Luis Torres', cents: -620 }]} /></div>
		</Specimen>

		<Specimen name="MovementRow" description="Una fila por tipo de movimiento del libro. Anulado (tachado) y pendiente de enviar (sin conexión) incluidos.">
			<Glass class="max-w-lg py-1"><ul class="divide-y divide-hairline">
				<MovementRow kind="consumo" title="Ristretto" subtitle="Hoy, 9:12" cents={-35} pending />
				<MovementRow kind="aportacion" title="Aportación" subtitle="Ayer, 12:05" cents={1000} />
				<MovementRow kind="compra" title="Compra de 70 cápsulas" subtitle="18 oct · Marta Ruiz" cents={-2400} />
				<MovementRow kind="consumo" title="Vainilla" subtitle="18 oct, 10:02" cents={-40} voided />
				<MovementRow kind="regularizacion" title="Regularización" subtitle="15 oct" cents={-320} />
				<MovementRow kind="arqueo" title="Arqueo de la hucha" subtitle="13 oct" />
				<MovementRow kind="recuento" title="Recuento de stock" subtitle="13 oct" cents={-70} />
				<MovementRow kind="reparto" title="Reparto de diferencia" subtitle="13 oct" cents={-12} />
				<MovementRow kind="baja" title="Baja de Elena Ríos" subtitle="2 oct" cents={0} />
			</ul></Glass>
		</Specimen>

		<Specimen name="KpiTile" description="Cifra clave con etiqueta.">
			<div class="grid max-w-md grid-cols-3 gap-2"><KpiTile label="cafés" value="12" /><KpiTile label="gastado" value="4,30 €" /><KpiTile label="invitados" value="2" /></div>
		</Specimen>

		<Specimen name="BarChart" description="Barras con resumen accesible (role=img). La última barra es el periodo actual.">
			<Glass class="max-w-md"><BarChart title="Cafés por semana" data={weekly} /></Glass>
		</Specimen>

		<Specimen name="SplitBar" description="Reparto proporcional con leyenda en texto.">
			<Glass class="max-w-md"><SplitBar title="Tus cápsulas favoritas" segments={favourites} /></Glass>
		</Specimen>

		<Specimen name="PageHeader y Section" description="Título de pantalla (serif) y secciones con título.">
			<PageHeader eyebrow="Martes, 20 oct" title="Hola, Ana">{#snippet actions()}<Avatar name="Ana Martín" size="md" />{/snippet}</PageHeader>
			<Section title="Una sección"><p class="text-[15px] text-ink-muted">Contenido de la sección.</p></Section>
		</Specimen>

		<Specimen name="CopyField" description="Enlace de un solo uso con botón Copiar (invitación 24 h, recuperación 1 h; RF-131, RN-052).">
			<div class="max-w-md"><CopyField label="Enlace de recuperación" value="https://capsulas.example.com/acceso/3f9a1c7e2b" /></div>
		</Specimen>

		<Specimen name="BackLink" description="Vuelta a la pantalla padre en pantallas de detalle.">
			<BackLink href="/saldos" label="Saldos" />
		</Specimen>

		<Specimen name="NotificationBell y NotificationPanel" description="La campana vive en PageHeader; abre el panel (RF-107). Aquí se abre a mano.">
			<Button variant="soft" onclick={() => notifications.openPanel()}>Abrir panel de avisos</Button>
		</Specimen>

		<Specimen name="RegularizationSummary" description="Resumen tras anular una compra con consumos posteriores (RN-012, RF-045).">
			<Button variant="soft" onclick={() => (regOpen = true)}>Ver resumen</Button>
		</Specimen>

		<Specimen name="ErrorPage" description="No encontrada, sin permiso, servidor y sin conexión. Demos reales: /errores/sin-permiso, /errores/servidor, /offline.">
			<div class="grid gap-4 md:grid-cols-2">
				<ErrorPage kind="no-encontrada" code={404} />
				<ErrorPage kind="sin-permiso" code={403} />
			</div>
		</Specimen>
		<Specimen name="BrandMark" description="Logotipo (provisional) y nombre «beCafé». Tamaños sm, md y lg; sin nombre solo el icono.">
			<div class="flex flex-wrap items-center gap-6"><BrandMark /><BrandMark size="md" /><BrandMark size="lg" /><BrandMark wordmark={false} /></div>
		</Specimen>

		<Specimen name="WaterRefillCard" description="Relleno de agua (RF-170 a RF-176): último relleno, acción, estados de rechazo y sin conexión, y aguador del mes. Se ven tres estados.">
			<div class="grid gap-4 md:grid-cols-3">
				<WaterRefillCard last={{ name: 'Jorge', minutesAgo: 190 }} intervalMinutes={60} {aguador} meName="Ana Martín" onrefill={() => {}} />
				<WaterRefillCard last={null} intervalMinutes={60} offline aguador={null} meName="Ana Martín" onrefill={() => {}} />
				<WaterRefillCard last={{ name: 'Ana', minutesAgo: 20 }} intervalMinutes={60} aguador={{ month: 'septiembre', names: ['Jorge'] }} meName="Luis Torres" onrefill={() => {}} />
			</div>
		</Specimen>

		<Specimen name="Pagination" description="Navegación entre páginas de una lista (historial).">
			<Pagination bind:page={pg} pages={4} label="Páginas de ejemplo" />
		</Specimen>

		<Specimen name="MovementList" description="Lista de movimientos con hoja de detalle y anulación. Tocar una fila abre el detalle.">
			<MovementList items={historyAll.slice(0, 3)} {viewer} {graceMinutes} />
		</Specimen>
	</main>
</div>
<RegularizationSummary bind:open={regOpen} result={regularizationDemo} />

<Sheet bind:open={sheet} title="Hoja de ejemplo" description="Se cierra con la X, Escape o tocando fuera.">
	<p class="py-2 text-[15px] leading-5">Contenido desplazable. El pie con la acción principal queda fijo abajo.</p>
	{#snippet footer()}<Button size="lg" block onclick={() => (sheet = false)}>Aceptar</Button>{/snippet}
</Sheet>
<ConfirmDialog bind:open={confirm} title="¿Registrar la compra?" description="La hucha quedará en −0,60 € y se avisará a los administradores." confirmLabel="Sí, registrar" onconfirm={() => {}} />
<VoidDialog bind:open={voidOpen} subject="Consumo de Ristretto · 18 oct" consequence="Su cargo de 0,35 € dejará de contar y el stock volverá a subir 1." onconfirm={() => {}} />
<ReauthDialog bind:open={reauth} onsubmit={() => true} />
