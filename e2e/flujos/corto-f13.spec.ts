import { test, expect } from '../fixtures/errores-navegador';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { crearEnlaceVisitante } from '../fixtures/visitantes';
import { darDeAltaYLeerEnlace } from '../fixtures/usuarios';
import type { ServidorDePrueba } from '../fixtures/servidor';

// F13: el corto «El misterio de la última cápsula» antes de entrar (RF-249 a RF-252, CA-249 a CA-252).
const TITULO = 'El misterio de la última cápsula';

/** Un dispositivo limpio: sin la marca de bienvenida vista, como el de una persona que llega por primera vez. */
async function dispositivoLimpio(
	browser: Browser,
	opciones: { marcaVista?: boolean; sinConexion?: boolean } = {},
): Promise<{ contexto: BrowserContext; pagina: Page }> {
	const contexto = await browser.newContext();
	await contexto.addInitScript(
		([marcaVista, sinConexion]) => {
			try {
				if (marcaVista) localStorage.setItem('becafe-bienvenida', 'vista');
				if (sinConexion) Object.defineProperty(navigator, 'onLine', { get: () => false });
			} catch {
				// Sin almacenamiento disponible.
			}
		},
		[Boolean(opciones.marcaVista), Boolean(opciones.sinConexion)],
	);
	return { contexto, pagina: await contexto.newPage() };
}

async function enlaceDeAlta(page: Page, servidor: ServidorDePrueba): Promise<string> {
	await entrarComo(page, servidor, 'administrador');
	const enlace = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('Corto'));
	await cerrarSesion(page, servidor);
	return enlace;
}

test('CA-249: /login en un dispositivo limpio muestra primero el corto, y «Saltar» da paso a la bienvenida y al formulario', async ({
	browser,
	servidor,
}) => {
	const { contexto, pagina } = await dispositivoLimpio(browser);
	const peticiones: string[] = [];
	pagina.on('request', (peticion) => peticiones.push(peticion.url()));
	await pagina.goto(`${servidor.url}/login`);

	const corto = pagina.getByRole('dialog', { name: TITULO });
	await expect(corto).toBeVisible();
	await expect(corto.getByRole('button', { name: 'Ver el corto', exact: true })).toBeVisible();
	// RF-251: nada se descarga hasta que la persona pulsa «Ver el corto».
	expect(peticiones.filter((url) => url.endsWith('.mp4'))).toEqual([]);

	await corto.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(corto).toHaveCount(0);
	const bienvenida = pagina.getByRole('dialog', { name: 'Conoce a Capsulito' });
	await expect(bienvenida).toBeVisible();
	await bienvenida.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(pagina.getByRole('textbox', { name: 'Correo electrónico', exact: true })).toBeVisible();

	await pagina.reload();
	await expect(pagina.getByRole('dialog')).toHaveCount(0);
	await contexto.close();
});

test('CA-249: con un enlace de visitante el corto va antes que la bienvenida', async ({ browser, page, servidor }) => {
	await entrarComo(page, servidor, 'miembro');
	const enlace = await crearEnlaceVisitante(page, servidor);

	const { contexto, pagina } = await dispositivoLimpio(browser);
	await pagina.goto(enlace);
	const corto = pagina.getByRole('dialog', { name: TITULO });
	await expect(corto).toBeVisible();
	await corto.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(pagina.getByRole('dialog', { name: 'Conoce a Capsulito' })).toBeVisible();
	await contexto.close();
});

test('CA-249: con un enlace de alta o recuperación el corto va antes del formulario, sin bienvenida', async ({
	browser,
	page,
	servidor,
}) => {
	const enlace = await enlaceDeAlta(page, servidor);

	const { contexto, pagina } = await dispositivoLimpio(browser);
	await pagina.goto(enlace);
	const corto = pagina.getByRole('dialog', { name: TITULO });
	await expect(corto).toBeVisible();
	await corto.getByRole('button', { name: 'Saltar', exact: true }).click();
	await expect(corto).toHaveCount(0);
	await expect(pagina.getByRole('textbox', { name: 'Contraseña nueva', exact: true })).toBeVisible();
	await expect(pagina.getByRole('dialog')).toHaveCount(0);
	await contexto.close();
});

