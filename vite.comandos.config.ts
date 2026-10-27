import { defineConfig } from 'vite';

// Empaqueta los comandos de servidor en `build-scripts/` (contracts/api.md y T057):
// `recuperar-admin.js` (RF-139b) y `sembrar-e2e.js` (datos de prueba de E2E).
// Las dependencias de `node_modules` quedan externas (Vite las externaliza en SSR), salvo `@sveltejs/kit`: es de desarrollo
// y `src/env.ts` importa `defineEnvVars` de ella, así que va dentro del paquete para que el comando corra en la imagen
// de producción (sin dependencias de desarrollo).
export default defineConfig({
	ssr: { noExternal: ['@sveltejs/kit'] },
	build: {
		ssr: true,
		outDir: 'build-scripts',
		emptyOutDir: true,
		rollupOptions: {
			input: {
				'recuperar-admin': 'scripts/servidor/recuperar-admin.ts',
				'sembrar-e2e': 'scripts/servidor/sembrar-e2e.ts',
			},
			output: { entryFileNames: '[name].js', format: 'es' },
		},
	},
});
