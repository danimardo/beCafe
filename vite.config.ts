import adapter from '@sveltejs/adapter-node';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// Constantes de compilación (contrato entorno-y-eventos, PEND-035): versión de package.json y commit.
function commit(): string {
	if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;
	try {
		return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return 'desconocido';
	}
}

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__APP_COMMIT__: JSON.stringify(commit()),
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Runes obligatorias en todo el proyecto (Svelte 5).
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
			},
			// RT-003: despliegue en contenedor Docker con Coolify.
			adapter: adapter(),
			// Origen fijo para la comprobación CSRF de los formularios. Sin él, el adaptador lo deduce de las cabeceras y, sin
			// `x-forwarded-proto`, asume https: los formularios de un servidor http reciben 403.
			paths: { origin: process.env.ORIGIN },
			// RNF-016: política de contenido con nonce para los scripts de SvelteKit. Los estilos admiten `style=""` de Svelte.
			csp: {
				mode: 'nonce',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'manifest-src': ['self'],
					'worker-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
				},
			},
		}),
	],
	test: {
		// Dos proyectos (docs/pruebas.md §7 y §9): unidad e integración en Node, y componentes con estado en un navegador real.
		projects: [
			{
				extends: true,
				test: {
					name: 'servidor',
					environment: 'node',
					include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
					exclude: ['src/lib/ui/**', 'node_modules/**'],
					testTimeout: 10_000,
				},
			},
			{
				extends: true,
				test: {
					name: 'componentes',
					include: ['src/lib/ui/**/*.test.ts'],
					testTimeout: 10_000,
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
		// Constitución VIII: 80 % en server y shared en conjunto; 90 % en economia y en cada dominio/.
		// Los umbrales no se bajan ni se excluyen archivos para cumplirlos.
		coverage: {
			provider: 'v8',
			include: ['src/lib/server/**/*.ts', 'src/lib/shared/**/*.ts'],
			exclude: ['**/*.test.ts', '**/pruebas/**', '**/esquema.ts', '**/index.ts', '**/*.d.ts'],
			reporter: ['text', 'json-summary'],
			thresholds: {
				lines: 80,
				branches: 80,
				'src/lib/server/economia/**': { lines: 90, branches: 90 },
				'src/lib/server/**/dominio/**': { lines: 90, branches: 90 },
			},
		},
	},
});
