<script lang="ts">
	import Glass from '../ui/Glass.svelte';

	type Props = {
		/** Versión del texto vigente (RF-160 registra la versión leída). */
		version?: number;
		class?: string;
	};
	let { version = 2, class: className }: Props = $props();
</script>

<!-- Texto informativo de privacidad: anexo A de historias.md (v0.4.0: menciona beCafé y los rellenos de agua). Redacción y datos entre corchetes aplazados (PEND-014):
     NO publicar con los corchetes. En producción, el texto y su versión vienen del servidor. -->
<Glass as="article" class={['space-y-3 text-[15px] leading-[22px]', className].filter(Boolean).join(' ')} aria-label="Texto de privacidad, versión {version}">
	<h2 class="type-title-lg">Privacidad en beCafé</h2>
	<p><b>Quién trata tus datos.</b> [Nombre de la empresa]. Gestiona la aplicación, dentro de la empresa, el responsable del departamento de informática, [nombre o cargo y forma de contacto].</p>
	<p><b>Para qué.</b> Para llevar el stock de cápsulas de café del departamento y repartir su coste entre quienes las consumen mediante la hucha común.</p>
	<div>
		<p><b>Qué datos guardamos.</b></p>
		<ul class="mt-1 list-disc space-y-1 pl-5">
			<li>Tu nombre, tu correo y tu contraseña cifrada de forma irreversible.</li>
			<li>Cada café que registras, con su fecha, su hora y si era para un invitado.</li>
			<li>Cada vez que registras que has rellenado el agua de la cafetera, con su fecha y su hora.</li>
			<li>Tus aportaciones a la hucha, las compras que registras, las fotos de tickets que adjuntes y tu saldo.</li>
			<li>Tus preferencias de notificaciones y los datos técnicos de tus dispositivos suscritos a las notificaciones.</li>
			<li>Las sesiones abiertas (fecha y tipo de navegador) y las acciones de administración.</li>
		</ul>
	</div>
	<div>
		<p><b>Quién los ve.</b></p>
		<ul class="mt-1 list-disc space-y-1 pl-5">
			<li>Todos los miembros ven tu saldo, tus aportaciones, las compras que registres y tus rellenos de agua, incluidos el ranking de rellenos y el título de aguador del mes.</li>
			<li>Tus estadísticas de consumo solo las ves tú y los administradores.</li>
		</ul>
	</div>
	<p><b>Cuánto tiempo.</b> Los datos se conservan <b>sin límite de tiempo</b>, también después de que dejes el departamento, para que los saldos y el historial de la hucha sigan cuadrando. Las copias de seguridad se guardan 30 días en [proveedor y ubicación del almacenamiento S3].</p>
	<p><b>Notificaciones.</b> Solo recibes notificaciones si las aceptas en tu dispositivo. Puedes desactivar cada tipo en tu perfil, salvo el aviso de deuda.</p>
	<p><b>Tus derechos.</b> Puedes pedir acceso a tus datos, su rectificación y el resto de derechos que reconoce la normativa de protección de datos escribiendo a [contacto]. [Añadir, si procede, el contacto del delegado de protección de datos de la empresa y la referencia a la autoridad de control.]</p>
</Glass>
