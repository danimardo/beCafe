import { createRequire } from 'node:module';
import pino from 'pino';
import { operacionActual } from './contexto-operacion';

// Registro técnico (constitución XVI, ARCHITECTURE.md §9). Único punto de escritura del servidor: nadie llama a `console`.
// Los campos de cada código están tipados. Un evento no contiene nombres, correos, importes, secretos ni enlaces.

export const NIVEL_EVENTO = {
	'app.arranque': 'info',
	'app.migraciones_aplicadas': 'info',
	'app.entorno_invalido': 'fatal',
	'app.error_no_previsto': 'error',
	'app.salud': 'debug',
	'auth.admin_inicial_creado': 'info',
	'auth.sesion_iniciada': 'info',
	'auth.sesion_cerrada': 'info',
	'auth.acceso_fallido': 'warn',
	'auth.cuenta_bloqueada': 'warn',
	'auth.enlace_generado': 'info',
	'auth.enlace_usado': 'info',
	'auth.enlace_rechazado': 'info',
	'auth.contrasena_cambiada': 'info',
	'auth.reautenticacion': 'info',
	'auth.permiso_denegado': 'warn',
	'usuario.alta': 'info',
	'usuario.rol_cambiado': 'info',
	'usuario.reactivado': 'info',
	'capsula.alta': 'info',
	'capsula.modificada': 'info',
	'capsula.desactivada': 'info',
	'capsula.reactivada': 'info',
	'capsula.borrada': 'info',
	'foto.procesada': 'info',
	'foto.rechazada': 'warn',
	'stock.entrada_bajo_registrada': 'info',
	'registro.duplicado': 'info',
	'regularizacion.aplicada': 'info',
	'hucha.negativa_registrada': 'info',
	'usuario.baja': 'info',
	'aportacion.registrada': 'info',
	'compra.registrada': 'info',
	'anulacion.registrada': 'info',
	'arqueo.registrado': 'info',
	'recuento.registrado': 'info',
	'reparto.aplicado': 'info',
	'liquidacion.aplicada': 'info',
	'invariante.violada': 'error',
	'privacidad.aceptada': 'info',
	'peticion.completada': 'info',
	'operacion.rechazada': 'info',
	'dato.invalido': 'error',
	'cliente.registro_rechazado': 'warn',
	'cliente.push_suscripcion_fallida': 'warn',
	'cliente.error_no_previsto': 'warn',
	'consumo.registrado': 'info',
	'consumo.duplicado': 'info',
	'stock.negativo_registrado': 'warn',
	'aviso.registrado': 'info',
	'push.suscripcion_registrada': 'info',
	'push.enviado': 'debug',
	'push.fallido': 'warn',
	'push.suscripcion_caducada': 'info',
	'push.reintentos_agotados': 'error',
	'tarea.iniciada': 'info',
	'tarea.completada': 'info',
	'tarea.fallida': 'error',
} as const;

export type CodigoEvento = keyof typeof NIVEL_EVENTO;

