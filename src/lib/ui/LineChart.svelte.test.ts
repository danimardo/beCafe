import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import LineChart from './LineChart.svelte';

const DATOS = [
	{ label: 'ago', value: 1200 },
	{ label: 'sep', value: -300 },
	{ label: 'oct', value: 500 },
];

describe('LineChart (RF-202)', () => {
	it('CA-202: el nombre accesible lleva el título y todos los valores con su formato', async () => {
		await render(LineChart, { title: 'Saldo de la hucha', data: DATOS, format: (valor: number) => `${valor} c` });

		await expect.element(page.getByRole('img', { name: 'Saldo de la hucha. ago: 1200 c, sep: -300 c, oct: 500 c' })).toBeVisible();
	});

	it('CA-202: dibuja un punto por mes, marca los negativos y siempre incluye la línea de cero', async () => {
		const { container } = await render(LineChart, { title: 'Saldo', data: DATOS });

		expect(container.querySelectorAll('circle')).toHaveLength(3);
		expect(container.querySelectorAll('circle.fill-negative')).toHaveLength(1);
		expect(container.querySelector('line')?.getAttribute('stroke-dasharray')).toBe('3 2');
	});
});
