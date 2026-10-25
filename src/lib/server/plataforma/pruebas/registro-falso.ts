import type { CamposEvento, CodigoClienteEvento, CodigoEvento, Registrador } from '../registro';
import { NIVEL_EVENTO } from '../registro';

// Registrador de pruebas (constitución XVI): guarda los eventos y falla si uno contiene un dato prohibido.

export type EventoRegistrado = { codigo: CodigoEvento; nivel: string; origen: 'servidor' | 'cliente'; campos: Record<string, unknown> };

const CLAVES_PROHIBIDAS =
	/^(nombre|email|correo|contrasena|contrasenaActual|contrasenaNueva|repeticion|token|cookie|enlace|importe|endpoint|keys|texto)$/;
const FORMA_DE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function comprobarCampos(codigo: CodigoEvento, campos: Record<string, unknown>): void {
	for (const [clave, valor] of Object.entries(campos)) {
		if (CLAVES_PROHIBIDAS.test(clave)) throw new Error(`${codigo}: campo prohibido «${clave}»`);
		if (typeof valor === 'string' && FORMA_DE_CORREO.test(valor)) throw new Error(`${codigo}: «${clave}» tiene forma de correo`);
	}
}

export function crearRegistroFalso(): Registrador & { eventos: EventoRegistrado[]; enlacesSoloSalida: string[] } {
	const eventos: EventoRegistrado[] = [];
	const enlacesSoloSalida: string[] = [];
	return {
		eventos,
		enlacesSoloSalida,
		registrar<C extends CodigoEvento>(codigo: C, campos: CamposEvento[C]) {
			const plano: Record<string, unknown> = { ...campos };
			comprobarCampos(codigo, plano);
			eventos.push({ codigo, nivel: NIVEL_EVENTO[codigo], origen: 'servidor', campos: plano });
		},
		registrarCliente<C extends CodigoClienteEvento>(codigo: C, campos: CamposEvento[C]) {
			const plano: Record<string, unknown> = { ...campos };
			comprobarCampos(codigo, plano);
			eventos.push({ codigo, nivel: NIVEL_EVENTO[codigo], origen: 'cliente', campos: plano });
		},
		registrarEnlaceSoloSalida(enlace: string) {
			enlacesSoloSalida.push(enlace);
		},
	};
}
