import { defineConfig } from 'vite';

// Empaqueta el comando de recuperación de administrador para `node build-scripts/recuperar-admin.js` (contracts/api.md).
// Las dependencias de `node_modules` quedan externas (Vite las externaliza en SSR).
export default defineConfig({
	build: {
		ssr: 'scripts/servidor/recuperar-admin.ts',
		outDir: 'build-scripts',
		emptyOutDir: true,
		rollupOptions: { output: { entryFileNames: 'recuperar-admin.js', format: 'es' } },
	},
});
