// API pública de `economia`. Las tablas y el dominio no se exportan: los otros módulos usan estas funciones (ARCHITECTURE.md §4).
export { darDeAltaCapsula, editarCapsula, cambiarEstadoCapsula, borrarCapsula, type DatosCapsulaEntrada } from './capsulas';
export { leerEstadoTipos, leerAvisosStock, leerCatalogoAdmin, leerCapsulaAdmin, type FilaEstado } from './panel';
export { fijarStock, fijarUmbral } from './existencias';
export type { EstimacionDias } from './dominio/stock';
export { registrarAportacion, type ResultadoAportacion } from './aportaciones';
export { leerSaldoPropio, leerSaldoHucha, leerAportacionesPropias, leerAportacion, type UltimoArqueo } from './saldos';
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
export { leerPersonasBajoLimite, type PersonaBajoLimite } from './panel';
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
