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
			const peticionesFallidas: string[] = [];
			// Recargas de datos de SvelteKit (`__data.json`) canceladas por la navegación siguiente del propio test. No son
			// un fallo de la aplicación: el navegador las corta al salir de la página. Se cuentan para no exigir un «Load failed» suelto.
			let recargasCanceladas = 0;
			let respuestasCliente = 0;
			const permitido = (texto: string) => EXCEPCIONES.some((patron) => patron.test(texto));

			page.on('pageerror', (error) => {
				if (!permitido(error.message)) errores.push(`excepción: ${error.message}`);
			});
			page.on('console', (mensaje) => {
				if (mensaje.type() === 'error' && !permitido(mensaje.text())) consola.push(mensaje.text());
			});
			// Diagnóstico: una petición cortada (p. ej. «Load failed» en WebKit) queda con su método y su URL.
			page.on('requestfailed', (peticion) => {
				// Las bloqueadas por la política de contenido (csp) son esperadas en el proyecto sin JavaScript: no cuentan.
				const motivo = peticion.failure()?.errorText ?? '';
				const bloqueadaPorPolitica = motivo.includes('csp');
				if (peticion.url().includes('/__data.json') && /ERR_ABORTED|cancelled/.test(motivo)) {
					recargasCanceladas += 1;
					return;
				}
				if (peticion.url().startsWith(servidor.url) && !bloqueadaPorPolitica) {
					peticionesFallidas.push(`${peticion.method()} ${peticion.url()} (${peticion.failure()?.errorText ?? 'sin motivo'})`);
				}
			});
			page.on('response', (respuesta) => {
				if (!respuesta.url().startsWith(servidor.url)) return;
				if (respuesta.status() >= 500) errores.push(`HTTP ${respuesta.status()}: ${respuesta.url()}`);
				if (respuesta.status() >= 400 && respuesta.status() < 500) respuestasCliente += 1;
			});

			// La voz de Capsulito está activa por defecto (RF-187). Las pruebas parten de voz silenciada para no pedir audios que
			// la navegación siguiente corta. Solo se fija si no hay preferencia: una prueba que la cambia la conserva al recargar.
			await page.addInitScript(() => {
				try {
					if (localStorage.getItem('becafe-voz') === null) localStorage.setItem('becafe-voz', 'silenciada');
				} catch {
					// Sin almacenamiento disponible.
				}
			});

			await use(errores);

			// Un 4xx propio es un resultado esperado (p. ej. una página que no existe), no un fallo: la línea de consola
			// que el navegador escribe para ese mismo 4xx no cuenta. Un 5xx sí cuenta siempre.
			for (const texto of consola) {
				const duplicadaDeUn4xx = respuestasCliente > 0 && texto.startsWith('Failed to load resource');
				// En WebKit, la recarga cancelada aparece también como «TypeError: Load failed» (ver arriba).
				const duplicadaDeRecargaCancelada = texto === 'TypeError: Load failed' && recargasCanceladas > 0;
				if (!duplicadaDeUn4xx && !duplicadaDeRecargaCancelada) errores.push(`console.error: ${texto}`);
			}
			for (const peticion of peticionesFallidas) errores.push(`petición fallida: ${peticion}`);
			expect(errores, 'La página registró errores de navegador').toEqual([]);
		},
		{ auto: true },
	],
});

export { expect };
