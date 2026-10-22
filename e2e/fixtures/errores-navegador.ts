import { expect } from '@playwright/test';
import { test as conServidor } from './servidor';

// Excepciones permitidas al fallo automático. Empieza vacía (docs/pruebas.md §12.2): añadir una exige justificarla aquí.
const EXCEPCIONES: RegExp[] = [];

/**
 * Hace fallar el test si la página lanza una excepción, escribe un `console.error` o si una petición propia
 * responde 500 o más (docs/pruebas.md §12.2).
 */
export const test = conServidor.extend<{ erroresNavegador: string[] }>({
	erroresNavegador: [
		async ({ page, servidor }, use) => {
			const errores: string[] = [];
			const consola: string[] = [];
			let respuestasCliente = 0;
			const permitido = (texto: string) => EXCEPCIONES.some((patron) => patron.test(texto));

			page.on('pageerror', (error) => {
				if (!permitido(error.message)) errores.push(`excepción: ${error.message}`);
			});
			page.on('console', (mensaje) => {
				if (mensaje.type() === 'error' && !permitido(mensaje.text())) consola.push(mensaje.text());
			});
			page.on('response', (respuesta) => {
				if (!respuesta.url().startsWith(servidor.url)) return;
				if (respuesta.status() >= 500) errores.push(`HTTP ${respuesta.status()}: ${respuesta.url()}`);
				if (respuesta.status() >= 400 && respuesta.status() < 500) respuestasCliente += 1;
			});

			await use(errores);

			// Un 4xx propio es un resultado esperado (p. ej. una página que no existe), no un fallo: la línea de consola
			// que el navegador escribe para ese mismo 4xx no cuenta. Un 5xx sí cuenta siempre.
			for (const texto of consola) {
				const duplicadaDeUn4xx = respuestasCliente > 0 && texto.startsWith('Failed to load resource');
				if (!duplicadaDeUn4xx) errores.push(`console.error: ${texto}`);
			}
			expect(errores, 'La página registró errores de navegador').toEqual([]);
		},
		{ auto: true },
	],
});

export { expect };
