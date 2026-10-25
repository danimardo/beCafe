// API pública de `economia`. Las tablas y el dominio no se exportan: los otros módulos usan estas funciones (ARCHITECTURE.md §4).
export { darDeAltaCapsula, editarCapsula, cambiarEstadoCapsula, borrarCapsula, type DatosCapsulaEntrada } from './capsulas';
export { leerEstadoTipos, leerAvisosStock, leerCatalogoAdmin, leerCapsulaAdmin, type FilaEstado } from './panel';
export { fijarStock, fijarUmbral } from './existencias';
export type { EstimacionDias } from './dominio/stock';
export { registrarAportacion, type DatosAportacion, type ResultadoAportacion } from './aportaciones';
export {
	leerSaldoPropio,
	leerSaldoHucha,
	leerSaldos,
	leerAportacionesPropias,
	leerAportacion,
	leerAportacionesDe,
	APORTACIONES_POR_PAGINA,
	type AportacionDePersona,
	type SaldoDePersona,
	type UltimoArqueo,
} from './saldos';
export {
	leerHistorial,
	leerRegistroDeControl,
	TAMANO_PAGINA,
	type FilaHistorial,
	type FiltrosHistorial,
	type PaginaHistorial,
	type RegistroDeControl,
	type TipoEntradaHistorial,
} from './historial';
export {
	registrarCompra,
	anularCompra,
	leerComprasRecientes,
	leerTiposComprables,
	leerCompra,
	leerFotoTicket,
	type DatosCompra,
	type LineaCompra,
	type ResultadoCompra,
	type ResumenRegularizacion,
} from './compras';
export { anularAportacion } from './anulaciones';
export {
	registrarConsumo,
	deshacerConsumo,
	anularConsumo,
	leerTiposRegistrables,
	leerConsumosRecientesPropios,
	leerConsumo,
	leerHistorialConsumos,
	type DatosConsumo,
	type ResultadoConsumo,
	type TipoRegistrable,
} from './consumos';
export { leerPersonasBajoLimite, type PersonaBajoLimite } from './panel';
export { contarConsumos, primerConsumo, type ConsumoEstadistico } from './consultas-estadisticas';
export {
	leerControl,
	previsualizarArqueo,
	previsualizarRecuento,
	confirmarArqueo,
	confirmarRecuento,
	anularArqueo,
	anularLineaRecuento,
	type PrevisionArqueo,
	type PrevisionLinea,
	type LineaRecuentoEntrada,
} from './control';
export { darDeBaja, leerLiquidacion, modosPosibles, previsualizarBaja, type ModoBaja, type PrevisionBaja } from './baja';
export { recordarDeudas, TAREA_RECORDATORIO_DEUDA } from './recordatorio-deuda';
export { saldoPersona, leerEvolucionHucha } from './libro';
export {
	registrarCafeVisitante,
	revisarCafesVisitante,
	anularCafeVisitante,
	leerCafesVisitante,
	leerCafesDeVisita,
	contarCafesVisitante,
	contarCafesVisitantePendientes,
	leerTiposParaVisitante,
	type EstadoCafeVisitante,
	type DecisionCafeVisitante,
	type FilaCafeVisitante,
	type ResultadoRevision,
} from './cafes-visitante';
