import type { Component } from 'svelte';
import type { ResolvedPathname } from '$app/types';

export interface NavItem {
	href: ResolvedPathname;
	label: string;
	/** Rutas adicionales que dejan este elemento marcado como activo (p. ej. /historial cuelga de Saldos). */
	alsoActive?: string[];
	/** Componente de icono de Lucide. */
	icon: Component<{ class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export type ErrorKind = 'no-encontrada' | 'sin-permiso' | 'servidor' | 'sin-conexion';
