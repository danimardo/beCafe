// Catálogo tipado de poses, expresiones, momentos y eventos de Capsulito (RF-185, RF-186, RF-187; DEC-108, DEC-112, DEC-113).
// Las pantallas nunca eligen una ruta de imagen ni de animación directamente: piden un `MomentoId` o una pose/expresión tipada.

/** Las 8 poses de animación Rive (`.riv`) y de vector articulado (`/static/mascota/svg/capsulito-{pose}.svg`). */
export const POSES_RIV = ['saludo', 'celebrando', 'pensando', 'dormido', 'alerta', 'triste', 'cafetera', 'hucha'] as const;
export type PoseRiv = (typeof POSES_RIV)[number];

/**
 * Duración en segundos de la animación de cada pose Rive, copiada de `static/mascota/riv/manifest.json` (`duration_seconds`).
 * Capsulito no entra en reposo hasta que ha pasado (RF-248). Sin `.riv` propio (`triste`), usa el de su pose equivalente.
 */
export const DURACION_POSE_RIV: Record<PoseRiv, number> = {
	saludo: 2.4,
	celebrando: 2.5,
	pensando: 3,
	dormido: 3.2,
	alerta: 2.5,
	triste: 3,
	cafetera: 2.5,
	hucha: 2.5,
};

/** Las 8 poses del sistema de diseño WebP (`/static/mascota/capsulito-{pose}-{px}.webp`). */
export const POSES = [
	'saludando',
	'senalando',
	'pensando',
	'caminando',
	'celebrando',
	'saltando',
	'recordatorio',
	'anadiendo-capsula',
] as const;
export type Pose = (typeof POSES)[number];

/** Las 6 expresiones faciales de Capsulito (`/static/mascota/svg/variantes/{pose}/{expresion}.svg`). */
export const EXPRESIONES = ['feliz', 'orgulloso', 'pensando', 'sorprendido', 'triste', 'dormido'] as const;
export type Expresion = (typeof EXPRESIONES)[number];

/** Correspondencia entre la pose semántica de la interfaz y el archivo `.riv` / `.svg` articulado. */
export const POSE_A_RIV: Record<Pose, PoseRiv> = {
	saludando: 'saludo',
	senalando: 'cafetera',
	pensando: 'pensando',
	caminando: 'dormido',
	celebrando: 'celebrando',
	saltando: 'celebrando',
	recordatorio: 'alerta',
	'anadiendo-capsula': 'hucha',
};

/** Correspondencia inversa desde una pose Rive hacia la pose WebP equivalente. */
export const RIV_A_POSE: Record<PoseRiv, Pose> = {
	saludo: 'saludando',
	celebrando: 'celebrando',
	pensando: 'pensando',
	dormido: 'caminando',
	alerta: 'recordatorio',
	triste: 'pensando',
	cafetera: 'senalando',
	hucha: 'anadiendo-capsula',
};

export const POSE_USO: Record<Pose, string> = {
	saludando: 'Saludo y bienvenida.',
	senalando: 'Señalar o explicar un paso junto a la cafetera.',
	pensando: 'Vacíos, dudas, errores y operaciones rechazadas.',
	caminando: 'Esperas y pasos en curso: sin conexión, cola pendiente.',
	celebrando: 'Logro cotidiano: café apuntado, relleno de agua, compra o aportación.',
	saltando: 'Logro destacado: deuda saldada, cola sincronizada o primer café.',
	recordatorio: 'Avisos que piden atención: stock bajo o saldo bajo el límite.',
	'anadiendo-capsula': 'Reponer cápsulas o alimentar la hucha común.',
};

export const EXPRESION_USO: Record<Expresion, string> = {
	feliz: 'Sonrisa cálida y acogedora para saludos y confirmaciones.',
	orgulloso: 'Guiño cómplice para logros, compras, invitados y aguador del mes.',
	pensando: 'Mirada reflexiva para estados vacíos, dudas y anulaciones.',
	sorprendido: 'Ojos abiertos para avisos de stock bajo y páginas no encontradas.',
	triste: 'Gesto serio y respetuoso para errores o saldo bajo el límite.',
	dormido: 'Ojos entornados para esperas, modo sin conexión o sin actividad.',
};

/** Tono del momento: decide el estilo del bocadillo y si permite animación de celebración. */
export type Tono = 'neutro' | 'celebracion' | 'aviso' | 'problema';

