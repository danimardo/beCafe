import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import '../../app.css';
import EncuadreFoto from './EncuadreFoto.svelte';

// F15 US4 (RF-273, RF-274): el marco se maneja con teclado, respeta los límites y escribe los campos de encuadre.

async function fotoDePrueba(ancho: number, alto: number): Promise<File> {
	const lienzo = document.createElement('canvas');
	lienzo.width = ancho;
	lienzo.height = alto;
	const contexto = lienzo.getContext('2d');
	if (!contexto) throw new Error('El lienzo debe tener contexto');
	contexto.fillStyle = '#336699';
	contexto.fillRect(0, 0, ancho, alto);
	const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/png'));
	if (!blob) throw new Error('El lienzo debe producir una imagen');
	return new File([blob], 'foto.png', { type: 'image/png' });
}

function campo(nombre: string): HTMLInputElement {
	const entrada = document.querySelector(`input[name="${nombre}"]`);
	if (!(entrada instanceof HTMLInputElement)) throw new Error(`Falta el campo ${nombre}`);
	return entrada;
}

describe('EncuadreFoto', () => {
	it('CA-273: sin foto no muestra el marco ni envía campos de encuadre', async () => {
		await render(EncuadreFoto, { label: 'Foto', name: 'foto', guia: 'redonda' });

		await expect.element(page.getByRole('button', { name: 'Encuadre de la foto' })).not.toBeInTheDocument();
		expect(document.querySelector('input[name="encuadreX"]')).toBeNull();
	});

	it('CA-273: al elegir una foto aparece el marco, el zoom al 100 % y los tres campos', async () => {
		await render(EncuadreFoto, { label: 'Foto', name: 'foto', guia: 'redonda' });

		await userEvent.upload(page.getByLabelText('Hacer o elegir foto'), await fotoDePrueba(600, 300));

		await expect.element(page.getByRole('button', { name: 'Encuadre de la foto' })).toBeVisible();
		await expect.element(page.getByRole('status')).toHaveTextContent('Zoom 100 %');
		await expect.poll(() => campo('encuadreLado').value).toBe('1.00000');
		expect(Number(campo('encuadreX').value)).toBeCloseTo(0.25);
		expect(campo('encuadreY').value).toBe('0.00000');
	});

	it('CA-273: Ampliar y Reducir cambian el zoom, que se anuncia, y respetan los límites', async () => {
		await render(EncuadreFoto, { label: 'Foto', name: 'foto' });
		await userEvent.upload(page.getByLabelText('Hacer o elegir foto'), await fotoDePrueba(1200, 1200));
		await expect.element(page.getByRole('status')).toHaveTextContent('Zoom 100 %');
		await expect.element(page.getByRole('button', { name: 'Reducir' })).toBeDisabled();

		await page.getByRole('button', { name: 'Ampliar' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('Zoom 125 %');
		expect(Number(campo('encuadreLado').value)).toBeCloseTo(0.8);

		await page.getByRole('button', { name: 'Encuadre de la foto' }).click();
		for (let i = 0; i < 10; i++) await userEvent.keyboard('+');
		await expect.element(page.getByRole('status')).toHaveTextContent('Zoom 400 %');
		await expect.element(page.getByRole('button', { name: 'Ampliar' })).toBeDisabled();
	});

	it('CA-273: las flechas mueven la foto y nunca sacan la zona de ella', async () => {
		await render(EncuadreFoto, { label: 'Foto', name: 'foto' });
		await userEvent.upload(page.getByLabelText('Hacer o elegir foto'), await fotoDePrueba(1200, 600));
		await page.getByRole('button', { name: 'Ampliar' }).click();
		const marco = page.getByRole('button', { name: 'Encuadre de la foto' });
		await marco.click();
		const antes = Number(campo('encuadreX').value);

		await userEvent.keyboard('{ArrowRight}');
		expect(Number(campo('encuadreX').value)).toBeGreaterThan(antes);

		for (let i = 0; i < 80; i++) await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
		const x = Number(campo('encuadreX').value);
		const lado = Number(campo('encuadreLado').value);
		expect(x + lado * 0.5).toBeLessThanOrEqual(1 + 1e-6);
		expect(x).toBeGreaterThanOrEqual(0);
	});
});
