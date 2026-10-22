import { z } from 'zod';

export const ROLES = ['miembro', 'administrador'] as const;
export type Rol = (typeof ROLES)[number];
export const esquemaRol = z.enum(ROLES, { error: 'Elige un rol válido' });

export const ESTADOS = ['activo', 'baja'] as const;
export type Estado = (typeof ESTADOS)[number];