export interface VarianteFrase {
	/** Identificador único de la variante y nombre base de su audio en `/mascota/voces/{id}.mp3`. */
	readonly id: string;
	/** Texto limpio en español que se muestra en pantalla y se anuncia al lector de pantalla. */
	readonly texto: string;
	/** Texto con etiquetas expresivas de ElevenLabs v3 para generar la locución (solo lo usa `scripts/generar-voces.mjs`). */
	readonly textoVoz: string;
	/** Si tiene locución pregenerada en `static/mascota/voces/{id}.mp3`. */
	readonly conAudio?: boolean;
}

export interface Momento {
	readonly pose: Pose;
	readonly poseRiv: PoseRiv;
	readonly expresion: Expresion;
	readonly tono: Tono;
	/** Texto principal por defecto (primera variante). */
	readonly texto: string;
	/** Lista de variantes para rotar sin repetir dos veces seguidas (RF-186, DEC-112). */
	readonly variantes: readonly [VarianteFrase, ...VarianteFrase[]];
}

export const MOMENTOS = {
	// --- Historia de bienvenida (9 escenas, RF-185, RF-247) ---
	'bienvenida-hola': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'neutro',
		texto:
			'¡Hola, {nombre}! Soy Capsulito. Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
		variantes: [
			{
				id: 'intro_01',
				texto:
					'¡Hola, {nombre}! Soy Capsulito. Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
				textoVoz:
					'[excited] ¡Hola! [chuckles] Soy Capsulito. Soy tu compañero de café en el departamento. Te ayudo a saber qué cápsulas quedan y cómo va nuestra hucha común.',
				conAudio: true,
			},
		],
	},
	'bienvenida-reservas': {
		pose: 'recordatorio',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		tono: 'aviso',
		texto: 'Sin cápsulas no hay servicio. Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
		variantes: [
			{
				id: 'intro_02',
				texto: 'Sin cápsulas no hay servicio. Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
				textoVoz:
					'[surprised] Sin cápsulas no hay servicio. [cheerful] Cada tarjeta muestra cuántas unidades quedan y avisa cuando un tipo entra en stock bajo.',
				conAudio: true,
			},
		],
	},
	'bienvenida-cafe': {
		pose: 'senalando',
		poseRiv: 'cafetera',
		expresion: 'feliz',
		tono: 'neutro',
		texto:
			'Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
		variantes: [
			{
				id: 'intro_03',
				texto:
					'Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
				textoVoz:
					'[cheerful] Toca la cápsula que te pones y queda apuntada al instante. ¿Invitas a alguien? Usa el botón de invitado. ¿Te equivocaste? Pulsa «Deshacer».',
				conAudio: true,
			},
		],
	},
	'bienvenida-compras': {
		pose: 'anadiendo-capsula',
		poseRiv: 'hucha',
		expresion: 'orgulloso',
		tono: 'neutro',
		texto: 'Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
		variantes: [
			{
				id: 'intro_04',
				texto: 'Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
				textoVoz: '[cheerful] Cuando alguien trae cajas nuevas, registra la compra para sumar las existencias y actualizar el coste medio.',
				conAudio: true,
			},
		],
	},
	'bienvenida-dinero': {
		pose: 'senalando',
		poseRiv: 'hucha',
		expresion: 'feliz',
		tono: 'neutro',
		texto:
			'La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
		variantes: [
			{
				id: 'intro_09',
				texto:
					'La hucha común paga las cápsulas. Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
				textoVoz:
					'[cheerful] La hucha común paga las cápsulas. [excited] Tú pones dinero con una aportación y cada café descuenta de tu saldo lo que cuesta. [cheerful] De vez en cuando, los administradores cuentan la caja para que todo cuadre.',
				conAudio: true,
			},
		],
	},
	'bienvenida-hucha': {
		pose: 'senalando',
		poseRiv: 'hucha',
		expresion: 'feliz',
		tono: 'neutro',
		texto: 'Cada café descuenta su precio de tu saldo. Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
		variantes: [
			{
				id: 'intro_05',
				texto: 'Cada café descuenta su precio de tu saldo. Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
				textoVoz:
					'[excited] Cada café descuenta su precio de tu saldo. [cheerful] Cuando estés en negativo, haz una aportación a la hucha y regístrala.',
				conAudio: true,
			},
		],
	},
	'bienvenida-agua': {
		pose: 'senalando',
		poseRiv: 'cafetera',
		expresion: 'feliz',
		tono: 'neutro',
		texto: 'Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
		variantes: [
			{
				id: 'intro_06',
				texto: 'Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
				textoVoz:
					'[cheerful] Si rellenas el depósito de la cafetera, pulsa «He rellenado el agua». No mueve dinero, pero queda reconocido.',
				conAudio: true,
			},
		],
	},
	'bienvenida-aguador': {
		pose: 'celebrando',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: 'El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior.',
		variantes: [
			{
				id: 'intro_07',
				texto: 'El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior.',
				textoVoz:
					'[excited] El día 1 de cada mes damos las gracias a quien más veces rellenó el depósito el mes anterior. [laughs] ¡Ovación para el aguador!',
				conAudio: true,
			},
		],
	},
	'bienvenida-cierre': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: 'Cápsulas controladas, cuentas claras y agua lista. Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
		variantes: [
			{
				id: 'intro_08',
				texto: 'Cápsulas controladas, cuentas claras y agua lista. Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
				textoVoz:
					'[excited] Cápsulas controladas, cuentas claras y agua lista. [cheerful] Puedes volver a ver esta guía o apagarme cuando quieras desde Perfil.',
				conAudio: true,
			},
		],
	},

	// --- Acceso (sin sesión) ---
	'acceso-hola': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'neutro',
		texto: '¡Hola! Entra y apunta tu café.',
		variantes: [
			{
				id: 'acceso_hola_01',
				texto: '¡Hola! Entra y apunta tu café.',
				textoVoz: '[cheerful] ¡Hola! Entra y apunta tu café.',
			},
		],
	},
	'acceso-contrasena': {
		pose: 'senalando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Elige una contraseña larga y fácil de recordar.',
		variantes: [
			{
				id: 'acceso_contrasena_01',
				texto: 'Elige una contraseña larga y fácil de recordar.',
				textoVoz: 'Elige una contraseña larga y fácil de recordar.',
			},
		],
	},

	// --- Inicio (bocadillo contextual) ---
	'saludo-manana': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'neutro',
		texto: '¡Buenos días, {nombre}! ¿Qué cápsula compilamos hoy?',
		variantes: [
			{
				id: 'saludo_manana_01',
				texto: '¡Buenos días, {nombre}! ¿Qué cápsula compilamos hoy?',
				textoVoz: '[cheerful] ¡Buenos días! ¿Qué cápsula compilamos hoy?',
			},
			{
				id: 'saludo_manana_02',
				texto: '¡Buenos días, {nombre}! ¿Qué te pones?',
				textoVoz: '[cheerful] ¡Buenos días! ¿Qué te pones?',
			},
		],
	},
	'saludo-tarde': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'neutro',
		texto: '¡Buenas tardes, {nombre}! ¿Un café para el despliegue de la tarde?',
		variantes: [
			{
				id: 'saludo_tarde_01',
				texto: '¡Buenas tardes, {nombre}! ¿Un café para el despliegue de la tarde?',
				textoVoz: '[cheerful] ¡Buenas tardes! ¿Un café para el despliegue de la tarde?',
			},
			{
				id: 'saludo_tarde_02',
				texto: '¡Buenas tardes, {nombre}! ¿Un café?',
				textoVoz: '[cheerful] ¡Buenas tardes! ¿Un café?',
			},
		],
	},
	'aguador-tu': {
		pose: 'celebrando',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Eres aguador del mes! Gracias por salvarnos de la sequía.',
		variantes: [
			{
				id: 'aguador_mes_01',
				texto: '¡Eres aguador del mes! Gracias por salvarnos de la sequía.',
				textoVoz: '[excited] ¡Ovación al aguador del mes! [chuckles] Gracias por salvarnos de la sequía.',
				conAudio: true,
			},
			{
				id: 'aguadores_mes_01',
				texto: '¡Compartes el título de aguador del mes! Equipo hidratado.',
				textoVoz: '[excited] ¡Ovación a los aguadores del mes!',
				conAudio: true,
			},
		],
	},

	// --- Eventos operativos y celebraciones (RF-186) ---
	'consumo.confirmado': {
		pose: 'celebrando',
		poseRiv: 'celebrando',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: '¡Cafeína cargada en memoria!',
		variantes: [
			{
				id: 'consumo_confirmado_01',
				texto: '¡Cafeína cargada en memoria!',
				textoVoz: '[excited] ¡Cafeína cargada!',
			},
			{
				id: 'consumo_confirmado_02',
				texto: '¡Café apuntado! Latencia cero hasta la taza.',
				textoVoz: '[cheerful] ¡Café apuntado! [chuckles]',
			},
			{
				id: 'consumo_confirmado_03',
				texto: '¡Listo! Una cápsula menos en la caché y más energía en el equipo.',
				textoVoz: '[excited] ¡Listo! Más energía en el equipo.',
			},
		],
	},
	'consumo.invitado_confirmado': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Tenemos visita! Café de invitado apuntado.',
		variantes: [
			{
				id: 'consumo_invitado_01',
				texto: '¡Tenemos visita! Café de invitado apuntado.',
				textoVoz: '[excited] ¡Tenemos visita! [chuckles] Café de invitado apuntado.',
			},
			{
				id: 'consumo_invitado_02',
				texto: '¡Anfitrión de primera! Invitado servido y anotado.',
				textoVoz: '[cheerful] ¡Anfitrión de primera! Invitado servido.',
			},
		],
	},
	'consumo.pendiente': {
		pose: 'caminando',
		poseRiv: 'dormido',
		expresion: 'pensando',
		tono: 'aviso',
		texto: 'Lo tengo en cola local. Se enviará en cuanto vuelva la red.',
		variantes: [
			{
				id: 'consumo_pendiente_01',
				texto: 'Lo tengo en cola local. Se enviará en cuanto vuelva la red.',
				textoVoz: '[sighs] Lo tengo en espera. Todavía falta enviarlo.',
				conAudio: true,
			},
			{
				id: 'consumo_pendiente_02',
				texto: 'Guardado en este dispositivo. Pendiente de sincronizar.',
				textoVoz: 'Guardado en este dispositivo. Pendiente de sincronizar.',
			},
		],
	},
	'consumo.sincronizado': {
		pose: 'saltando',
		poseRiv: 'celebrando',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: '¡Paquete entregado! Tus cafés pendientes ya están en el servidor.',
		variantes: [
			{
				id: 'consumo_sincronizado_01',
				texto: '¡Paquete entregado! Tus cafés pendientes ya están en el servidor.',
				textoVoz: '[excited] ¡Paquete entregado! Tus cafés pendientes ya están sincronizados.',
				conAudio: true,
			},
			{
				id: 'consumo_sincronizado_02',
				texto: '¡Cola vacía y sincronizada con éxito!',
				textoVoz: '[cheerful] ¡Cola vacía y sincronizada con éxito!',
			},
		],
	},
	'consumo.anulado': {
		pose: 'pensando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Registro anulado. Todo vuelve a su sitio.',
		variantes: [
			{
				id: 'consumo_anulado_01',
				texto: 'Registro anulado. Todo vuelve a su sitio.',
				textoVoz: 'Registro anulado. Todo vuelve a su sitio.',
				conAudio: true,
			},
			{
				id: 'consumo_anulado_02',
				texto: 'Deshecho sin rastro. La cuenta y el stock están corregidos.',
				textoVoz: 'Deshecho. La cuenta y el stock están corregidos.',
			},
		],
	},
	'stock.bajo': {
		pose: 'recordatorio',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		tono: 'aviso',
		texto: 'Quedan pocas cápsulas de algún tipo. Echa un vistazo a las existencias.',
		variantes: [
			{
				id: 'stock_bajo_01',
				texto: 'Quedan pocas cápsulas de algún tipo. Echa un vistazo a las existencias.',
				textoVoz: '[surprised] Quedan pocas cápsulas. Echa un vistazo a las existencias.',
				conAudio: true,
			},
			{
				id: 'stock_bajo_02',
				texto: 'Las reservas bajan del umbral. Conviene planificar compra.',
				textoVoz: 'Las reservas bajan del umbral. Conviene planificar compra.',
			},
		],
	},
	'stock.negativo': {
		pose: 'pensando',
		poseRiv: 'triste',
		expresion: 'triste',
		tono: 'problema',
		texto: 'El consumo está registrado, pero hay un descuadre de existencias.',
		variantes: [
			{
				id: 'stock_negativo_01',
				texto: 'El consumo está registrado, pero hay un descuadre de existencias.',
				textoVoz: 'El consumo está registrado, pero hay un descuadre de existencias.',
				conAudio: true,
			},
		],
	},
	'compra.confirmada': {
		pose: 'anadiendo-capsula',
		poseRiv: 'hucha',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Llegaron refuerzos! Cápsulas nuevas en la despensa.',
		variantes: [
			{
				id: 'compra_confirmada_01',
				texto: '¡Llegaron refuerzos! Cápsulas nuevas en la despensa.',
				textoVoz: '[excited] ¡Llegaron refuerzos! Cápsulas nuevas en la despensa.',
				conAudio: true,
			},
			{
				id: 'compra_confirmada_02',
				texto: '¡Despensa recargada y existencias al día!',
				textoVoz: '[cheerful] ¡Despensa recargada y existencias al día!',
			},
		],
	},
	'aportacion.confirmada': {
		pose: 'celebrando',
		poseRiv: 'hucha',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: '¡La hucha respira! Gracias por tu aportación.',
		variantes: [
			{
				id: 'aportacion_confirmada_01',
				texto: '¡La hucha respira! Gracias por tu aportación.',
				textoVoz: '[excited] ¡La hucha respira! [chuckles] Gracias por tu aportación.',
				conAudio: true,
			},
			{
				id: 'aportacion_confirmada_02',
				texto: '¡Aportación guardada! Tu saldo ya está actualizado.',
				textoVoz: '[cheerful] ¡Aportación guardada! Tu saldo ya está actualizado.',
			},
		],
	},
	'agua.confirmada': {
		pose: 'celebrando',
		poseRiv: 'cafetera',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Un héroe sin capa! Gracias por rellenar el agua.',
		variantes: [
			{
				id: 'agua_confirmada_01',
				texto: '¡Un héroe sin capa! Gracias por rellenar el agua.',
				textoVoz: '[excited] ¡Un héroe sin capa! [chuckles] Gracias por rellenar el agua.',
				conAudio: true,
			},
			{
				id: 'agua_confirmada_02',
				texto: '¡Depósito lleno! La cafetera y el equipo te lo agradecen.',
				textoVoz: '[cheerful] ¡Depósito lleno! La cafetera te lo agradece.',
			},
		],
	},
	'agua.rechazada_reciente': {
		pose: 'pensando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'problema',
		texto: 'El depósito se ha rellenado hace poco. Consulta el aviso.',
		variantes: [
			{
				id: 'agua_rechazada_reciente_01',
				texto: 'El depósito se ha rellenado hace poco. Consulta el aviso.',
				textoVoz: 'El depósito se ha rellenado hace poco. Consulta el aviso.',
				conAudio: true,
			},
		],
	},
	'aguador.determinado': {
		pose: 'celebrando',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Ovación al aguador del mes!',
		variantes: [
			{
				id: 'aguador_mes_01',
				texto: '¡Ovación al aguador del mes!',
				textoVoz: '[excited] ¡Ovación al aguador del mes!',
				conAudio: true,
			},
			{
				id: 'aguadores_mes_01',
				texto: '¡Ovación a los aguadores del mes!',
				textoVoz: '[excited] ¡Ovación a los aguadores del mes!',
				conAudio: true,
			},
		],
	},
	'conexion.perdida': {
		pose: 'caminando',
		poseRiv: 'dormido',
		expresion: 'dormido',
		tono: 'problema',
		texto: 'Estamos sin conexión. Tus cafés se guardan en la cola local.',
		variantes: [
			{
				id: 'conexion_perdida_01',
				texto: 'Estamos sin conexión. Tus cafés se guardan en la cola local.',
				textoVoz: '[sighs] Estamos sin conexión. Consulta qué operaciones quedan pendientes.',
				conAudio: true,
			},
		],
	},
	'catalogo.vacio': {
		pose: 'pensando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Aún no hay cápsulas para elegir.',
		variantes: [
			{
				id: 'vacio_capsulas_01',
				texto: 'Aún no hay cápsulas para elegir.',
				textoVoz: 'Aún no hay cápsulas para elegir.',
			},
		],
	},

	// --- Alias de plantilla y celebraciones adicionales ---
	'relleno-registrado': {
		pose: 'celebrando',
		poseRiv: 'cafetera',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Un héroe sin capa! Gracias por rellenar el agua.',
		variantes: [
			{
				id: 'agua_confirmada_01',
				texto: '¡Un héroe sin capa! Gracias por rellenar el agua.',
				textoVoz: '[excited] ¡Un héroe sin capa! Gracias por rellenar el agua.',
				conAudio: true,
			},
			{
				id: 'agua_confirmada_02',
				texto: '¡Gracias por ocuparte del agua!',
				textoVoz: '[cheerful] ¡Gracias por ocuparte del agua!',
			},
		],
	},
	'aportacion-registrada': {
		pose: 'celebrando',
		poseRiv: 'hucha',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: '¡La hucha respira! Gracias por tu aportación.',
		variantes: [
			{
				id: 'aportacion_confirmada_01',
				texto: '¡La hucha respira! Gracias por tu aportación.',
				textoVoz: '[excited] ¡La hucha respira! Gracias por tu aportación.',
				conAudio: true,
			},
		],
	},
	'compra-registrada': {
		pose: 'anadiendo-capsula',
		poseRiv: 'hucha',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Llegaron refuerzos! Cápsulas a la despensa.',
		variantes: [
			{
				id: 'compra_confirmada_01',
				texto: '¡Llegaron refuerzos! Cápsulas a la despensa.',
				textoVoz: '[excited] ¡Llegaron refuerzos!',
				conAudio: true,
			},
		],
	},
	'deuda-saldada': {
		pose: 'saltando',
		poseRiv: 'celebrando',
		expresion: 'orgulloso',
		tono: 'celebracion',
		texto: '¡Cuentas al día! Tu saldo vuelve a estar en positivo.',
		variantes: [
			{
				id: 'deuda_saldada_01',
				texto: '¡Cuentas al día! Tu saldo vuelve a estar en positivo.',
				textoVoz: '[excited] ¡Cuentas al día!',
			},
		],
	},
	'primer-cafe': {
		pose: 'saltando',
		poseRiv: 'celebrando',
		expresion: 'feliz',
		tono: 'celebracion',
		texto: '¡Tu primer café en beCafé!',
		variantes: [
			{
				id: 'primer_cafe_01',
				texto: '¡Tu primer café en beCafé!',
				textoVoz: '[excited] ¡Tu primer café en beCafé!',
			},
		],
	},

	// --- Avisos contextuales de Inicio (DEC-113: tono serio en deuda y rechazos) ---
	'aviso-stock-bajo': {
		pose: 'recordatorio',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		tono: 'aviso',
		texto: 'Quedan pocas de algunas cápsulas.',
		variantes: [
			{
				id: 'stock_bajo_01',
				texto: 'Quedan pocas de algunas cápsulas.',
				textoVoz: 'Quedan pocas cápsulas. Echa un vistazo a las existencias.',
				conAudio: true,
			},
		],
	},
	'aviso-deuda': {
		pose: 'recordatorio',
		poseRiv: 'alerta',
		expresion: 'triste',
		tono: 'aviso',
		texto: 'Tu saldo está por debajo del límite acordado. Registra una aportación cuando puedas.',
		variantes: [
			{
				id: 'aviso_deuda_01',
				texto: 'Tu saldo está por debajo del límite acordado. Registra una aportación cuando puedas.',
				textoVoz: 'Tu saldo está por debajo del límite acordado. Registra una aportación cuando puedas.',
			},
		],
	},
	'aviso-pendientes': {
		pose: 'caminando',
		poseRiv: 'dormido',
		expresion: 'pensando',
		tono: 'aviso',
		texto: 'Tienes cafés guardados pendientes de enviar.',
		variantes: [
			{
				id: 'consumo_pendiente_01',
				texto: 'Tienes cafés guardados pendientes de enviar.',
				textoVoz: 'Lo tengo en espera. Todavía falta enviarlo.',
				conAudio: true,
			},
		],
	},
	'consumo-rechazado': {
		pose: 'pensando',
		poseRiv: 'triste',
		expresion: 'triste',
		tono: 'problema',
		texto: 'No se ha podido registrar un consumo pendiente. Revisa el aviso.',
		variantes: [
			{
				id: 'operacion_rechazada_01',
				texto: 'No se ha podido registrar un consumo pendiente. Revisa el aviso.',
				textoVoz: 'No se ha podido completar la operación. Consulta el aviso.',
				conAudio: true,
			},
		],
	},

	// --- Estados vacíos ---
	'vacio-capsulas': {
		pose: 'pensando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Aún no hay cápsulas para elegir.',
		variantes: [
			{
				id: 'vacio_capsulas_01',
				texto: 'Aún no hay cápsulas para elegir.',
				textoVoz: 'Aún no hay cápsulas para elegir.',
			},
		],
	},
	'vacio-movimientos': {
		pose: 'caminando',
		poseRiv: 'dormido',
		expresion: 'dormido',
		tono: 'neutro',
		texto: 'Todavía no hay movimientos.',
		variantes: [
			{
				id: 'vacio_movimientos_01',
				texto: 'Todavía no hay movimientos.',
				textoVoz: 'Todavía no hay movimientos.',
			},
		],
	},
	'vacio-compras': {
		pose: 'anadiendo-capsula',
		poseRiv: 'hucha',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Aún no hay compras registradas.',
		variantes: [
			{
				id: 'vacio_compras_01',
				texto: 'Aún no hay compras registradas.',
				textoVoz: 'Aún no hay compras registradas.',
			},
		],
	},
	'vacio-estadisticas': {
		pose: 'pensando',
		poseRiv: 'pensando',
		expresion: 'pensando',
		tono: 'neutro',
		texto: 'Sin cafés en este periodo.',
		variantes: [
			{
				id: 'vacio_estadisticas_01',
				texto: 'Sin cafés en este periodo.',
				textoVoz: 'Sin cafés en este periodo.',
			},
		],
	},
	'vacio-avisos': {
		pose: 'saludando',
		poseRiv: 'saludo',
		expresion: 'feliz',
		tono: 'neutro',
		texto: 'Todo tranquilo por aquí.',
		variantes: [
			{
				id: 'vacio_avisos_01',
				texto: 'Todo tranquilo por aquí.',
				textoVoz: 'Todo tranquilo por aquí.',
			},
		],
	},

	// --- Errores y conectividad (DEC-113: tono serio y directo) ---
	'sin-conexion': {
		pose: 'caminando',
		poseRiv: 'dormido',
		expresion: 'dormido',
		tono: 'problema',
		texto: 'Sin conexión. Tus cafés se guardan en el dispositivo.',
		variantes: [
			{
				id: 'conexion_perdida_01',
				texto: 'Sin conexión. Tus cafés se guardan en el dispositivo.',
				textoVoz: 'Estamos sin conexión. Consulta qué operaciones quedan pendientes.',
				conAudio: true,
			},
		],
	},
	'error.peticion': {
		pose: 'pensando',
		poseRiv: 'alerta',
		expresion: 'sorprendido',
		tono: 'problema',
		texto: 'Esa petición no me cuadra ni con un café doble.',
		variantes: [
			{
				id: 'error_400_01',
				texto: 'Esa petición no me cuadra ni con un café doble.',
				textoVoz: '[sighs] Esa petición no me cuadra ni con un café doble.',
			},
		],
	},
	'error.no_encontrada': {
		pose: 'senalando',
		poseRiv: 'pensando',
		expresion: 'sorprendido',
		tono: 'problema',
		texto: 'Aquí no hay nada, ni una triste cápsula. Te has perdido.',
		variantes: [
			{
				id: 'error_404_01',
				texto: 'Aquí no hay nada, ni una triste cápsula. Te has perdido.',
				textoVoz: '[curious] Aquí no hay nada, ni una triste cápsula. Te has perdido.',
			},
		],
	},
	'error.sin_permiso': {
		pose: 'pensando',
		poseRiv: 'alerta',
		expresion: 'pensando',
		tono: 'problema',
		texto: 'Alto ahí, jefe. Esta zona es solo para administradores.',
		variantes: [
			{
				id: 'error_403_01',
				texto: 'Alto ahí, jefe. Esta zona es solo para administradores.',
				textoVoz: '[firmly] Alto ahí, jefe. Esta zona es solo para administradores.',
			},
		],
	},
	'error.servidor': {
		pose: 'pensando',
		poseRiv: 'triste',
		expresion: 'triste',
		tono: 'problema',
		texto: 'He roto algo, lo siento. Tus datos están a salvo.',
		variantes: [
			{
				id: 'error_500_01',
				texto: 'He roto algo, lo siento. Tus datos están a salvo.',
				textoVoz: '[sighs] He roto algo, lo siento. Tus datos están a salvo.',
			},
		],
	},
} as const satisfies Record<string, Momento>;

