import { defineConfig } from 'drizzle-kit';

// Solo genera migraciones: la aplicación las aplica al arrancar (plataforma/db). No necesita credenciales.
export default defineConfig({
	dialect: 'sqlite',
	schema: [
		'./src/lib/server/usuarios/esquema.ts',
		'./src/lib/server/auth/esquema.ts',
		'./src/lib/server/configuracion/esquema.ts',
		'./src/lib/server/catalogo/esquema.ts',
		'./src/lib/server/economia/esquema.ts',
		'./src/lib/server/notificaciones/esquema.ts',
		'./src/lib/server/plataforma/db/esquema-planificador.ts',
	],
	out: './drizzle',
});
