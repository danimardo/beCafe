// API pública de `rellenos`. Las tablas se exportan para las pruebas de otros módulos; el resto de módulos usa estas funciones.
export { registrarRelleno, type PersonaRelleno, type ResultadoRelleno } from './registrar';
export { anularRelleno, deshacerRelleno, MOTIVO_DESHACER } from './anular';
export {
	leerEstadoAgua,
	leerRelleno,
	leerRellenos,
	contarRellenos,
	contarRellenosHistorial,
	leerAguador,
	type EstadoAgua,
	type RellenoLeido,
	type UltimoRelleno,
} from './consultas';
export { determinarAguador, TAREA_AGUADOR } from './aguador';
export { rellenoAgua, aguadorMes } from './esquema';
