// Matchers de parámetros de ruta (SvelteKit 3). SvelteKit los carga con Node fuera de Vite, así que no importan nada del
// proyecto: los patrones son los mismos de `contratos/auth.ts` (token) y `contratos/comunes.ts` (ULID). Constitución VI.
import { z } from 'zod';

export const params = {
	token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
	ulid: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/),
};
