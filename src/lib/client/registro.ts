import log from 'loglevel';
import type { RegistroCliente } from '#lib/shared/contratos/registro-cliente';

// Registro del navegador (constitución XVI). Único archivo que importa `loglevel`. Envía en lotes solo `warn` y `error`
// del catálogo, y nunca guarda eventos ni el nivel en el navegador.
log.setDefaultLevel('warn');
const registrador = log.getLogger('becafe');

type Evento = RegistroCliente['eventos'][number];

const LOTE_MAXIMO = 10;
const RETRASO_MS = 5000;
const COLA_MAXIMA = 50;

const cola: Evento[] = [];
let temporizador: ReturnType<typeof setTimeout> | undefined;

/** Encola un evento del catálogo de cliente. La cola se vacía en lotes; si no hay red, el evento se descarta sin bloquear nada. */
export function registrarEnCliente(evento: Evento): void {
	registrador.warn(evento.codigo);
	if (cola.length >= COLA_MAXIMA) cola.shift();
	cola.push(evento);
	programar();
}

/** Registra que un dato guardado en el navegador no es válido. Solo se envía el campo, nunca el valor (constitución XVI). */
export function registrarDatoInvalido(origen: string, campo: string): void {
	registrarEnCliente({
		codigo: 'dato.invalido',
		instante: new Date().toISOString(),
		campos: { origen, campo, incidencia: 'valor-no-valido' },
	});
}

function programar(): void {
	temporizador ??= setTimeout(() => {
		void enviarLote();
	}, RETRASO_MS);
}

async function enviarLote(): Promise<void> {
	temporizador = undefined;
	const lote = cola.splice(0, LOTE_MAXIMO);
	if (lote.length === 0) return;
	try {
		await fetch('/api/registro-cliente', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ version: 1, eventos: lote }),
			keepalive: true,
		});
	} catch {
		// Sin conexión o red caída: el registro del cliente no bloquea ni deshace nada (constitución XIII).
	}
	if (cola.length > 0) programar();
}
