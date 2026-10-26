import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import CopyField from './CopyField.svelte';

const ENLACE = 'http://192.168.1.10:3000/acceso/abc';

// Sin contexto seguro (http por IP) `navigator.clipboard` no existe: el enlace debe copiarse igualmente (RF-238, CA-238).
function sinPortapapeles() {
	Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

afterEach(() => {
	vi.restoreAllMocks();
	// Quita la propiedad propia que tapaba la del prototipo.
	Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CopyField (RF-238)', () => {
	it('CA-238: sin navigator.clipboard copia con el respaldo y dice «Enlace copiado»', async () => {
		sinPortapapeles();
		const copiar = vi.spyOn(document, 'execCommand').mockReturnValue(true);
		await render(CopyField, { label: 'Enlace de acceso', value: ENLACE });

		await page.getByRole('button', { name: 'Copiar enlace' }).click();

		expect(copiar).toHaveBeenCalledWith('copy');
		await expect.element(page.getByRole('button', { name: 'Enlace copiado' })).toBeVisible();
		expect(page.getByText('No se pudo copiar solo').elements()).toHaveLength(0);
	});

	it('CA-238: si ningún método copia, deja el texto seleccionado y muestra el mensaje de copiar a mano', async () => {
		sinPortapapeles();
		vi.spyOn(document, 'execCommand').mockReturnValue(false);
		await render(CopyField, { label: 'Enlace de acceso', value: ENLACE });

		await page.getByRole('button', { name: 'Copiar enlace' }).click();

		await expect.element(page.getByText('No se pudo copiar solo. Selecciona el texto y cópialo.')).toBeVisible();
		const campo = page.getByLabelText('Enlace de acceso').element();
		expect(campo).toBeInstanceOf(HTMLInputElement);
		if (campo instanceof HTMLInputElement) expect([campo.selectionStart, campo.selectionEnd]).toEqual([0, ENLACE.length]);
	});

	it('CA-238: con contexto seguro usa la API del portapapeles', async () => {
		const escribir = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { value: { writeText: escribir }, configurable: true });
		const respaldo = vi.spyOn(document, 'execCommand');
		await render(CopyField, { label: 'Enlace de acceso', value: ENLACE });

		await page.getByRole('button', { name: 'Copiar enlace' }).click();

		expect(escribir).toHaveBeenCalledWith(ENLACE);
		expect(respaldo).not.toHaveBeenCalled();
		await expect.element(page.getByRole('button', { name: 'Enlace copiado' })).toBeVisible();
	});

	it('CA-239: con «anunciar» el aviso de estado dice que el enlace está listo y el campo tiene el foco', async () => {
		await render(CopyField, { label: 'Enlace de acceso', value: ENLACE, anunciar: true });

		await expect.element(page.getByRole('status')).toHaveTextContent('Enlace listo para copiar');
		await expect.element(page.getByLabelText('Enlace de acceso')).toHaveFocus();
	});
});
