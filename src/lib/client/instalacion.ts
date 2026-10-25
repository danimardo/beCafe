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
	navigator: { userAgent: string; maxTouchPoints: number };
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

export type Instalacion = {
	estado: () => EstadoInstalacion;
	/** Abre el diálogo del sistema. Solo desde un clic; devuelve el estado resultante. */
	instalar: () => Promise<EstadoInstalacion>;
	destruir: () => void;
};

/** Empieza a escuchar. `alCambiar` recibe el estado inicial de inmediato y cada cambio posterior. */
export function crearInstalacion(ventana: VentanaInstalable, alCambiar: (estado: EstadoInstalacion) => void): Instalacion {
	let peticion: PeticionInstalacion | null = null;
	let actual = estadoBase({ instalada: esInstalada(ventana), ios: esIos(ventana) });
	const fijar = (estado: EstadoInstalacion) => {
		actual = estado;
		alCambiar(estado);
	};

	const alPedir = (evento: Event) => {
		if (!esPeticion(evento) || actual === 'instalada') return;
		// El navegador mostraría su propia barra: se guarda el aviso para ofrecerlo desde la tarjeta.
		evento.preventDefault();
		peticion = evento;
		fijar('instalable');
	};
	const alInstalar = () => {
		peticion = null;
		fijar('instalada');
	};
	ventana.addEventListener('beforeinstallprompt', alPedir);
	ventana.addEventListener('appinstalled', alInstalar);
	alCambiar(actual);

	return {
		estado: () => actual,
		instalar: async () => {
			const guardada = peticion;
			if (guardada === null) return actual;
			peticion = null;
			try {
				await guardada.prompt();
				const { outcome } = await guardada.userChoice;
				if (outcome === 'accepted') fijar('instalada');
				else fijar(estadoBase({ instalada: false, ios: esIos(ventana) }));
			} catch {
				// Un fallo del diálogo del sistema no es un error de la aplicación: la tarjeta deja de ofrecer el botón.
				fijar('no_disponible');
			}
			return actual;
		},
		destruir: () => {
			ventana.removeEventListener('beforeinstallprompt', alPedir);
			ventana.removeEventListener('appinstalled', alInstalar);
		},
	};
}
