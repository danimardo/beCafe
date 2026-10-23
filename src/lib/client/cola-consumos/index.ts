// API pública de la cola sin conexión de consumos (RF-015 a RF-019, RF-063). Solo la usa la pantalla principal.
export { anadirElemento, borrarElemento, listarElementos, limpiarRechazados, marcarRechazado } from './cola';
export { enviarPendientes, type Enviador, type ResultadoEnvio } from './envio';