export type MomentoId = keyof typeof MOMENTOS;

/** Sustituye `{nombre}` en un texto del catálogo y limpia espacios antes de signos de puntuación. */
export function formatearTextoMascota(plantilla: string, vars: { nombre?: string } = {}): string {
	// Sin nombre (bienvenida antes de entrar), «¡Hola, {nombre}!» queda «¡Hola!»: se quita también la coma previa.
	const sustituida = vars.nombre ? plantilla.replace('{nombre}', vars.nombre) : plantilla.replace(/,?\s*\{nombre\}/, '');
	return sustituida
		.replace(/\s+([!?,.…])/g, '$1')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

export function textoDe(id: MomentoId, vars: { nombre?: string } = {}): string {
	return formatearTextoMascota(MOMENTOS[id].texto, vars);
}

/**
 * Elige una variante del momento o evento sin repetir `ultimoId` cuando hay 2 o más opciones (RF-186, CA-186).
 * `indiceCandidato` permite elegir de forma determinista o aleatoria desde quien llama.
 */
export function elegirVariante(id: MomentoId, ultimoId?: string | null, indiceCandidato = 0): VarianteFrase {
	const variantes = MOMENTOS[id].variantes;
	if (variantes.length === 1) return variantes[0];
	const candidatas = ultimoId ? variantes.filter((v) => v.id !== ultimoId) : variantes;
	const lista = candidatas.length > 0 ? candidatas : variantes;
	const idx = Math.abs(Math.trunc(indiceCandidato)) % lista.length;
	return lista[idx] ?? variantes[0];
}

export const EXPRESION_A_ARCHIVO: Record<Expresion, string> = {
	feliz: 'alegre',
	orgulloso: 'guino',
	pensando: 'pensativa',
	sorprendido: 'sorprendida',
	triste: 'pensativa',
	dormido: 'parpadeo',
};

function esPoseRiv(valor: Pose | PoseRiv): valor is PoseRiv {
	return (
		valor === 'saludo' ||
		valor === 'celebrando' ||
		valor === 'pensando' ||
		valor === 'dormido' ||
		valor === 'alerta' ||
		valor === 'triste' ||
		valor === 'cafetera' ||
		valor === 'hucha'
	);
}

function resolverArchivoPose(poseOAlias: Pose | PoseRiv): Pose {
	if (esPoseRiv(poseOAlias)) {
		return RIV_A_POSE[poseOAlias];
	}
	return poseOAlias;
}

/** Ruta WebP de una pose a un tamaño concreto (`/mascota/capsulito-{pose}-{px}.webp`). */
export const srcPose = (pose: Pose, px: 128 | 256 | 512 | 1024): string => `/mascota/capsulito-${pose}-${px}.webp`;

/** Ruta SVG estática de una pose y expresión (`/mascota/svg/variantes/{pose}/{expresion}.svg` o `/mascota/svg/capsulito-{pose}.svg`). */
export const srcSvg = (poseOAlias: Pose | PoseRiv, expresion?: Expresion): string => {
	const pose = resolverArchivoPose(poseOAlias);
	return expresion ? `/mascota/svg/variantes/${pose}/${EXPRESION_A_ARCHIVO[expresion]}.svg` : `/mascota/svg/capsulito-${pose}.svg`;
};

/** Ruta de la animación Rive compilada (`/mascota/riv/capsulito-{pose}.riv`). */
export const srcRiv = (poseOAlias: Pose | PoseRiv): string => `/mascota/riv/capsulito-${resolverArchivoPose(poseOAlias)}.riv`;

/**
 * Qué dice Capsulito en Inicio. Prioridad: problemas > avisos propios > avisos de equipo > logros > saludo.
 * Solo orienta la interfaz; los datos vienen del servidor.
 */
export function momentoInicio(estado: {
	rechazado?: boolean;
	pendientes?: number;
	saldoCents: number;
	limiteDeudaCents: number;
	stockBajo: number;
	soyAguador?: boolean;
	hora?: number;
}): MomentoId {
	if (estado.rechazado) return 'consumo-rechazado';
	if (estado.pendientes && estado.pendientes > 0) return 'aviso-pendientes';
	if (estado.saldoCents < estado.limiteDeudaCents) return 'aviso-deuda';
	if (estado.stockBajo > 0) return 'aviso-stock-bajo';
	if (estado.soyAguador) return 'aguador-tu';
	return (estado.hora ?? 10) < 14 ? 'saludo-manana' : 'saludo-tarde';
}
