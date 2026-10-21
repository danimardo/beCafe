import type { Component } from 'svelte';

export interface NavItem {
	href: string;
	label: string;
	/** Componente de icono de Lucide. */
	/** Rutas adicionales que dejan este elemento marcado como activo (p. ej. /historial cuelga de Saldos). */
	alsoActive?: string[];
	icon: Component<{ class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export type ErrorKind = 'no-encontrada' | 'sin-permiso' | 'servidor' | 'sin-conexion';
