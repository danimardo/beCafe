import { test, expect } from '../fixtures/errores-navegador';
import { tipoConCoste } from '../fixtures/consumos';
import { cerrarSesion, recontar } from '../fixtures/economia';
import { entrarComo } from '../fixtures/sesiones';

// F12 US4 (RF-246), sin JavaScript: «Entendido» es un formulario y quita el aviso de Inicio.
// El recuento lo registra un administrador con JavaScript (el formulario de recuento necesita su vista previa en el cliente);
// la persona que mira el aviso entra en un contexto sin JavaScript.

test.use({ javaScriptEnabled: true });

test('CA-246: sin JavaScript, «Entendido» quita el aviso de Inicio', async ({ browser, page, servidor }) => {
	const tipo = await tipoConCoste(page, servidor);
	await cerrarSesion(page, servidor);
	await entrarComo(page, servidor, 'administrador');
	await recontar(page, servidor, tipo, '0');

	const contextoSinJs = await browser.newContext({ javaScriptEnabled: false });
	try {
		const sinJs = await contextoSinJs.newPage();
		await entrarComo(sinJs, servidor, 'miembro');
		await sinJs.goto(`${servidor.url}/`);
		const aviso = sinJs.getByText(`Faltaban 1 ${tipo}; 3,48`, { exact: false });
		await expect(aviso).toBeVisible();

		await sinJs.getByRole('button', { name: 'Entendido', exact: true }).click();
		await expect(aviso).toBeHidden();
	} finally {
		await contextoSinJs.close();
	}
});
