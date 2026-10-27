import { test } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { cerrarSesion } from '../fixtures/economia';
import { nombreUnico } from '../fixtures/capsulas';
import { darDeAltaYLeerEnlace } from '../fixtures/usuarios';
import { expectSinInfracciones } from './axe';

// Constitución XI y XVIII: las pantallas de acceso y el perfil, en tema claro y oscuro, sin infracciones de axe.
test.describe('tema claro', () => {
	test.use({ colorScheme: 'light' });

	test('acceso: la entrada no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/login`);
		await expectSinInfracciones(page);
	});

	test('acceso: el enlace no válido no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/acceso/${'A'.repeat(43)}`);
		await expectSinInfracciones(page);
	});

	test('perfil: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);
		await expectSinInfracciones(page);
	});

	test('ajustes: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);
		await expectSinInfracciones(page);
	});
});

test.describe('tema oscuro', () => {
	test.use({ colorScheme: 'dark' });

	test('acceso: la entrada no tiene infracciones de axe', async ({ page, servidor }) => {
		await page.goto(`${servidor.url}/login`);
		await expectSinInfracciones(page);
	});

	test('perfil: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/perfil`);
		await expectSinInfracciones(page);
	});

	test('ajustes: la pantalla no tiene infracciones de axe', async ({ page, servidor }) => {
		await entrarComo(page, servidor, 'miembro');
		await page.goto(`${servidor.url}/ajustes`);
		await expectSinInfracciones(page);
	});
});

// RF-195: la bienvenida de antes de entrar, en sus dos pantallas (Empezar y escena 1), en los dos temas.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`bienvenida antes de entrar, tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('«Empezar» y la primera escena no tienen infracciones de axe', async ({ browser, servidor }) => {
			const contexto = await browser.newContext({ colorScheme: esquema });
			const pagina = await contexto.newPage();
			await pagina.goto(`${servidor.url}/login`);
			// F13 (RF-249): antes de la bienvenida va el corto; su portada se comprueba en la prueba siguiente.
			await pagina
				.getByRole('dialog', { name: 'El misterio de la última cápsula' })
				.getByRole('button', { name: 'Saltar', exact: true })
				.click();
			await pagina.getByRole('dialog').getByRole('button', { name: 'Empezar', exact: true }).waitFor();
			await expectSinInfracciones(pagina);
			await pagina.getByRole('button', { name: 'Empezar', exact: true }).click();
			await pagina.getByText('Escena 1 de 9').waitFor();
			await expectSinInfracciones(pagina);
			await contexto.close();
		});
	});
}

// F13 (RF-249, CA-252): la portada del corto antes de entrar, en los dos temas, con la transcripción abierta y cerrada.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`portada del corto, tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('la portada no tiene infracciones de axe, ni con la transcripción abierta', async ({ browser, servidor }) => {
			const contexto = await browser.newContext({ colorScheme: esquema });
			const pagina = await contexto.newPage();
			await pagina.goto(`${servidor.url}/login`);
			await pagina
				.getByRole('dialog', { name: 'El misterio de la última cápsula' })
				.getByRole('button', { name: 'Ver el corto', exact: true })
				.waitFor();
			await expectSinInfracciones(pagina);
			await pagina.getByRole('button', { name: 'Leer la transcripción', exact: true }).click();
			await pagina.getByText('Buenos días, señora cafetera. Lo de siempre.').waitFor();
			await expectSinInfracciones(pagina);
			await contexto.close();
		});
	});
}

// F12: el enlace de acceso válido, con Capsulito reactivo, en reposo y con los ojos tapados, en los dos temas.
for (const esquema of ['light', 'dark'] as const) {
	test.describe(`enlace de acceso válido, tema ${esquema === 'light' ? 'claro' : 'oscuro'}`, () => {
		test.use({ colorScheme: esquema });

		test('la pantalla del enlace no tiene infracciones de axe, ni en reposo ni con el foco en la contraseña', async ({
			page,
			servidor,
		}) => {
			await entrarComo(page, servidor, 'administrador');
			const enlace = await darDeAltaYLeerEnlace(page, servidor, nombreUnico('AxeEnlace'));
			await cerrarSesion(page, servidor);

			await page.goto(enlace);
			await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).waitFor();
			await expectSinInfracciones(page);
			await page.getByRole('textbox', { name: 'Contraseña nueva', exact: true }).click();
			await expectSinInfracciones(page);
		});
	});
}
