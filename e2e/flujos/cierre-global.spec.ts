import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// CA-137: cerrar sesión en todos los dispositivos invalida la otra sesión en su siguiente petición.
test('CA-137: cerrar en todos los dispositivos cierra también la sesión de otro dispositivo', async ({ browser, servidor }) => {
	const contextoAqui = await browser.newContext();
	const contextoOtro = await browser.newContext();
	try {
		const aqui = await contextoAqui.newPage();
		const otro = await contextoOtro.newPage();
		await entrarComo(aqui, servidor, 'miembro');
		await entrarComo(otro, servidor, 'miembro');

		await aqui.goto(`${servidor.url}/perfil`);
		await aqui.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos', exact: true }).click();
		await aqui.getByRole('button', { name: 'Cerrar todas las sesiones', exact: true }).click();
		await expect(aqui).toHaveURL(`${servidor.url}/login`);

		await otro.goto(`${servidor.url}/`);
		await expect(otro).toHaveURL(`${servidor.url}/login`);
	} finally {
		await contextoAqui.close();
		await contextoOtro.close();
	}
});
