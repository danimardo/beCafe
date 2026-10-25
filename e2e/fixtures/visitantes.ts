import { expect, type Browser, type Page } from '@playwright/test';
import type { ServidorDePrueba } from './servidor';

// Datos de prueba de visitantes (F10). El enlace se crea como miembro y se abre en un contexto aparte, sin sesión.

/** Crea un enlace de visitante en `/visitantes` y devuelve su URL (RF-189). */
export async function crearEnlaceVisitante(page: Page, servidor: ServidorDePrueba): Promise<string> {
	await page.goto(`${servidor.url}/visitantes`);
	await page.waitForLoadState('load');
	await page.getByRole('button', { name: 'Crear enlace de visitante', exact: true }).click();
	const campo = page.getByRole('textbox', { name: 'Enlace del visitante', exact: true });
	await expect(campo).toHaveValue(/\/visita\/[A-Za-z0-9_-]{43}$/);
	return campo.inputValue();
}

/** Abre el enlace en un contexto nuevo, escribe el nombre, acepta la privacidad y entra (RF-190). */
export async function entrarComoVisitante(browser: Browser, servidor: ServidorDePrueba, enlace: string, nombre: string): Promise<Page> {
	const contexto = await browser.newContext();
	await contexto.addInitScript(() => {
		try {
			localStorage.setItem('becafe-voz', 'silenciada');
			localStorage.setItem('becafe-bienvenida', 'vista');
		} catch {
			// Sin almacenamiento disponible.
		}
	});
	const visitante = await contexto.newPage();
	await visitante.goto(enlace);
	await visitante.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill(nombre);
	await visitante.getByRole('checkbox', { name: 'He leído el texto de privacidad', exact: true }).check();
	await visitante.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(visitante).toHaveURL(`${servidor.url}/visita`);
	return visitante;
}
