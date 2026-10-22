import { z } from 'zod';

// Preferencias de apariencia del dispositivo (RF-180, RF-181; DEC-095). Se guardan solo en `localStorage` del navegador.
// Un valor que no esté en la lista cerrada se trata como el valor por defecto: nunca llega al `data-*` del documento.
export const CLAVE_TEMA = 'becafe-tema';
export const CLAVE_TRANSPARENCIA = 'becafe-transparencia';

export const esquemaTema = z.enum(['auto', 'claro', 'oscuro']);
export const esquemaTransparencia = z.enum(['normal', 'reducida']);

export type PreferenciaTema = z.infer<typeof esquemaTema>;
export type PreferenciaTransparencia = z.infer<typeof esquemaTransparencia>;

/** Valor de tema guardado, o `auto` si falta o no es válido (RF-180: «Automático» es el inicial). */
export function interpretarTema(valor: unknown): PreferenciaTema {
	const resultado = esquemaTema.safeParse(valor);
	return resultado.success ? resultado.data : 'auto';
}

/** Valor de transparencia guardado, o `normal` si falta o no es válido (RF-181). */
export function interpretarTransparencia(valor: unknown): PreferenciaTransparencia {
	const resultado = esquemaTransparencia.safeParse(valor);
	return resultado.success ? resultado.data : 'normal';
}
