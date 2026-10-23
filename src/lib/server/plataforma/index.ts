// API pública de la plataforma. La configuración del entorno (`entorno.ts`) no se reexporta a propósito (ver ese archivo).
export { ErrorDeNegocio, esErrorDeNegocio, registrarRechazo, RecursoNoEncontrado, CODIGOS_NEGOCIO, type CodigoNegocio } from './errores';
export { respuestaError, estadoDeNegocio } from './errores-http';
export { crearRegistroSoloSalida } from './registro';
export { relojReal, crearRelojFijo, type Reloj, type RelojFijo } from './reloj';
export { nuevoId } from './ids';
export { conOperacion, operacionActual } from './contexto-operacion';
export {
	NIVEL_EVENTO,
	registrar,
	registrarDesdeCliente,
	registrarEnlaceSoloSalida,
	cerrarRegistro,
	CODIGOS_CLIENTE,
	type CodigoClienteEvento,
	usarRegistro,
	crearRegistroPino,
	type CodigoEvento,
	type CamposEvento,
	type Registrador,
} from './registro';
export { abrirBaseDatos, aplicarMigraciones, baseDatosResponde, enTransaccion, type Conexion, type Db, type Tx } from './db/conexion';
export { crearLimitador, type Limitador } from './limitador';
export {
	crearPlanificador,
	marcarEjecucion,
	tieneEjecucion,
	ZONA_TAREAS,
	type DefinicionTarea,
	type Planificador,
	type ContextoEjecucion,
} from './planificador';
export { azarReal, crearAzarFijo, type Azar } from './azar';
export { procesarFoto, guardarFoto, borrarFoto, rutaFoto } from './imagenes';
export type { Ejecutor } from './db/conexion';
// Entorno de integración para las pruebas de los módulos y de las rutas (docs/pruebas.md §7).
export { crearEntornoPrueba, type EntornoPrueba } from './pruebas/entorno-prueba';
export type { Ambiente } from './ambiente';
