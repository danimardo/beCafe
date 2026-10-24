// API pública de `estadisticas`. Solo lectura: la pantalla y la tarea programada usan estas funciones (ARCHITECTURE.md §4).
export { leerEquipo, leerPersonales, resolverPeriodo, type ConsultaPeriodo, type EstadisticasDeConsumo } from './consultas';
export type { Periodo } from './dominio/periodos';
export { enviarResumenMensual, mesAnteriorDe, TAREA_RESUMEN_MENSUAL } from './resumen-mensual';
export { leerHistorial, type FilaGeneral, type FiltrosGenerales, type PaginaGeneral, type TipoFilaHistorial } from './historial';
