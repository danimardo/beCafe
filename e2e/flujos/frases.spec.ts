import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { botonDeInvitado, botonDeToque, tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion, registrarCompra } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { entrarComo } from '../fixtures/sesiones';
import { activarPersona, darDeAltaYLeerEnlace } from '../fixtures/usuarios';
import { FRASES_REGISTRO, FRASES_SALUDO } from '#lib/shared/mascota/frases';

// F11: frases de Capsulito del anexo, sin repetir por persona (CA-213, CA-214, CA-215; RN-088, RN-089).

const REGISTRO = FRASES_REGISTRO.map((frase) => frase.texto);
const SALUDO = FRASES_SALUDO.map((frase) => frase.texto);

function bocadillo(page: Page) {
	return page.locator('[role="group"][aria-label="Capsulito"]');
}

/** Espera a que el bocadillo diga una frase de la lista y la devuelve. */
async function fraseDicha(page: Page, lista: readonly string[]): Promise<string> {
	let encontrada = '';
	await expect
		.poll(async () => {
			const contenido = await bocadillo(page).innerText();
			encontrada = lista.find((texto) => contenido.includes(texto)) ?? '';
			return encontrada;
		})
		.not.toBe('');
	return encontrada;
}

/** Un tipo con 3 cápsulas de stock: alcanza para varios toques sin pasar por la confirmación de «Sin stock». */
async function tipoConVariasCapsulas(page: Page, servidor: Parameters<typeof tipoConCoste>[1]): Promise<string> {
	const tipo = await tipoConCoste(page, servidor);
	await registrarCompra(page, servidor, tipo, '3,48', true);
	await registrarCompra(page, servidor, tipo, '3,48', true);
	return tipo;
}

test('CA-213: un café propio y otro de invitado muestran cada uno una frase de registro del anexo, distintas entre sí', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConVariasCapsulas(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	// RF-219: el bocadillo se anuncia sin mover el foco.
	await expect(bocadillo(page)).toHaveAttribute('aria-live', 'polite');
	await botonDeToque(page, tipo).click();
	const propia = await fraseDicha(page, REGISTRO);
	await botonDeInvitado(page, tipo).click();
	await expect.poll(async () => (await bocadillo(page).innerText()).includes(propia)).toBe(false);
	const invitado = await fraseDicha(page, REGISTRO);

	expect(invitado).not.toBe(propia);
});

test('CA-213: sin conexión, el café queda «Pendiente de enviar» y Capsulito no dice una frase de registro', async ({ page, servidor }) => {
	const tipo = await tipoConVariasCapsulas(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	await page.context().setOffline(true);
	await botonDeToque(page, tipo).click();
	await expect(page.getByText(`${tipo} · Pendiente de enviar`)).toBeVisible();
	const contenido = await bocadillo(page).innerText();
	expect(REGISTRO.some((texto) => contenido.includes(texto))).toBe(false);
	await page.context().setOffline(false);
});

test('CA-213: con Capsulito oculto no hay bocadillo ni frase, pero el café se registra', async ({ page, servidor }) => {
	const tipo = await tipoConVariasCapsulas(page, servidor);
	await page.evaluate(() => localStorage.setItem('becafe-mascota', 'oculta'));
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	await botonDeToque(page, tipo).click();

	await expect(
		page
			.getByRole('status')
			.filter({ hasText: `${tipo} registrado` })
			.first(),
	).toBeVisible();
	await expect(bocadillo(page)).toHaveCount(0);
});

test('CA-214: una cuenta nueva oye un saludo del anexo al abrir Inicio y después ve el aviso de stock bajo; al recargar no hay otro saludo', async ({
	browser,
	page,
	servidor,
}) => {
	await tipoConCoste(page, servidor);
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('Saludo'));
	await cerrarSesion(page, servidor);

	const contexto = await browser.newContext();
	const persona = await contexto.newPage();
	await activarPersona(persona, servidor, enlace, true);
	await persona.waitForLoadState('load');

	await fraseDicha(persona, SALUDO);
	// Pasado el saludo, el bocadillo vuelve al aviso de stock bajo (RN-089).
	await expect(bocadillo(persona)).toContainText('Quedan pocas de algunas cápsulas.', { timeout: 15_000 });

	await persona.reload();
	await persona.waitForLoadState('load');
	await expect(bocadillo(persona)).toContainText('Quedan pocas de algunas cápsulas.');
	const contenido = await bocadillo(persona).innerText();
	expect(SALUDO.some((texto) => contenido.includes(texto))).toBe(false);
	await contexto.close();
});

test('CA-215: dos dispositivos de la misma cuenta que registran a la vez no reciben la misma frase', async ({
	browser,
	page,
	servidor,
}) => {
	const tipo = await tipoConVariasCapsulas(page, servidor);
	await page.goto(`${servidor.url}/`);
	await page.waitForLoadState('load');

	const contexto = await browser.newContext();
	// Un contexto nuevo no pasa por la fixture: sin esto, la bienvenida de antes de entrar tapa el formulario (RF-195).
	await contexto.addInitScript(() => {
		try {
			localStorage.setItem('becafe-bienvenida', 'vista');
		} catch {
			// Sin almacenamiento disponible.
		}
	});
	const otro = await contexto.newPage();
	await entrarComo(otro, servidor, 'miembro');
	await otro.waitForLoadState('load');

	await Promise.all([botonDeToque(page, tipo).click(), botonDeToque(otro, tipo).click()]);
	const [primera, segunda] = await Promise.all([fraseDicha(page, REGISTRO), fraseDicha(otro, REGISTRO)]);

	expect(primera).not.toBe(segunda);
	await contexto.close();
});
