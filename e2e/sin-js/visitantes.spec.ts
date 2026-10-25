import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';
import { crearEnlaceVisitante } from '../fixtures/visitantes';

// Visitantes sin JavaScript (constitución XVII): entrar con el enlace y registrar un café funcionan con formularios.

test('CA-190, CA-191: sin JavaScript, el visitante entra y registra un café pendiente', async ({ page, browser, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	const enlace = await crearEnlaceVisitante(page, servidor);

	const contexto = await browser.newContext({ javaScriptEnabled: false });
	const visitante = await contexto.newPage();
	await visitante.goto(enlace);
	await visitante.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Visitante sin JS');
	await visitante.getByRole('checkbox', { name: 'He leído el texto de privacidad', exact: true }).check();
	await visitante.getByRole('button', { name: 'Entrar', exact: true }).click();
	await expect(visitante).toHaveURL(`${servidor.url}/visita`);

	await visitante.getByRole('button', { name: `Registrar ${tipo}`, exact: true }).click();
	await expect(visitante.getByText('Pendiente de aprobación', { exact: true }).first()).toBeVisible();
	await contexto.close();
});
