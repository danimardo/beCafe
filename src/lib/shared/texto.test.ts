import { describe, expect, it } from 'vitest';
import { initials } from './texto';

describe('iniciales para avatares', () => {
	it('usa la primera letra del nombre y la del último apellido', () => {
		expect(initials('Ana Pérez')).toBe('AP');
		expect(initials('ana maría de la o')).toBe('AO');
	});

	it('usa una sola letra si solo hay una palabra', () => {
		expect(initials('Luis')).toBe('L');
	});

	it('no devuelve nada si el nombre está vacío', () => {
		expect(initials('   ')).toBe('');
	});
});
