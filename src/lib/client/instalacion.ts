// Instalación de la PWA (plan F10 D9, RF-206). Único lugar del cliente que escucha `beforeinstallprompt` y `appinstalled`.
// El estado es por componente: `crearInstalacion` devuelve su propio estado, no hay variables de módulo.

export type EstadoInstalacion = 'instalable' | 'ios' | 'instalada' | 'no_disponible';

type PeticionInstalacion = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function esPeticion(evento: Event): evento is PeticionInstalacion {
	return 'prompt' in evento && typeof evento.prompt === 'function' && 'userChoice' in evento;
}

/** Estado sin el aviso del sistema: instalada, iPhone o iPad (instrucciones a mano) o sin posibilidad de instalar. */
export function estadoBase(datos: { instalada: boolean; ios: boolean }): EstadoInstalacion {
	if (datos.instalada) return 'instalada';
	return datos.ios ? 'ios' : 'no_disponible';
}

/** Lo mínimo que se usa de `window`: así la prueba puede sustituirla sin aserciones de tipo. */
export type VentanaInstalable = {
	addEventListener: (tipo: string, escucha: (evento: Event) => void) => void;
	removeEventListener: (tipo: string, escucha: (evento: Event) => void) => void;
	matchMedia: (consulta: string) => { matches: boolean };
	navigator: { userAgent: string; maxTouchPoints: number; serviceWorker?: { controller: unknown } };
	isSecureContext?: boolean;
};

function esIos(ventana: VentanaInstalable): boolean {
	const agente = ventana.navigator.userAgent;
	// iPadOS 13+ se presenta como Mac con pantalla táctil.
	return /iPhone|iPad|iPod/.test(agente) || (/Macintosh/.test(agente) && ventana.navigator.maxTouchPoints > 1);
}

function esInstalada(ventana: VentanaInstalable): boolean {
	return (
		ventana.matchMedia('(display-mode: standalone)').matches || ('standalone' in ventana.navigator && ventana.navigator.standalone === true)
	);
}

export type ResultadoInstalacion = 'aceptada' | 'rechazada' | 'error';

/** Lo que el navegador ha dicho desde que cargó la página. Se llena desde el arranque (`hooks.client.ts`), en cualquier pantalla. */
type Captura = {
	peticion: PeticionInstalacion | null;
	recibida: boolean;
	instalada: boolean;
	resultado: ResultadoInstalacion | null;
	suscriptores: Set<() => void>;
};

// `beforeinstallprompt` se lanza una sola vez al cargar: si nadie lo escucha en ese momento, se pierde. Una captura por ventana.
const capturas = new WeakMap<object, Captura>();

/** Empieza a escuchar el aviso del sistema. Es idempotente: se llama al arrancar el cliente y otra vez al crear la instalación. */
export function capturarInstalacion(ventana: VentanaInstalable): Captura {
	const existente = capturas.get(ventana);
	if (existente) return existente;
	const captura: Captura = { peticion: null, recibida: false, instalada: false, resultado: null, suscriptores: new Set() };
	const avisar = () => captura.suscriptores.forEach((suscriptor) => suscriptor());
	ventana.addEventListener('beforeinstallprompt', (evento) => {
		if (!esPeticion(evento) || esInstalada(ventana)) return;
		// El navegador mostraría su propia barra: se guarda el aviso para ofrecerlo desde la tarjeta.
		evento.preventDefault();
		captura.peticion = evento;
		captura.recibida = true;
		avisar();
	});
	// Si el aviso llegó antes de arrancar el cliente, lo guardó el script de `app.html` en la ventana.
	const previo: unknown = Reflect.get(ventana, '__becafeAviso');
	if (previo instanceof Event && esPeticion(previo) && !esInstalada(ventana)) {
		captura.peticion = previo;
		captura.recibida = true;
	}
	ventana.addEventListener('appinstalled', () => {
		captura.peticion = null;
		captura.instalada = true;
		avisar();
	});
	capturas.set(ventana, captura);
	return captura;
}

/** Datos para explicar por qué se ofrece o no instalar. Solo en memoria: el navegador no guarda nada (constitución V). */
export type DiagnosticoInstalacion = {
	conexionSegura: boolean;
	trabajadorActivo: boolean;
	avisoRecibido: boolean;
	instalada: boolean;
	resultado: ResultadoInstalacion | null;
};

export type Instalacion = {
	estado: () => EstadoInstalacion;
	diagnostico: () => DiagnosticoInstalacion;
	/** Abre el diálogo del sistema. Solo desde un clic; devuelve el estado resultante. */
	instalar: () => Promise<EstadoInstalacion>;
	destruir: () => void;
};

/** Empieza a escuchar. `alCambiar` recibe el estado inicial de inmediato y cada cambio posterior. */
export function crearInstalacion(ventana: VentanaInstalable, alCambiar: (estado: EstadoInstalacion) => void): Instalacion {
	const captura = capturarInstalacion(ventana);
	const estado = (): EstadoInstalacion => {
		if (captura.instalada || esInstalada(ventana)) return 'instalada';
		if (captura.peticion !== null) return 'instalable';
		return estadoBase({ instalada: false, ios: esIos(ventana) });
	};
	const emitir = () => alCambiar(estado());
	captura.suscriptores.add(emitir);
	emitir();

	return {
		estado,
		diagnostico: () => ({
			conexionSegura: ventana.isSecureContext === true,
			trabajadorActivo: Boolean(ventana.navigator.serviceWorker?.controller),
			avisoRecibido: captura.recibida,
			instalada: estado() === 'instalada',
			resultado: captura.resultado,
		}),
		instalar: async () => {
			const guardada = captura.peticion;
			if (guardada === null) return estado();
			captura.peticion = null;
			try {
				await guardada.prompt();
				const { outcome } = await guardada.userChoice;
				captura.resultado = outcome === 'accepted' ? 'aceptada' : 'rechazada';
				if (outcome === 'accepted') captura.instalada = true;
			} catch {
				// Un fallo del diálogo del sistema no es un error de la aplicación: se anota y la tarjeta deja de ofrecer el botón.
				captura.resultado = 'error';
			}
			emitir();
			return estado();
		},
		destruir: () => captura.suscriptores.delete(emitir),
	};
}
