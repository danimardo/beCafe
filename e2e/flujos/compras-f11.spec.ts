import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { rellenarLineaDeCompra, tiposDeCompra } from '../fixtures/economia';
import { textos } from '#lib/shared/textos';

// F11: fallos de la compra rápida de F10 (RF-211, RF-212). Se reproducen antes de corregirlos (AGENTS.md §7).

test('CA-211: una línea con cantidad y sin importe marca ese campo y no abre la confirmación de hucha negativa', async ({
	page,
	servidor,
}) => {
	const [primero, segundo] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');

	await page.getByRole('spinbutton', { name: `Cantidad de ${primero}`, exact: true }).fill('16');
	await rellenarLineaDeCompra(page, segundo, '1', '9000,00');
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();

	await expect(page.getByRole('alertdialog')).toBeHidden();
	const importe = page.getByRole('textbox', { name: `Importe de ${primero}`, exact: true });
	await expect(importe).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByText(textos.economia.importeObligatorio)).toBeVisible();
	await expect(page.getByRole('alert').filter({ hasText: textos.economia.revisaImportes }).first()).toBeFocused();

	// Al escribir el importe, el error desaparece.
	await importe.fill('6,40');
	await expect(importe).not.toHaveAttribute('aria-invalid', 'true');
});

test('CA-212: si el envío confirmado desde el diálogo falla, el diálogo se cierra y el error queda en primer plano', async ({
	page,
	servidor,
}) => {
	const [primero] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/compras`);
	await page.waitForLoadState('load');

	await rellenarLineaDeCompra(page, primero, '1', '9000,00');
	// Un identificador de tipo que no es un ULID: la validación del servidor lo rechaza después de confirmar la hucha negativa.
	await page.locator('input[name="tipo"]').evaluateAll((entradas) => {
		for (const entrada of entradas) if (entrada instanceof HTMLInputElement) entrada.value = 'no-es-un-ulid';
	});
	await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
	const dialogo = page.getByRole('alertdialog');
	await expect(dialogo).toBeVisible();
	await dialogo.getByRole('button', { name: textos.economia.registrarIgualmente, exact: true }).click();

	await expect(dialogo).toBeHidden();
	const resumen = page.getByRole('alert').first();
	await expect(resumen).toBeVisible();
	await expect(resumen).toBeFocused();
	await expect(page).toHaveURL(/\/compras$/);
});
