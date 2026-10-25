import { test, expect } from '../fixtures/errores-navegador';
import { botonDeToque, tipoConCoste } from '../fixtures/consumos';

// F11, sin JavaScript (constitución XVII): la tarjeta «Sin stock» pide confirmación en una página intermedia (CA-217, EV-107).

test('CA-217, EV-107: sin JavaScript, la tarjeta «Sin stock» muestra la pregunta; «Cancelar» no registra y «Sí, registrar» registra', async ({
	page,
	servidor,
}) => {
	const tipo = await tipoConCoste(page, servidor);
	await page.goto(`${servidor.url}/`);
	// El tipo tiene una sola cápsula: este toque la usa sin pedir confirmación (RF-011).
	await botonDeToque(page, tipo).click();
	await expect(page.getByText(`${tipo} registrado`).first()).toBeVisible();

	await botonDeToque(page, tipo).click();
	await expect(page.getByText('El sistema dice que no quedan')).toBeVisible();
	await expect(page.getByText(`${tipo}: ¿has cogido una igualmente?`)).toBeVisible();

	await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
	await expect(page.getByText('El sistema dice que no quedan')).toBeHidden();

	await botonDeToque(page, tipo).click();
	await page.getByRole('button', { name: 'Sí, registrar', exact: true }).click();
	await expect(page.getByText(`${tipo} registrado`).first()).toBeVisible();
	await expect(page.getByText('El sistema dice que no quedan')).toBeHidden();
});
