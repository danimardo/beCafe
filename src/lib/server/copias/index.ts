// API pública de `copias`. El resto de módulos usa estas funciones; las tablas se exportan para las pruebas.
export { copiaSeguridad } from './esquema';
export {
	ErrorCopia,
	ErrorOperacionCopia,
	ErrorRestauracion,
	CODIGOS_OPERACION_COPIA,
	CODIGOS_RESTAURACION,
	ESTADO_OPERACION_COPIA,
	type CodigoCopia,
	type CodigoOperacionCopia,
	type CodigoRestauracion,
} from './errores';
export { hacerCopiaManual } from './copia-manual';
export { descargarCopia, type CopiaDescargable } from './descarga';
export { construirClave, leerClave, origenDeSistema, ORIGEN_LOCAL, TIPOS_COPIA_CLAVE, type TipoCopiaClave } from './dominio/clave-copia';
export { hacerCopiaDiaria, prepararArranqueCopias, claveDeCopia, TAREA_COPIA_DIARIA, type DependenciasCopia } from './copia-diaria';
export {
	crearSubidaS3,
	crearClienteS3,
	analizarListado,
	esquemaClaveCopia,
	type ConfiguracionS3,
	type Subidor,
	type ClienteS3,
	type CopiaBucket,
} from './subida-s3';
export {
	restaurarCopia,
	leerCopiaARestaurar,
	claveDeResguardo,
	esquemaRestaurar,
	ESTADO_RESTAURACION,
	type RestauracionPendiente,
} from './restauracion';
export { aplicarRestauracionPendiente } from './aplicar-restauracion';
export { exigirPermisoCopias } from './permiso';
export { leerCopias, type CopiaLista, LIMITE_COPIAS_PANEL } from './consultas';
export { unificarCopias, COPIAS_POR_PAGINA, LIMITE_COPIAS_LISTADO, type FilaCopia, type PaginaCopias } from './dominio/listado';
// Servidor S3 falso para las pruebas de integración y de rutas.
export { crearS3Falso, type S3Falso, type RespuestaFalsa } from './pruebas/s3-falso';
export { verificarCopia, type ResultadoVerificacion } from './verificacion';
