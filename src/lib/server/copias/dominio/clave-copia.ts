// Clave del objeto de una copia en el bucket, con su origen y su tipo (plan F17 D2, RF-289, ADR 0007). Funciones puras: sin reloj ni azar.

export const TIPOS_COPIA_CLAVE = ['diaria', 'manual', 'resguardo'] as const;
export type TipoCopiaClave = (typeof TIPOS_COPIA_CLAVE)[number];

import { ORIGEN_LOCAL } from '#lib/shared/copias/origen';

export { ORIGEN_LOCAL };

const PREFIJO_RESGUARDOS = 'becafe/resguardos/';

/** Dominio de un `ORIGIN` como se guarda en la clave: nombre en minúsculas, sin puerto; `local` para `localhost` y `127.0.0.1`. */
export function origenDeSistema(origin: string): string {
	const nombre = new URL(origin).hostname.toLowerCase();
	if (nombre === 'localhost' || nombre === '127.0.0.1') return ORIGEN_LOCAL;
	return nombre.replace(/[^a-z0-9.-]/g, '-');
}

export type EntradaClave = { instante: string; origen: string; tipo: TipoCopiaClave };

/** `becafe/AAAA/MM/becafe-<instante>__<origen>__<tipo>.tar.gz`; las de resguardo, bajo `becafe/resguardos/`. */
export function construirClave({ instante, origen, tipo }: EntradaClave): string {
	const base = tipo === 'resguardo' ? PREFIJO_RESGUARDOS : 'becafe/';
	return `${base}${instante.slice(0, 4)}/${instante.slice(5, 7)}/becafe-${instante.replaceAll(':', '-')}__${origen}__${tipo}.tar.gz`;
}

export type DatosClave = { origen: string | null; tipo: TipoCopiaClave };

const PATRON = /^becafe\/(?:resguardos\/)?\d{4}\/\d{2}\/becafe-[\dTZ.-]+?(?:__([a-z0-9.-]+)__(diaria|manual|resguardo))?\.tar\.gz$/;

/** Origen y tipo de una clave. Las claves anteriores a F17 no llevan origen (`null`); su tipo sale del prefijo. */
export function leerClave(clave: string): DatosClave {
	const coincidencia = PATRON.exec(clave);
	const tipoDePrefijo: TipoCopiaClave = clave.startsWith(PREFIJO_RESGUARDOS) ? 'resguardo' : 'diaria';
	const origen = coincidencia?.[1];
	const tipo = coincidencia?.[2];
	if (origen === undefined || tipo === undefined) return { origen: null, tipo: tipoDePrefijo };
	return { origen, tipo: tipo === 'manual' ? 'manual' : tipo === 'resguardo' ? 'resguardo' : 'diaria' };
}
