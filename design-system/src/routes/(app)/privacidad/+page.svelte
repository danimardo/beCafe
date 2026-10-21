<script lang="ts">
	import { BackLink, Banner, PageHeader, PrivacyText } from '#lib';
</script>

<!-- RF-161: enlace permanente al texto vigente, dentro de la app y con navegación. La pantalla BLOQUEANTE de RF-160 es otra: /aceptar-privacidad. -->
<BackLink href="/perfil" label="Perfil" />
<PageHeader eyebrow="Versión 1" title="Privacidad" />

<div class="mb-4">
	<Banner tone="warning" title="Texto aplazado (PEND-014)">
		Este es el texto orientativo del anexo A de historias.md. Los datos entre corchetes y la revisión de la redacción deben resolverse antes de usar la app con datos reales.
	</Banner>
</div>

<PrivacyText />

<p class="mt-4 px-1 text-[13px] leading-[18px] text-ink-muted">Leíste esta versión el 18 oct 2026.</p>
