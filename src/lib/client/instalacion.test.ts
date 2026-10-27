import { describe, expect, it, vi } from 'vitest';
import { capturarInstalacion, crearInstalacion, estadoBase, type EstadoInstalacion } from './instalacion';

// RF-206: la tarjeta de instalación depende de este estado. Se simula la ventana con un EventTarget.
function ventanaFalsa(opciones: { agente?: string; standalone?: boolean; tactil?: number } = {}) {
	const destino = new EventTarget();
	return {
		addEventListener: (tipo: string, escucha: (evento: Event) => void) => destino.addEventListener(tipo, escucha),
		removeEventListener: (tipo: string, escucha: (evento: Event) => void) => destino.removeEventListener(tipo, escucha),
		dispatchEvent: (evento: Event) => destino.dispatchEvent(evento),
		matchMedia: () => ({ matches: opciones.standalone ?? false }),
		navigator: { userAgent: opciones.agente ?? 'Mozilla/5.0 (Linux; Android 14) Chrome/130', maxTouchPoints: opciones.tactil ?? 0 },
	};
}

function peticion(resultado: 'accepted' | 'dismissed') {
	const evento = new Event('beforeinstallprompt', { cancelable: true });
	return Object.assign(evento, { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: resultado }) });
}

describe('instalación de la PWA (RF-206)', () => {
	it('CA-206: estadoBase distingue instalada, iOS y no disponible', () => {
		expect(estadoBase({ instalada: true, ios: true })).toBe('instalada');
		expect(estadoBase({ instalada: false, ios: true })).toBe('ios');
		expect(estadoBase({ instalada: false, ios: false })).toBe('no_disponible');
	});

	it('CA-206: Chrome pasa a «instalable» con beforeinstallprompt y «instalada» tras aceptar', async () => {
		const ventana = ventanaFalsa();
		const estados: EstadoInstalacion[] = [];
		const instalacion = crearInstalacion(ventana, (estado) => estados.push(estado));
		const aviso = peticion('accepted');

		ventana.dispatchEvent(aviso);
		expect(aviso.defaultPrevented).toBe(true);
		expect(instalacion.estado()).toBe('instalable');
		expect(await instalacion.instalar()).toBe('instalada');
		expect(aviso.prompt).toHaveBeenCalledTimes(1);
		expect(estados).toEqual(['no_disponible', 'instalable', 'instalada']);
		instalacion.destruir();
	});

	it('CA-206: si se rechaza el diálogo del sistema, la tarjeta deja de ofrecer el botón', async () => {
		const ventana = ventanaFalsa();
		const instalacion = crearInstalacion(ventana, () => {});
		ventana.dispatchEvent(peticion('dismissed'));

		expect(await instalacion.instalar()).toBe('no_disponible');
		instalacion.destruir();
	});

	it('CA-206: iPhone y iPad muestran instrucciones; una app ya instalada no ofrece nada', () => {
		expect(crearInstalacion(ventanaFalsa({ agente: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari' }), () => {}).estado()).toBe('ios');
		expect(crearInstalacion(ventanaFalsa({ agente: 'Mozilla/5.0 (Macintosh) Safari', tactil: 5 }), () => {}).estado()).toBe('ios');
		const instalada = ventanaFalsa({ standalone: true });
		const instalacion = crearInstalacion(instalada, () => {});
		instalada.dispatchEvent(peticion('accepted'));
		expect(instalacion.estado()).toBe('instalada');
	});

	it('CA-206: appinstalled marca la app como instalada y destruir deja de escuchar', () => {
		const ventana = ventanaFalsa();
		const instalacion = crearInstalacion(ventana, () => {});
		ventana.dispatchEvent(new Event('appinstalled'));
		expect(instalacion.estado()).toBe('instalada');

		const otra = ventanaFalsa();
		const avisos: EstadoInstalacion[] = [];
		const destruida = crearInstalacion(otra, (estado) => avisos.push(estado));
		destruida.destruir();
		otra.dispatchEvent(peticion('accepted'));
		// La captura sigue guardando el aviso para otra pantalla, pero esta ya no recibe cambios.
		expect(avisos).toEqual(['no_disponible']);
	});

	it('CA-276: un aviso que llega antes de crear la instalación (p. ej. en el acceso) no se pierde', async () => {
		const ventana = ventanaFalsa();
		capturarInstalacion(ventana);
		ventana.dispatchEvent(peticion('accepted'));

		const instalacion = crearInstalacion(ventana, () => {});
		expect(instalacion.estado()).toBe('instalable');
		expect(instalacion.diagnostico().avisoRecibido).toBe(true);
		expect(await instalacion.instalar()).toBe('instalada');
		expect(instalacion.diagnostico()).toMatchObject({ instalada: true, resultado: 'aceptada' });
	});

	it('CA-277: el diagnóstico refleja conexión segura, servicio de fondo y un diálogo rechazado', async () => {
		const ventana = { ...ventanaFalsa(), isSecureContext: true };
		const instalacion = crearInstalacion(ventana, () => {});
		expect(instalacion.diagnostico()).toEqual({
			conexionSegura: true,
			trabajadorActivo: false,
			avisoRecibido: false,
			instalada: false,
			resultado: null,
		});

		ventana.dispatchEvent(peticion('dismissed'));
		await instalacion.instalar();
		expect(instalacion.diagnostico()).toMatchObject({ avisoRecibido: true, resultado: 'rechazada' });
	});

	it('CA-276: un aviso guardado por el script de arranque antes de cargar el cliente también se recoge', () => {
		const ventana = { ...ventanaFalsa(), __becafeAviso: peticion('accepted') };
		const instalacion = crearInstalacion(ventana, () => {});
		expect(instalacion.estado()).toBe('instalable');
		expect(instalacion.diagnostico().avisoRecibido).toBe(true);
	});
});
