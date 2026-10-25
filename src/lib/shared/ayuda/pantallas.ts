import { z } from 'zod';

// Catálogo de ayuda contextual de Capsulito (RF-203, plan F10 D8). Es la fuente del panel «?» y de `/ayuda` sin JavaScript.
// Cada pantalla de `(app)` y `(visita)` tiene una entrada; una prueba lo comprueba recorriendo las rutas.

export type EntradaAyuda = {
	titulo: string;
	proposito: string;
	acciones: readonly { nombre: string; explicacion: string }[];
	campos: readonly { nombre: string; explicacion: string }[];
};

const AYUDA = {
	inicio: {
		titulo: 'Inicio',
		proposito: 'Aquí registras tus cafés con un solo toque y ves cuántas cápsulas quedan de cada tipo.',
		acciones: [
			{ nombre: 'Tocar una cápsula', explicacion: 'Registra un café a tu nombre. Durante 5 segundos puedes pulsar «Deshacer».' },
			{ nombre: 'Botón de invitado', explicacion: 'Registra un café para una persona invitada. Lo pagas tú.' },
			{ nombre: 'He rellenado el agua', explicacion: 'Anota que has rellenado el depósito. Cuenta para el aguador del mes.' },
			{ nombre: '¿Viene alguien de fuera?', explicacion: 'Crea un enlace para que un visitante registre su café sin cuenta.' },
		],
		campos: [{ nombre: 'Stock', explicacion: 'Cápsulas que quedan. Si baja del mínimo, la tarjeta lo avisa.' }],
	},
	saldos: {
		titulo: 'Saldos',
		proposito: 'Muestra tu saldo, el de la hucha común y el de cada persona del departamento.',
		acciones: [
			{ nombre: 'Aportar', explicacion: 'Anota el dinero que has metido en la hucha. Sube tu saldo y el de la hucha.' },
			{ nombre: 'Tocar una persona', explicacion: 'Abre el detalle de sus aportaciones y quién las registró.' },
		],
		campos: [
			{ nombre: 'Importe', explicacion: 'Euros con dos decimales como máximo, por ejemplo 5,00.' },
			{ nombre: 'Para', explicacion: 'Solo administradores: la persona que entregó el dinero.' },
		],
	},
	aportacion: {
		titulo: 'Detalle de una aportación',
		proposito: 'Muestra una aportación: cuándo se registró, el importe y si está anulada.',
		acciones: [{ nombre: 'Anular aportación', explicacion: 'Deja la aportación sin efecto. Hay que escribir el motivo.' }],
		campos: [{ nombre: 'Motivo de la anulación', explicacion: 'Explica por qué se anula. Queda en el historial.' }],
	},
	aportacionesPersona: {
		titulo: 'Aportaciones de una persona',
		proposito: 'Lista las aportaciones de una persona, con la fecha, el importe y quién las registró.',
		acciones: [],
		campos: [],
	},
	historial: {
		titulo: 'Historial',
		proposito: 'Lista todos los registros: consumos, aportaciones, compras, arqueos, recuentos y rellenos.',
		acciones: [{ nombre: 'Aplicar', explicacion: 'Filtra la lista por persona, tipo de registro y anulados.' }],
		campos: [],
	},
	registroControl: {
		titulo: 'Detalle de un arqueo o recuento',
		proposito: 'Muestra el resultado de un arqueo de la hucha o de un recuento de cápsulas y su reparto.',
		acciones: [],
		campos: [],
	},
	compras: {
		titulo: 'Compras',
		proposito: 'Registra las cápsulas que has comprado con dinero de la hucha.',
		acciones: [
			{ nombre: '«−» y «+»', explicacion: 'Cambian la cantidad de cada tipo. También puedes escribir la cifra.' },
			{ nombre: 'Registrar compra', explicacion: 'Guarda la compra. Si deja la hucha en negativo, primero te pide confirmación.' },
		],
		campos: [
			{ nombre: 'Importe', explicacion: 'Lo que costó esa línea en el ticket, no el precio de una cápsula.' },
			{ nombre: 'Foto del ticket', explicacion: 'Opcional. Ayuda a comprobar la compra después.' },
		],
	},
	compra: {
		titulo: 'Detalle de una compra',
		proposito: 'Muestra las líneas de una compra, quién la hizo y la foto del ticket.',
		acciones: [{ nombre: 'Anular compra', explicacion: 'Deshace la compra y recalcula el precio de los cafés afectados.' }],
		campos: [],
	},
	consumo: {
		titulo: 'Detalle de un consumo',
		proposito: 'Muestra un café registrado: tipo, hora, precio aplicado y estado.',
		acciones: [{ nombre: 'Anular', explicacion: 'Quita el café de tu saldo y devuelve la cápsula al stock.' }],
		campos: [],
	},
	relleno: {
		titulo: 'Detalle de un relleno de agua',
		proposito: 'Muestra quién rellenó el depósito y cuándo.',
		acciones: [{ nombre: 'Anular relleno', explicacion: 'Quita el relleno del ranking del aguador.' }],
		campos: [],
	},
	estadisticas: {
		titulo: 'Estadísticas',
		proposito: 'Muestra el consumo de todo el departamento: cafés por persona, por tipo y por mes, visitantes y la hucha.',
		acciones: [
			{ nombre: 'Aplicar', explicacion: 'Cambia el periodo: mes actual, últimos 3 meses o últimos 12 meses.' },
			{ nombre: 'Ver datos', explicacion: 'Abre la tabla con los mismos valores que el gráfico.' },
		],
		campos: [],
	},
	estadisticasPersona: {
		titulo: 'Estadísticas de una persona',
		proposito: 'Muestra los cafés de una persona en el periodo elegido.',
		acciones: [{ nombre: 'Aplicar', explicacion: 'Cambia el periodo.' }],
		campos: [],
	},
	visitantes: {
		titulo: 'Visitantes',
		proposito: 'Crea un enlace de 24 horas para que alguien de fuera registre su café sin cuenta.',
		acciones: [
			{ nombre: 'Crear enlace de visitante', explicacion: 'Genera el enlace y su código QR para enseñarlo o compartirlo.' },
			{ nombre: 'Revocar', explicacion: 'Desactiva el enlace al momento.' },
		],
		campos: [],
	},
	perfil: {
		titulo: 'Perfil',
		proposito: 'Aquí cambias tu contraseña, la apariencia, la mascota y los avisos de este dispositivo.',
		acciones: [
			{ nombre: 'Cambiar contraseña', explicacion: 'Necesitas la actual y una nueva de al menos 15 caracteres.' },
			{ nombre: 'Cerrar sesión en todos los dispositivos', explicacion: 'Pide confirmación y te saca de todas partes.' },
		],
		campos: [{ nombre: 'Tema', explicacion: 'Automático sigue al sistema; Claro y Oscuro lo fijan en este dispositivo.' }],
	},
	avisos: {
		titulo: 'Avisos',
		proposito: 'Lista tus avisos: stock bajo, deuda, cafés de visitantes y otros.',
		acciones: [{ nombre: 'Abrir un aviso', explicacion: 'Lleva a la pantalla donde puedes actuar.' }],
		campos: [],
	},
	ayuda: {
		titulo: 'Ayuda',
		proposito: 'Explica cómo instalar la aplicación, activar los avisos y qué hace cada pantalla.',
		acciones: [{ nombre: 'Ver la bienvenida', explicacion: 'Repite la presentación de Capsulito.' }],
		campos: [],
	},
	capsulito: {
		titulo: 'Laboratorio de Capsulito',
		proposito: 'Muestra las poses y frases de la mascota.',
		acciones: [],
		campos: [],
	},
	privacidad: {
		titulo: 'Privacidad',
		proposito: 'Explica qué datos guarda beCafé, para qué y durante cuánto tiempo.',
		acciones: [],
		campos: [],
	},
	admin: {
		titulo: 'Administración',
		proposito: 'Reúne las tareas de administración: cápsulas, personas, arqueos, configuración, copias y visitantes.',
		acciones: [],
		campos: [],
	},
	adminCapsulas: {
		titulo: 'Cápsulas',
		proposito: 'Lista los tipos de cápsula y su estado.',
		acciones: [{ nombre: 'Nueva cápsula', explicacion: 'Da de alta un tipo nuevo.' }],
		campos: [],
	},
	adminCapsulaNueva: {
		titulo: 'Nueva cápsula',
		proposito: 'Da de alta un tipo de cápsula.',
		acciones: [{ nombre: 'Dar de alta', explicacion: 'Guarda el tipo. Se podrá comprar y consumir.' }],
		campos: [{ nombre: 'Umbral mínimo', explicacion: 'Por debajo de esta cantidad, la aplicación avisa de stock bajo.' }],
	},
	adminCapsula: {
		titulo: 'Ficha de una cápsula',
		proposito: 'Edita los datos de un tipo, ajusta su stock o lo retira.',
		acciones: [{ nombre: 'Retirar', explicacion: 'El tipo deja de aparecer en Inicio y en Compras.' }],
		campos: [{ nombre: 'Umbral mínimo', explicacion: 'Por debajo de esta cantidad, la aplicación avisa de stock bajo.' }],
	},
	adminUsuarios: {
		titulo: 'Usuarios',
		proposito: 'Da de alta personas, cambia su rol y gestiona sus bajas.',
		acciones: [{ nombre: 'Dar de alta', explicacion: 'Crea la cuenta y genera el enlace para que defina su contraseña.' }],
		campos: [],
	},
	adminUsuario: {
		titulo: 'Ficha de una persona',
		proposito: 'Muestra los datos de una persona y permite cambiar su rol o darla de baja.',
		acciones: [{ nombre: 'Dar de baja', explicacion: 'Abre el asistente que liquida su saldo antes de la baja.' }],
		campos: [],
	},
	adminBaja: {
		titulo: 'Baja de una persona',
		proposito: 'Liquida el saldo de la persona y la da de baja.',
		acciones: [{ nombre: 'Ver efecto', explicacion: 'Muestra cómo quedan su saldo y la hucha antes de confirmar.' }],
		campos: [{ nombre: 'Modo', explicacion: 'Elige si se le devuelve el saldo, si paga su deuda o si se reparte.' }],
	},
	adminControl: {
		titulo: 'Arqueos y recuentos',
		proposito: 'Compara el dinero de la hucha y las cápsulas reales con lo que dice la aplicación.',
		acciones: [{ nombre: 'Ver efecto', explicacion: 'Muestra la diferencia y su reparto antes de confirmar con tu contraseña.' }],
		campos: [
			{ nombre: 'Dinero contado en la hucha', explicacion: 'Lo que hay físicamente en la hucha ahora mismo.' },
			{ nombre: 'Cápsulas contadas', explicacion: 'Las cápsulas que quedan de verdad de cada tipo.' },
		],
	},
	adminConfiguracion: {
		titulo: 'Configuración',
		proposito: 'Ajusta los límites del departamento: deuda máxima, plazos y avisos.',
		acciones: [{ nombre: 'Guardar', explicacion: 'Aplica los valores nuevos desde ahora.' }],
		campos: [],
	},
	adminCopias: {
		titulo: 'Copias de seguridad',
		proposito: 'Lista las copias diarias y permite anotar las pruebas de restauración.',
		acciones: [{ nombre: 'Anotar prueba', explicacion: 'Registra que has restaurado una copia y su resultado.' }],
		campos: [],
	},
	adminVisitantes: {
		titulo: 'Cafés de visitantes',
		proposito: 'Revisa los cafés que han registrado los visitantes. Al aprobarlos, la cápsula sale del stock y la paga la hucha.',
		acciones: [
			{ nombre: 'Aprobar', explicacion: 'Resta la cápsula del stock. No cambia ningún saldo.' },
			{ nombre: 'Rechazar', explicacion: 'Descarta el café sin efectos.' },
			{ nombre: 'Anular', explicacion: 'Devuelve al stock la cápsula de un café aprobado.' },
		],
		campos: [],
	},
	visita: {
		titulo: 'Tu café',
		proposito: 'Toca la cápsula que has tomado. El café queda pendiente hasta que un administrador lo apruebe.',
		acciones: [{ nombre: 'Tocar una cápsula', explicacion: 'Anota tu café. No necesitas cuenta.' }],
		campos: [],
	},
	entradaVisita: {
		titulo: 'Entrar como visitante',
		proposito: 'Escribe tu nombre para que el departamento sepa quién tomó el café.',
		acciones: [{ nombre: 'Entrar', explicacion: 'Abre la pantalla para anotar tu café durante la vigencia del enlace.' }],
		campos: [{ nombre: 'Tu nombre', explicacion: 'Entre 1 y 60 caracteres. Se puede borrar a petición tuya.' }],
	},
} as const satisfies Record<string, EntradaAyuda>;

