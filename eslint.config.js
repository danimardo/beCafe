import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';

// Reglas de AGENTS.md §5 y §6. Las fronteras entre módulos y las librerías de un único archivo
// (ARCHITECTURE.md §4 y §11) las comprueba dependency-cruiser (`npm run arch`), porque ESLint no
// distingue archivos dentro de una misma regla. Ninguna regla se desactiva excluyendo archivos (constitución VII).

const PROHIBIDO_LIB = { group: ['$lib', '$lib/*'], message: 'Usa #lib/... (AGENTS.md §6).' };
const PROHIBIDO_APP_OBSOLETO = {
	group: ['$app/stores', '$app/environment', 'svelte/store'],
	message: 'Usa $app/state, $app/env y runes (AGENTS.md §6).',
};
const PROHIBIDO_ENV_ESTATICO = {
	group: ['$env/static/*', '$env/dynamic/*'],
	message: 'Declara la variable en src/env.ts y léela en plataforma/entorno.ts (AGENTS.md §6).',
};
const PROHIBIDO_ICONO_RAIZ = {
	paths: [{ name: '@lucide/svelte', message: 'Importa cada icono por ruta: @lucide/svelte/icons/<nombre> (AGENTS.md §6).' }],
};

export default ts.config(
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'node_modules/**',
			'coverage/**',
			'drizzle/**',
			'playwright-report/**',
			'test-results/**',
			'.local/**',
			'static/**',
			'src/tokens.css',
		],
	},
	js.configs.recommended,
	ts.configs.strictTypeChecked,
	svelte.configs.recommended,
	{
		files: ['**/*.ts', '**/*.svelte'],
		plugins: { 'eslint-comments': eslintComments },
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname, extraFileExtensions: ['.svelte'] },
		},
		rules: {
			'eslint-comments/no-use': ['error', { allow: [] }],
			'no-console': 'error',
			// Playwright exige el patrón `{}` para las fixtures que no tienen dependencias (e2e/fixtures/servidor.ts).
			'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
			'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			// `execCommand('copy')` es el único respaldo para copiar un enlace cuando la app se abre por http y `navigator.clipboard` no existe
			// (RF-238, `CopyField.svelte`). Se permite solo ese método; el resto de APIs obsoletas siguen prohibidas.
			'@typescript-eslint/no-deprecated': ['error', { allow: [{ from: 'lib', name: 'execCommand' }] }],
			'@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false }],
			// Los números son texto seguro en una plantilla; el resto de la regla sigue activa.
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
			// Un manejador como `() => cerrar()` devuelve void a propósito: se exime solo la forma abreviada.
			'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
			'no-restricted-imports': [
				'error',
				{ patterns: [PROHIBIDO_LIB, PROHIBIDO_APP_OBSOLETO, PROHIBIDO_ENV_ESTATICO], ...PROHIBIDO_ICONO_RAIZ },
			],
		},
	},
	{
		// Los módulos de Svelte en TypeScript (`*.svelte.ts`) usan el parser de TypeScript con tipos.
		files: ['**/*.svelte.ts'],
		languageOptions: { parser: ts.parser, parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelte.parser,
			parserOptions: { parser: ts.parser, projectService: true, tsconfigRootDir: import.meta.dirname, extraFileExtensions: ['.svelte'] },
		},
	},
	{
		// Herramientas en JavaScript fuera de un proyecto TypeScript: no hay tipos que leer, así que las reglas que
		// los necesitan no aplican. El resto de reglas sí se aplica a estos archivos.
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		extends: [ts.configs.disableTypeChecked],
		languageOptions: { globals: globals.node, parserOptions: { projectService: false, project: null } },
	},
	{
		// En una plantilla, `{@render snippet()}` es una instrucción que devuelve void dentro del contenido de un
		// elemento; no hay una forma equivalente que la regla acepte. La regla sigue activa en los archivos .ts.
		files: ['**/*.svelte'],
		rules: { '@typescript-eslint/no-confusing-void-expression': 'off' },
	},
	{
		files: ['src/routes/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PROHIBIDO_LIB,
						PROHIBIDO_APP_OBSOLETO,
						PROHIBIDO_ENV_ESTATICO,
						{ group: ['drizzle-orm', 'drizzle-orm/*', 'better-sqlite3'], message: 'Sin SQL ni drizzle-orm en src/routes (AGENTS.md §5).' },
					],
					...PROHIBIDO_ICONO_RAIZ,
				},
			],
		},
	},
);
