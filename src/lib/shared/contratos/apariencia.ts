import { z } from 'zod';

// Preferencias de apariencia y mascota del dispositivo (RF-180, RF-181, RF-185, RF-187; DEC-095, DEC-110).
// Se guardan solo en `localStorage` del navegador. Un valor que no esté en la lista cerrada se trata
// como el valor por defecto: nunca llega al `data-*` del documento.
export const CLAVE_TEMA = 'becafe-tema';
export const CLAVE_TRANSPARENCIA = 'becafe-transparencia';
export const CLAVE_MASCOTA = 'becafe-mascota';
export const CLAVE_VOZ = 'becafe-voz';
export const CLAVE_BIENVENIDA = 'becafe-bienvenida';

export const esquemaTema = z.enum(['auto', 'claro', 'oscuro']);
export const esquemaTransparencia = z.enum(['normal', 'reducida']);
export const esquemaMascota = z.enum(['visible', 'oculta']);
export const esquemaVoz = z.enum(['activa', 'silenciada']);
export const esquemaBienvenida = z.enum(['pendiente', 'vista']);

export type PreferenciaTema = z.infer<typeof esquemaTema>;
export type PreferenciaTransparencia = z.infer<typeof esquemaTransparencia>;
export type PreferenciaMascota = z.infer<typeof esquemaMascota>;
export type PreferenciaVoz = z.infer<typeof esquemaVoz>;
export type PreferenciaBienvenida = z.infer<typeof esquemaBienvenida>;

// Esquema de una pista de sincronización labial pregenerada (static/mascota/voces/*.json, RF-187, ADR-0006).
export const esquemaCueLipSync = z.strictObject({
	start: z.number().min(0),
	end: z.number().min(0),
	value: z.number().int().min(1).max(7),
});

export const esquemaPistaLipSync = z.strictObject({
	version: z.literal(1),
	audio: z.string().min(1),
	texto: z.string(),
	duration: z.number().min(0),
	cues: z.array(esquemaCueLipSync),
});

export type CueLipSync = z.infer<typeof esquemaCueLipSync>;
export type PistaLipSync = z.infer<typeof esquemaPistaLipSync>;

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

/** Valor de visibilidad de Capsulito guardado, o `visible` si falta o no es válido (RF-185). */
export function interpretarMascota(valor: unknown): PreferenciaMascota {
	const resultado = esquemaMascota.safeParse(valor);
	return resultado.success ? resultado.data : 'visible';
}

/** Valor de voz de Capsulito guardado, o `activa` si falta o no es válido (RF-187). */
export function interpretarVoz(valor: unknown): PreferenciaVoz {
	const resultado = esquemaVoz.safeParse(valor);
	return resultado.success ? resultado.data : 'activa';
}

/** Valor de bienvenida guardada, o `pendiente` si falta o no es válido (RF-185). */
export function interpretarBienvenida(valor: unknown): PreferenciaBienvenida {
	const resultado = esquemaBienvenida.safeParse(valor);
	return resultado.success ? resultado.data : 'pendiente';
}
