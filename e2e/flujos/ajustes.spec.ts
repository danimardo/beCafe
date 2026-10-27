import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';

// F11 US4 (RF-221, RF-222): Ajustes para todas las personas y Perfil reducido a datos, foto, contraseña y sesiones.
test('CA-220: un miembro ve Ajustes en la navegación, no ve Configuración y sus ajustes funcionan', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	await page
		.getByRole('link', { name: /^Ajustes/ })
		.first()
		.click();
	await expect(page).toHaveURL(/\/ajustes$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Configuración', exact: true })).toHaveCount(0);

	// Apariencia, Capsulito, avisos e instalar viven en Ajustes y se guardan como antes.
	await expect(page.getByRole('radio', { name: 'Oscuro', exact: true })).toBeVisible();
	await expect(page.getByRole('switch', { name: 'Reducir transparencia', exact: true })).toBeVisible();
	const mascota = page.getByRole('switch', { name: 'Mostrar a Capsulito', exact: true });
	await mascota.click();
	await expect(page.locator('html')).toHaveAttribute('data-mascota', 'oculta');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-mascota', 'oculta');
	await page.getByRole('switch', { name: 'Stock bajo', exact: true }).click();
	await expect(page.getByRole('switch', { name: 'Stock bajo', exact: true })).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByRole('heading', { name: 'Instalar la aplicación' })).toBeVisible();
});

test('CA-221: Perfil conserva datos, foto, contraseña y sesiones, sin los ajustes movidos', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	await expect(page.getByRole('heading', { name: 'Foto' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Cambiar contraseña' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos', exact: true })).toBeVisible();
	await expect(page.getByRole('switch', { name: 'Reducir transparencia', exact: true })).toHaveCount(0);
	await expect(page.getByRole('switch', { name: 'Stock bajo', exact: true })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Apariencia' })).toHaveCount(0);
});

test('CA-221: a ≥ 1024 px, Perfil se reparte en dos columnas', async ({ page, servidor }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/perfil`);

	const foto = await page.getByRole('heading', { name: 'Foto' }).boundingBox();
	const contrasena = await page.getByRole('heading', { name: 'Cambiar contraseña' }).boundingBox();
	expect(foto && contrasena && contrasena.x > foto.x + 200).toBe(true);
});

test('CA-220: en móvil, Perfil queda activo en /ajustes y la barra no añade una sexta entrada', async ({ page, servidor }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);

	const barra = page.getByRole('navigation', { name: 'Principal' });
	await expect(barra.getByRole('link')).toHaveCount(5);
	await expect(barra.getByRole('link', { name: 'Perfil', exact: true })).toHaveAttribute('aria-current', 'page');
});

// RF-206: si el navegador no ofrece instalar, Ajustes explica por qué (diagnóstico) y da la vía manual.
test('CA-277: sin aviso del navegador, Ajustes muestra el diagnóstico y las instrucciones manuales', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	await page.goto(`${servidor.url}/ajustes`);
	await page.waitForLoadState('load');

	await expect(page.getByText('Instalar a mano', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Estado de la instalación' })).toBeVisible();
	await expect(page.getByText('El navegador ha ofrecido instalar', { exact: true })).toBeVisible();
});

// RF-276: un aviso de instalación que llega en el acceso se conserva y Ajustes lo ofrece sin recargar.
test('CA-276: un aviso de instalación recibido antes de entrar se ofrece después en Ajustes', async ({ page, servidor }) => {
	await page.addInitScript(() => {
		window.addEventListener('load', () => {
			const aviso = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
				prompt: () => Promise.resolve(),
				userChoice: Promise.resolve({ outcome: 'dismissed' }),
			});
			window.dispatchEvent(aviso);
		});
	});
	await entrarComo(page, servidor, 'miembro');
	await page.waitForLoadState('load');
	// Sin recargar: en móvil, Ajustes se alcanza desde Perfil.
	await page.getByRole('link', { name: 'Perfil', exact: true }).first().click();
	await page
		.getByRole('link', { name: /^Ajustes/ })
		.first()
		.click();

	await expect(page.getByRole('button', { name: 'Instalar', exact: true })).toBeVisible();
});
