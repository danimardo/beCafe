import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { crearEnlaceVisitante } from '../fixtures/visitantes';
import { darDeAltaYLeerEnlace } from '../fixtures/usuarios';

// F13 (RF-249), sin JavaScript: la portada del corto es una mejora que necesita JavaScript (la marca de bienvenida vive en el
// navegador, igual que la bienvenida de RF-195). Sin él, las tres pantallas siguen funcionando y no queda nada bloqueado.
// Los enlaces los genera un administrador con JavaScript; la persona que mira abre un contexto sin JavaScript.

test.use({ javaScriptEnabled: true });

test('CA-249: sin JavaScript, /login, el enlace de visitante y el enlace de alta no muestran el corto y siguen funcionando', async ({
	browser,
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	const enlaceVisitante = await crearEnlaceVisitante(page, servidor);
	const enlaceAlta = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('CortoSinJs'));
	await cerrarSesion(page, servidor);

	const contextoSinJs = await browser.newContext({ javaScriptEnabled: false });
	try {
		const sinJs: Page = await contextoSinJs.newPage();

		await sinJs.goto(`${servidor.url}/login`);
		await expect(sinJs.getByRole('textbox', { name: 'Correo electrónico', exact: true })).toBeVisible();
		await expect(sinJs.getByRole('dialog')).toHaveCount(0);

		await sinJs.goto(enlaceVisitante);
		await expect(sinJs.getByRole('textbox', { name: 'Tu nombre', exact: true })).toBeVisible();
		await expect(sinJs.getByRole('dialog')).toHaveCount(0);

		await sinJs.goto(enlaceAlta);
		await expect(sinJs.getByRole('textbox', { name: 'Contraseña nueva', exact: true })).toBeVisible();
		await expect(sinJs.getByRole('dialog')).toHaveCount(0);
	} finally {
		await contextoSinJs.close();
	}
});