export type IdPantalla = keyof typeof AYUDA;

export const CATALOGO_AYUDA: Readonly<Record<IdPantalla, EntradaAyuda>> = Object.freeze(AYUDA);

/** Pantalla de ayuda de cada ruta de SvelteKit (`page.route.id`). */
const RUTAS: Readonly<Record<string, IdPantalla>> = Object.freeze({
	'/(app)': 'inicio',
	'/(app)/saldos': 'saldos',
	'/(app)/saldos/aportaciones/[aportacionId=ulid]': 'aportacion',
	'/(app)/saldos/personas/[usuarioId=ulid]': 'aportacionesPersona',
	'/(app)/historial': 'historial',
	'/(app)/historial/control/[id=ulid]': 'registroControl',
	'/(app)/compras': 'compras',
	'/(app)/compras/[compraId=ulid]': 'compra',
	'/(app)/consumos/[consumoId=ulid]': 'consumo',
	'/(app)/rellenos/[rellenoId=ulid]': 'relleno',
	'/(app)/estadisticas': 'estadisticas',
	'/(app)/estadisticas/[usuarioId=ulid]': 'estadisticasPersona',
	'/(app)/visitantes': 'visitantes',
	'/(app)/perfil': 'perfil',
	'/(app)/avisos': 'avisos',
	'/(app)/ayuda': 'ayuda',
	'/(app)/ayuda/capsulito': 'capsulito',
	'/(app)/privacidad': 'privacidad',
	'/(app)/admin': 'admin',
	'/(app)/admin/capsulas': 'adminCapsulas',
	'/(app)/admin/capsulas/nueva': 'adminCapsulaNueva',
	'/(app)/admin/capsulas/[capsulaId=ulid]': 'adminCapsula',
	'/(app)/admin/usuarios': 'adminUsuarios',
	'/(app)/admin/usuarios/[usuarioId=ulid]': 'adminUsuario',
	'/(app)/admin/usuarios/[usuarioId=ulid]/baja': 'adminBaja',
	'/(app)/admin/control': 'adminControl',
	'/(app)/admin/configuracion': 'adminConfiguracion',
	'/(app)/admin/copias': 'adminCopias',
	'/(app)/admin/visitantes': 'adminVisitantes',
	'/(visita)/visita': 'visita',
	'/(visita)/visita/[token=token]': 'entradaVisita',
});

/** Pantalla de ayuda de una ruta, o `undefined` si la ruta no tiene ayuda (p. ej. la entrada). */
export function pantallaDeRuta(routeId: string | null): IdPantalla | undefined {
	return routeId === null ? undefined : RUTAS[routeId];
}

/** Lista ordenada para `/ayuda`: cada entrada con su identificador, que es también el ancla (`/ayuda#<id>`). */
export function listaAyuda(): { id: IdPantalla; entrada: EntradaAyuda }[] {
	return Object.values(RUTAS)
		.filter((id, indice, todas) => todas.indexOf(id) === indice)
		.map((id) => ({ id, entrada: CATALOGO_AYUDA[id] }));
}

/** Consulta de `/ayuda` (sin JavaScript, desde el «?»): la pantalla cuya ayuda se muestra primero. */
export const esquemaConsultaAyuda = z.strictObject({
	pantalla: z.enum(Object.keys(AYUDA)).optional(),
});

export function esIdPantalla(valor: string): valor is IdPantalla {
	return valor in AYUDA;
}
