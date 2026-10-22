import { defineConfig, devices } from '@playwright/test';

// Proyectos de docs/pruebas.md §12.3 (DEC-090). Cada worker arranca su propio servidor con la build (e2e/fixtures/servidor.ts).
export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/fixtures/preparar.ts',
	outputDir: 'test-results',
	fullyParallel: true,
	// Una build tiene un solo origen (`kit.paths.origin`, fijado con ORIGIN al compilar): todos los servidores de prueba
	// usan http://127.0.0.1:4300, así que solo puede haber un servidor a la vez.
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
	use: {
		locale: 'es-ES',
		timezoneId: 'Europe/Madrid',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'off',
	},
	projects: [
		{
			name: 'chromium-movil',
			testIgnore: ['**/api/**', '**/sin-js/**'],
			use: { ...devices['Pixel 7'] },
		},
		{
			name: 'webkit-movil',
			testIgnore: ['**/api/**', '**/sin-js/**'],
			use: { ...devices['iPhone 13'] },
		},
		{
			name: 'chromium-escritorio',
			testIgnore: ['**/api/**', '**/sin-js/**'],
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
		},
		{
			name: 'sin-js',
			testMatch: ['**/sin-js/**/*.spec.ts'],
			use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
		},
		{
			name: 'api',
			testMatch: ['**/api/**/*.spec.ts'],
		},
	],
});
