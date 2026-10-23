import { test, expect } from '../fixtures/errores-navegador';
import { entrarComo } from '../fixtures/sesiones';
import { darDeAltaCapsula, fotoDePrueba, nombreUnico } from '../fixtures/capsulas';

// Sin JavaScript, el alta de un tipo con foto funciona (RF-005, constitución XVII).
test('sin JavaScript, el alta de un tipo con foto muestra la confirmación y el enlace a la ficha', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3', foto: await fotoDePrueba() });

	await expect(page.getByRole('status').filter({ hasText: 'Tipo dado de alta.' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Editar', exact: true })).toBeVisible();
});

// Sin JavaScript, un rechazo devuelve los valores escritos y el error del campo (constitución XVII).
test('sin JavaScript, un nombre repetido vuelve a mostrar el formulario con el error', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS repetido');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });

	await expect(page.getByText('Ya existe un tipo activo con ese nombre.')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(nombre);
});

// Sin JavaScript, la edición de un tipo guarda los cambios y confirma el resultado (constitución XVII).
test('sin JavaScript, la edición de un tipo guarda la marca y confirma el cambio', async ({ page, servidor }) => {
	await entrarComo(page, servidor, 'administrador');
	const nombre = nombreUnico('Sin JS edicion');
	await darDeAltaCapsula(page, servidor, { nombre, umbral: '3' });

	await page.goto(`${servidor.url}/admin/capsulas`);
	await page
		.getByRole('link', { name: new RegExp(nombre) })
		.first()
		.click();
	await page.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca editada');
	await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();

	await expect(page.getByText('Cambios guardados.')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Marca', exact: true })).toHaveValue('Marca editada');
});