export type CamposEvento = {
	'app.arranque': { version: string; commit: string; node: string; nivelLog: string };
	'app.migraciones_aplicadas': { aplicadas: number };
	'app.entorno_invalido': { variables: readonly string[] };
	'app.error_no_previsto': { tipo: string; pila: string };
	'app.salud': Record<string, never>;
	'auth.admin_inicial_creado': { usuarioId: string };
	'auth.sesion_iniciada': { usuarioId: string };
	'auth.sesion_cerrada': { usuarioId: string; alcance: 'actual' | 'todas' | 'otras' };
	'auth.acceso_fallido': { motivo: 'credenciales' | 'bloqueada' | 'baja' | 'desconocido'; usuarioId?: string };
	'auth.cuenta_bloqueada': { usuarioId: string };
	'auth.enlace_generado': { usuarioId: string; tipo: 'invitacion' | 'recuperacion'; origen: 'aplicacion' | 'arranque' | 'comando' };
	'auth.enlace_usado': { usuarioId: string; tipo: 'invitacion' | 'recuperacion' };
	'auth.enlace_rechazado': { motivo: 'usado' | 'caducado' | 'anulado' | 'desconocido' };
	'auth.contrasena_cambiada': { usuarioId: string; via: 'enlace' | 'perfil' };
	'auth.reautenticacion': { usuarioId: string; resultado: 'ok' | 'fallida' };
	'auth.permiso_denegado': { usuarioId: string; rutaId: string };
	'usuario.alta': { usuarioId: string; rol: 'miembro' | 'administrador' };
	'usuario.rol_cambiado': { usuarioId: string; rolNuevo: 'miembro' | 'administrador' };
	'usuario.reactivado': { usuarioId: string };
	'capsula.alta': { tipoCapsulaId: string };
	'capsula.modificada': { tipoCapsulaId: string };
	'capsula.desactivada': { tipoCapsulaId: string };
	'capsula.reactivada': { tipoCapsulaId: string };
	'capsula.borrada': { tipoCapsulaId: string };
	'foto.procesada': { bytes: number };
	'foto.rechazada': { motivo: 'formato' | 'no_legible' };
	'stock.entrada_bajo_registrada': { tipoCapsulaId: string };
	'registro.duplicado': { tipo: string; id: string };
	'regularizacion.aplicada': { compraId: string; consumos: number };
	'hucha.negativa_registrada': { origenTipo: string; origenId: string };
	'usuario.baja': { usuarioId: string; modo: 'ninguna' | 'pago' | 'devolucion' | 'incobrable' };
	'aportacion.registrada': { aportacionId: string };
	'compra.registrada': { compraId: string; lineas: number };
	'anulacion.registrada': { tipo: 'aportacion' | 'compra' | 'arqueo' | 'linea_recuento' | 'consumo'; id: string; deshecho?: boolean };
	'consumo.registrado': { consumoId: string; tipoCapsulaId: string; via: 'directo' | 'cola' };
	'consumo.duplicado': { consumoId: string };
	'stock.negativo_registrado': { tipoCapsulaId: string };
	'arqueo.registrado': { arqueoId: string };
	'recuento.registrado': { recuentoId: string; lineas: number };
	'reparto.aplicado': { origenTipo: 'arqueo' | 'linea_recuento' | 'baja'; miembros: number };
	'liquidacion.aplicada': { usuarioId: string; modo: 'ninguna' | 'pago' | 'devolucion' | 'incobrable' };
	'invariante.violada': { tipo: string; id?: string };
	'privacidad.aceptada': { usuarioId: string; version: number };
	'peticion.completada': { metodo: string; rutaId: string; estado: number; duracionMs: number };
	'operacion.rechazada': { codigo: string };
	'dato.invalido': { origen: string; id?: string; campo: string; incidencia: string };
	'cliente.registro_rechazado': { motivo: 'tamano' | 'frecuencia' | 'esquema' };
	'cliente.push_suscripcion_fallida': { motivo: 'sin_permiso' | 'sin_soporte' | 'red' | 'servidor' };
	'cliente.error_no_previsto': { tipo: string; pila: string };
	'aviso.registrado': { tipo: string; destinatarios: number };
	'push.suscripcion_registrada': { usuarioId: string };
	'push.enviado': { entregaId: string; codigoHttp: number };
	'push.fallido': { entregaId: string; codigoHttp: number; intento: number };
	'push.suscripcion_caducada': { suscripcionId: string };
	'push.reintentos_agotados': { entregaId: string };
	'tarea.iniciada': { tarea: string; periodo?: string };
	'tarea.completada': { tarea: string; duracionMs: number };
	'tarea.fallida': { tarea: string; duracionMs: number; tipo: string };
};

/** Un registrador recibe eventos ya tipados. El enlace de RF-139 tiene su propio método (solo salida estándar). */
export type Registrador = {
	registrar<C extends CodigoEvento>(codigo: C, campos: CamposEvento[C]): void;
	/** Eventos enviados por el navegador (`origen: 'cliente'`); solo los códigos de `CODIGOS_CLIENTE`. */
	registrarCliente<C extends CodigoClienteEvento>(codigo: C, campos: CamposEvento[C]): void;
	registrarEnlaceSoloSalida(enlace: string): void;
	/** Vacía los destinos asíncronos (fichero diario) antes de terminar el proceso. Los registradores sin destino asíncrono no lo definen. */
	cerrar?(): Promise<void>;
};

/** Códigos que el navegador puede enviar a `/api/registro-cliente` (contrato registro-cliente v1). */
export const CODIGOS_CLIENTE = [
	'dato.invalido',
	'cliente.error_no_previsto',
	'cliente.registro_rechazado',
	'cliente.push_suscripcion_fallida',
] as const;
export type CodigoClienteEvento = (typeof CODIGOS_CLIENTE)[number];

const registradorSilencioso: Registrador = {
	registrar: () => undefined,
	registrarCliente: () => undefined,
	registrarEnlaceSoloSalida: () => undefined,
};

// Recurso de proceso: lo fija la raíz de composición (`arranque.ts`) y lo cambian las pruebas.
let activo: Registrador = registradorSilencioso;

export function usarRegistro(registrador: Registrador): void {
	activo = registrador;
}

export function registrar<C extends CodigoEvento>(codigo: C, campos: CamposEvento[C]): void {
	activo.registrar(codigo, campos);
}

