import { join } from 'node:path';
import { crearBaseTemporal, type BaseTemporal } from './base-temporal';
import { crearRegistroFalso, type EventoRegistrado } from './registro-falso';
import { crearLimitador } from '../limitador';
import { crearRelojFijo, type RelojFijo } from '../reloj';
import { usarRegistro } from '../registro';
import type { Ambiente } from '../ambiente';
import { crearAzarFijo, type Azar } from '../azar';

// Entorno de integración de una prueba: base SQLite temporal, reloj fijo y registrador falso (constitución VIII y XVI).
export const INSTANTE_INICIAL = '2026-10-21T09:00:00.000Z';

export type EntornoPrueba = {
	base: BaseTemporal;
	reloj: RelojFijo;
	ambiente: Ambiente;
	eventos(): EventoRegistrado[];
	cerrar(): void;
};

export function crearEntornoPrueba(inicio: string = INSTANTE_INICIAL, azar: Azar = crearAzarFijo([])): EntornoPrueba {
	const base = crearBaseTemporal();
	const registro = crearRegistroFalso();
	usarRegistro(registro);
	const reloj = crearRelojFijo(inicio);
	const ambiente: Ambiente = {
		db: base.db,
		reloj,
		origen: 'http://localhost:5173',
		directorioFotos: join(base.directorio, 'fotos'),
		limitadorRegistro: crearLimiteFalso(),
		limitadorAvisos: crearLimiteFalso(),
		azar,
	};
	return {
		base,
		reloj,
		ambiente,
		eventos: () => registro.eventos,
		cerrar() {
			usarRegistro({ registrar: () => undefined, registrarCliente: () => undefined, registrarEnlaceSoloSalida: () => undefined });
			base.cerrar();
		},
	};
}

function crearLimiteFalso() {
	return crearLimitador({ maximo: Number.MAX_SAFE_INTEGER, ventanaMs: 60_000 });
}
