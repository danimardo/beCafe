<script lang="ts">
	import { page } from '$app/state';
	import { Banner, Button, PrivacyText } from '#lib';

	// RF-160: aparece la primera vez que se entra o cuando cambia la versión del texto. Hasta pulsar «He leído el texto»
	// no se puede usar la app. Al pulsar, el servidor registra fecha y versión leídas y redirige a la pantalla de inicio.
	// Demo: /aceptar-privacidad (primera vez) · ?estado=actualizado (cambió la versión del texto: ahora menciona los rellenos de agua).
	const version = 2;
	const firstTime = $derived(page.url.searchParams.get('estado') !== 'actualizado');
</script>

<svelte:head><title>Privacidad · beCafé</title></svelte:head>

<p class="type-eyebrow mb-0.5 text-ink-muted">{firstTime ? 'Antes de empezar' : 'Hemos actualizado el texto'} · Versión {version}</p>
<h1 class="type-display mb-3">Privacidad</h1>
<p class="mb-4 text-[15px] leading-5 text-ink-muted">
	{firstTime
		? 'Antes de usar la app, lee cómo se tratan tus datos.'
		: 'Ha cambiado el texto de privacidad. Léelo para seguir usando la app.'}
</p>

<div class="mb-4">
	<Banner tone="warning" title="Texto aplazado (PEND-014)">Redacción orientativa con datos entre corchetes: no publicar así.</Banner>
</div>

<PrivacyText {version} />

<!-- Barra de acción fija abajo: el texto es largo en móvil y el botón no puede quedar fuera de vista. -->
<div class="glass-strong sticky bottom-3 z-10 mb-4 mt-6 flex flex-col gap-1 rounded-sheet p-3">
	<Button href="/" size="lg" block>He leído el texto</Button>
	<Button href="/login" variant="ghost" block>Cerrar sesión</Button>
</div>
<div class="h-2"></div>
