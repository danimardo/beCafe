// Texto informativo de privacidad, anexo A de historias.md, versión 2 (RF-160, PEND-014; CAMBIO-019).
// Los marcadores entre corchetes se completan antes de usar datos reales; hasta entonces el texto no es definitivo.

/** Versión vigente. Subirla obliga a todas las personas a releer el texto (RF-160). */
export const VERSION_PRIVACIDAD = 2;

/** Párrafo «Visitantes» del anexo A v2. La pantalla de entrada de un visitante lo muestra antes del nombre (plan F10 D11). */
export const TEXTO_VISITANTES =
	'Si entras con un enlace de visitante, guardamos el nombre que escribes y cada café que registras, con su tipo, su fecha y su hora, y quién te dio el enlace. Los administradores ven esos datos para aprobar o rechazar tus cafés. Tu nombre se conserva sin límite de tiempo, salvo que pidas a un administrador que lo borre: entonces se sustituye por «Visitante». No guardamos tu correo ni ningún otro dato.';

export type BloquePrivacidad =
	| { tipo: 'titulo'; texto: string }
	| { tipo: 'parrafo'; entrada?: string; texto: string }
	| { tipo: 'lista'; entrada?: string; elementos: readonly string[] };

// Los textos son los del anexo A. El encabezado en negrita (`entrada`) se separa del texto para renderizarlo sin repetirlo.
export const TEXTO_PRIVACIDAD: readonly BloquePrivacidad[] = [
	{ tipo: 'titulo', texto: 'Privacidad en beCafé' },
	{
		tipo: 'parrafo',
		entrada: 'Quién trata tus datos.',
		texto:
			'[Nombre de la empresa]. Gestiona la aplicación, dentro de la empresa, el responsable del departamento de informática, [nombre o cargo y forma de contacto].',
	},
	{
		tipo: 'parrafo',
		entrada: 'Para qué.',
		texto:
			'Para llevar el stock de cápsulas de café del departamento y repartir su coste entre quienes las consumen mediante la hucha común.',
	},
	{
		tipo: 'lista',
		entrada: 'Qué datos guardamos.',
		elementos: [
			'Tu nombre, tu correo, tu contraseña cifrada de forma irreversible y, si la subes tú o un administrador, tu foto.',
			'Cada café que registras, con su fecha, su hora y si era para un invitado.',
			'Cada vez que registras que has rellenado el agua de la cafetera, con su fecha y su hora.',
			'Tus aportaciones a la hucha (también las que un administrador registre en tu nombre, con quién las registró), las compras que registras, las fotos de tickets que adjuntes y tu saldo.',
			'Tus preferencias de notificaciones y los datos técnicos de tus dispositivos suscritos a las notificaciones.',
			'Las sesiones abiertas (fecha y tipo de navegador) y las acciones de administración.',
		],
	},
	{
		tipo: 'lista',
		entrada: 'Quién los ve.',
		elementos: [
			'Todos los miembros ven tu saldo, tus aportaciones, las compras que registres y tus rellenos de agua, incluidos el ranking de rellenos y el título de aguador del mes.',
			'Todos los miembros ven tu foto y tus estadísticas de consumo (cuántos cafés tomas, de qué tipo y cuándo).',
		],
	},
	{
		tipo: 'parrafo',
		entrada: 'Cuánto tiempo.',
		texto:
			'Los datos se conservan sin límite de tiempo, también después de que dejes el departamento, para que los saldos y el historial de la hucha sigan cuadrando. Las copias de seguridad se guardan 30 días en [proveedor y ubicación del almacenamiento S3].',
	},
	{
		tipo: 'parrafo',
		entrada: 'Visitantes.',
		texto: TEXTO_VISITANTES,
	},
	{
		tipo: 'parrafo',
		entrada: 'Notificaciones.',
		texto:
			'Solo recibes notificaciones si las aceptas en tu dispositivo. Vienen todas activadas y puedes desactivar cada tipo en tu perfil, salvo el aviso de deuda.',
	},
	{
		tipo: 'parrafo',
		entrada: 'Tus derechos.',
		texto:
			'Puedes pedir acceso a tus datos, su rectificación y el resto de derechos que reconoce la normativa de protección de datos escribiendo a [contacto]. [Añadir, si procede, el contacto del delegado de protección de datos de la empresa y la referencia a la autoridad de control.]',
	},
];