test('CA-249: con la marca de bienvenida vista no se muestra el corto en ninguna de las tres pantallas', async ({
	browser,
	page,
	servidor,
}) => {
	await entrarComo(page, servidor, 'administrador');
	const enlaceVisitante = await crearEnlaceVisitante(page, servidor);
	const enlaceAlta = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('Marca'));

	const { contexto, pagina } = await dispositivoLimpio(browser, { marcaVista: true });
	for (const url of [`${servidor.url}/login`, enlaceVisitante, enlaceAlta]) {
		await pagina.goto(url);
		await pagina.waitForLoadState('load');
		await expect(pagina.getByRole('dialog')).toHaveCount(0);
	}
	await contexto.close();
});

test('CA-249: sin conexión no se ofrece el corto y la pantalla funciona como hasta ahora', async ({ browser, servidor }) => {
	const { contexto, pagina } = await dispositivoLimpio(browser, { sinConexion: true });
	await pagina.goto(`${servidor.url}/login`);
	await expect(pagina.getByRole('dialog', { name: 'Conoce a Capsulito' })).toBeVisible();
	await expect(pagina.getByRole('dialog', { name: TITULO })).toHaveCount(0);
	await contexto.close();
});

test('CA-251: «Ver el corto» pide el vídeo solo al pulsar y deja los controles en manos del navegador', async ({ browser, servidor }) => {
	const { contexto, pagina } = await dispositivoLimpio(browser);
	await pagina.goto(`${servidor.url}/login`);
	const corto = pagina.getByRole('dialog', { name: TITULO });
	const peticion = pagina.waitForRequest((p) => p.url().endsWith('/corto/el-misterio-de-la-ultima-capsula.mp4'));
	await corto.getByRole('button', { name: 'Ver el corto', exact: true }).click();
	await peticion;

	// La transcripción está enlazada desde la portada.
	await corto.getByText('Leer la transcripción').click();
	await expect(corto.getByText('Buenos días, señora cafetera. Lo de siempre.')).toBeVisible();
	await contexto.close();
});

test('CA-252: «Saltar» está a la vista, mide al menos 24 × 24 px y se alcanza con el teclado', async ({ browser, servidor }) => {
	const { contexto, pagina } = await dispositivoLimpio(browser);
	await pagina.goto(`${servidor.url}/login`);
	const saltar = pagina.getByRole('dialog', { name: TITULO }).getByRole('button', { name: 'Saltar', exact: true });
	await expect(saltar).toBeInViewport();
	const caja = await saltar.boundingBox();
	expect(caja?.width ?? 0).toBeGreaterThanOrEqual(24);
	expect(caja?.height ?? 0).toBeGreaterThanOrEqual(24);
	await saltar.focus();
	await expect(saltar).toBeFocused();
	await contexto.close();
});

for (const donde of ['ajustes', 'ayuda'] as const) {
	test(`CA-250: «Ver el corto otra vez» en ${donde} abre el corto en un diálogo y se cierra sin perder la pantalla`, async ({
		page,
		servidor,
	}) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/${donde}`);
		await page.waitForLoadState('load');
		await page.getByRole('button', { name: 'Ver el corto otra vez', exact: true }).click();

		const corto = page.getByRole('dialog', { name: TITULO });
		await expect(corto).toBeVisible();
		await expect(corto.getByRole('button', { name: 'Saltar', exact: true })).toHaveCount(0);
		await corto.getByRole('button', { name: 'Cerrar el corto', exact: true }).click();
		await expect(corto).toHaveCount(0);
		await expect(page).toHaveURL(new RegExp(`/${donde}$`));
	});
}
