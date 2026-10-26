// API pública de `notificaciones` (ARCHITECTURE.md §3). Los demás módulos importan solo desde aquí.
export { registrarAviso, type EntradaAviso } from './registrar';
export { borrarSuscripcion, registrarSuscripcion, retirarPersona } from './suscripciones';
export {
	contarNuevos,
	leerAvisoRecuentoPendiente,
	leerPanel,
	marcarVisto,
	marcarVistos,
	ultimoAviso,
	type AvisoPanel,
	type PersonaPanel,
} from './panel';
export { cambiarPreferencia, leerPreferencias, type PersonaPreferencias, type PreferenciaVisible } from './preferencias';
export { entregarPendientes, borrarAvisosAntiguos, ESPERAS_MINUTOS, MAX_INTENTOS } from './entregar';
export { clavePublicaDesde, crearEnvioWebPush, type EnviarPush, type SuscripcionEnvio } from './entrega-push';
export { CATALOGO, construirMensaje, validarDatos, type Destinatarios, type MensajeAviso } from './catalogo';
// La tabla se exporta para leer los avisos en las pruebas de otros módulos (como en `usuarios`).
export { TIPOS_DESACTIVABLES, TIPOS_NOTIFICACION, type TipoNotificacion, notificacion, entregaPush, suscripcionPush } from './esquema';
