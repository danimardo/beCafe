import type { Component } from 'svelte';
import type { ResolvedPathname } from '$app/types';

export interface NavItem {
	href: ResolvedPathname;
	label: string;
	/** Etiqueta corta para el carril de iconos (768–1023 px), p. ej. «Arqueos». Si falta, se usa `label`. */
	short?: string;
	/** Rutas adicionales que dejan este elemento marcado como activo (p. ej. /historial cuelga de Saldos). */
	alsoActive?: string[];
	/** No aparece en la barra móvil (5 secciones); sí en el carril y la barra lateral. */
	hiddenOnMobile?: boolean;
	/** Rutas que dejan este elemento activo solo en la barra móvil (p. ej. /ajustes marca Perfil porque allí no hay entrada propia). */
	alsoActiveMobile?: string[];
	/** Componente de icono de Lucide. */
	icon: Component<{ class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export type ErrorKind = 'peticion' | 'no-encontrada' | 'sin-permiso' | 'servidor' | 'sin-conexion';
