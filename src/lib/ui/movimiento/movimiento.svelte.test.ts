import '../../../app.css';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Button from '../Button.svelte';
import KpiTile from '../KpiTile.svelte';
import Money from '../Money.svelte';
import SegmentedControl from '../SegmentedControl.svelte';
import Section from '../Section.svelte';
import TextField from '../TextField.svelte';

const textoSnippet = createRawSnippet(() => ({ render: () => '<span>Guardar</span>' }));

const animaciones = (elemento: Element) =>
	elemento.getAnimations().map((animacion) => (animacion instanceof CSSAnimation ? animacion.animationName : ''));

describe('microinteracciones de campos (RF-233)', () => {
	it('CA-233: el campo con error se sacude una vez y el mensaje entra suavemente', async () => {
		await render(TextField, { label: 'Correo', value: '', error: 'Escribe un correo válido.' });

		const campo = page.getByRole('textbox', { name: 'Correo' }).element();
		expect(animaciones(campo)).toContain('campo-sacudida');
		const mensaje = page.getByText('Escribe un correo válido.').element();
		expect(animaciones(mensaje)).toContain('mensaje-error-entrada');
	});

	it('CA-233: al recibir el foco con el teclado el campo muestra el haz', async () => {
		await render(TextField, { label: 'Correo', value: '' });
		await userEvent.tab();

		const campo = page.getByRole('textbox', { name: 'Correo' });
		await expect.element(campo).toHaveFocus();
		expect(animaciones(campo.element())).toContain('campo-haz');
	});

	it('CA-233: sin error no hay sacudida', async () => {
		await render(TextField, { label: 'Correo', value: '' });

		expect(animaciones(page.getByRole('textbox', { name: 'Correo' }).element())).not.toContain('campo-sacudida');
	});
});

describe('indicador deslizante (RF-234)', () => {
	it('CA-234: el indicador mide la opción marcada y se desplaza al cambiar de opción', async () => {
		const { container } = await render(SegmentedControl, {
			label: 'Apariencia',
			value: 'auto',
			options: [
				{ value: 'auto', label: 'Automático' },
				{ value: 'claro', label: 'Claro' },
				{ value: 'oscuro', label: 'Oscuro' },
			],
		});
		const grupo = page.getByRole('radiogroup', { name: 'Apariencia' });
		await expect.element(grupo).toHaveAttribute('data-indicador-listo');
		const antes = grupo.element().style.getPropertyValue('--indicador-x');
		expect(Number.parseFloat(grupo.element().style.getPropertyValue('--indicador-ancho'))).toBeGreaterThan(0);

		await page.getByRole('radio', { name: 'Oscuro' }).click();
		await expect.poll(() => grupo.element().style.getPropertyValue('--indicador-x')).not.toBe(antes);
		expect(container.querySelectorAll('[data-state="checked"]')).toHaveLength(1);
	});
});

describe('brillo de borde (RF-235)', () => {
	it('CA-235: con puntero fino la tarjeta sigue al puntero y un panel de cristal no lo lleva', async () => {
		const { container } = await render(Section, { title: 'Hucha', panel: true, children: textoSnippet });
		const tarjeta = container.querySelector('section');
		expect(tarjeta).not.toBeNull();
		tarjeta?.dispatchEvent(new PointerEvent('pointerenter'));
		tarjeta?.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 10 }));
		expect(tarjeta?.hasAttribute('data-spotlight-activo')).toBe(true);
		expect(tarjeta?.style.getPropertyValue('--spot-x')).toMatch(/px$/);
		tarjeta?.dispatchEvent(new PointerEvent('pointerleave'));
		expect(tarjeta?.hasAttribute('data-spotlight-activo')).toBe(false);
	});

	it('CA-235: una sección sin panel no tiene brillo', async () => {
		const { container } = await render(Section, { title: 'Hucha', children: textoSnippet });
		const seccion = container.querySelector('section');
		seccion?.dispatchEvent(new PointerEvent('pointerenter'));
		expect(seccion?.hasAttribute('data-spotlight-activo')).toBe(false);
	});
});

describe('éxito y cifras (RF-236)', () => {
	it('CA-236: el botón muestra el check solo con success', async () => {
		const { container, rerender } = await render(Button, { children: textoSnippet, success: false });
		expect(container.querySelector('svg')).toBeNull();
		await rerender({ children: textoSnippet, success: true });
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('CA-236: la cifra pasa del valor anterior al nuevo en menos de 300 ms y el lector recibe solo el final', async () => {
		const { rerender } = await render(Money, { cents: 1000, animar: true });
		await expect.element(page.getByText('10,00 €')).toBeVisible();

		await rerender({ cents: 2000, animar: true });
		await expect.element(page.getByText('20,00 €', { exact: true })).toBeInTheDocument();
		await expect.poll(() => document.body.querySelectorAll('[aria-hidden="true"]').length, { timeout: 300 }).toBe(0);
		await expect.element(page.getByText('20,00 €', { exact: true })).toBeVisible();
	});

	it('CA-236: KpiTile anima su número y deja el final', async () => {
		const numero = (valor: number) => ({ valor, formato: String });
		const { rerender } = await render(KpiTile, { label: 'Cafés', value: '3', numero: numero(3) });
		await rerender({ label: 'Cafés', value: '9', numero: numero(9) });
		await expect.poll(() => document.body.querySelectorAll('[aria-hidden="true"]').length, { timeout: 300 }).toBe(0);
		await expect.element(page.getByText('9', { exact: true })).toBeVisible();
	});
});
