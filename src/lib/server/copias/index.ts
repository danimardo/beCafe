// API pública de `copias`. El resto de módulos usa estas funciones; las tablas se exportan para las pruebas.
export { copiaSeguridad, pruebaRestauracion } from './esquema';
export { ErrorCopia, type CodigoCopia } from './errores';
export { hacerCopiaDiaria, prepararArranqueCopias, claveDeCopia, TAREA_COPIA_DIARIA, type DependenciasCopia } from './copia-diaria';
export { crearSubidaS3, type ConfiguracionS3, type Subidor } from './subida-s3';
export {
	anotarPruebaRestauracion,
	esquemaAnotarPrueba,
	leerEstadoRestauracion,
	leerPruebas,
	exigirPermisoCopias,
	diasEntre,
	DIAS_SIN_PROBAR,
	type EstadoRestauracion,
} from './pruebas-restauracion';
export { leerCopias, type CopiaLista, LIMITE_COPIAS_PANEL } from './consultas';
export { verificarCopia, type ResultadoVerificacion } from './verificacion';