export function registrarDesdeCliente<C extends CodigoClienteEvento>(codigo: C, campos: CamposEvento[C]): void {
	activo.registrarCliente(codigo, campos);
}

export function registrarEnlaceSoloSalida(enlace: string): void {
	activo.registrarEnlaceSoloSalida(enlace);
}

/** Espera a que los eventos pendientes lleguen a su destino. Llamarla antes de `process.exit`. */
export async function cerrarRegistro(): Promise<void> {
	await activo.cerrar?.();
}

/** Claves que la configuración `redact` oculta como protección adicional (ARCHITECTURE.md §9). */
export const RUTAS_REDACTADAS = [
	'*.contrasena',
	'*.token',
	'*.cookie',
	'*.email',
	'*.correo',
	'*.importe',
	'*.nombre',
	'*.enlace',
	'*.secreto',
	'*.endpoint',
	'*.keys',
	'req.headers.cookie',
	'req.headers.authorization',
	'err.endpoint',
	'err.body',
	'err.headers',
];

type ConfiguracionRegistro = {
	nivel: string;
	version: string;
	commit: string;
	directorioLogs: string;
	desarrollo: boolean;
};

/**
 * Crea el registrador de producción: salida estándar y fichero diario de 30 días.
 * El enlace de RF-139 va solo a la salida estándar, por una instancia sin la ruta `*.enlace` redactada.
 */
/** Ruta absoluta de un transporte de pino. Con el nombre pelado, pino lo busca desde el fichero que lo llama, y tras el empaquetado no lo encuentra. */
function resolverDestino(paquete: string): string {
	return createRequire(import.meta.url).resolve(paquete);
}

export function crearRegistroPino(configuracion: ConfiguracionRegistro): Registrador {
	const base = { version: configuracion.version, commit: configuracion.commit };
	const formato = {
		formatters: { level: (nivel: string, numero: number) => ({ nivel, level: numero }) },
		timestamp: () => `,"instante":"${new Date().toISOString()}"`,
	};
	const transporte = pino.transport({
		targets: [
			configuracion.desarrollo
				? { target: resolverDestino('pino-pretty'), level: configuracion.nivel, options: { destination: 1 } }
				: { target: resolverDestino('pino/file'), level: configuracion.nivel, options: { destination: 1 } },
			{
				target: resolverDestino('pino-roll'),
				level: configuracion.nivel,
				options: { file: `${configuracion.directorioLogs}/becafe`, frequency: 'daily', mkdir: true, limit: { count: 30 } },
			},
		],
	});
	const instancia = pino(
		{ level: configuracion.nivel, base, redact: { paths: RUTAS_REDACTADAS, censor: '[REDACTADO]' }, ...formato },
		transporte,
	);
	const instanciaSalida = pino({ level: 'info', base, ...formato }, pino.destination(1));

	return {
		registrar(codigo, campos) {
			instancia[NIVEL_EVENTO[codigo]]({ codigo, origen: 'servidor', operacionId: operacionActual(), ...campos });
		},
		registrarCliente(codigo, campos) {
			instancia[NIVEL_EVENTO[codigo]]({ codigo, origen: 'cliente', operacionId: operacionActual(), ...campos });
		},
		registrarEnlaceSoloSalida(enlace) {
			instanciaSalida.info({ codigo: 'auth.admin_inicial_creado', operacionId: operacionActual(), enlace });
		},
		cerrar() {
			return new Promise<void>((resolver) => {
				transporte.once('close', () => resolver());
				transporte.end();
			});
		},
	};
}

/**
 * Registrador solo para la salida estándar. Lo usa el comando de recuperación cuando el entorno no es válido: en ese caso
 * no hay directorio de logs donde escribir. Mantiene la misma forma de evento y la misma redacción del enlace.
 */
export function crearRegistroSoloSalida(): Registrador {
	const formato = {
		formatters: { level: (nivel: string, numero: number) => ({ nivel, level: numero }) },
		timestamp: () => `,"instante":"${new Date().toISOString()}"`,
	};
	const instancia = pino({ level: 'info', ...formato }, pino.destination(1));
	return {
		registrar(codigo, campos) {
			instancia[NIVEL_EVENTO[codigo]]({ codigo, origen: 'servidor', operacionId: operacionActual(), ...campos });
		},
		registrarCliente(codigo, campos) {
			instancia[NIVEL_EVENTO[codigo]]({ codigo, origen: 'cliente', operacionId: operacionActual(), ...campos });
		},
		registrarEnlaceSoloSalida(enlace) {
			instancia.info({ codigo: 'auth.admin_inicial_creado', operacionId: operacionActual(), enlace });
		},
	};
}
