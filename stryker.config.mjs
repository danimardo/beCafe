// Pruebas de mutación piloto sobre `dominio/` (historias.md §10.3, ARCHITECTURE.md §14). Sin umbral hasta fijar la línea base.
// Se ejecuta aparte con `npm run test:mutacion`; no forma parte de `npm run verify`.
export default {
	testRunner: 'vitest',
	mutate: ['src/lib/server/**/dominio/**/*.ts', '!src/lib/server/**/*.test.ts'],
	thresholds: { break: null },
	reporters: ['clear-text', 'html'],
	htmlReporter: { fileName: 'reports/mutation/index.html' },
	coverageAnalysis: 'perTest',
	vitest: { configFile: 'vite.config.ts', related: false },
	tempDirName: '.local/stryker',
};
