import { describe, expect, it } from 'vitest';
import { interpretarTema, interpretarTransparencia } from './apariencia';

// RF-180, RF-181: los valores válidos pasan; cualquier otro valor cae en el valor por defecto.
describe('preferencias de apariencia (RF-180, RF-181)', () => {
	it('el tema acepta auto, claro y oscuro', () => {
		expect(interpretarTema('auto')).toBe('auto');
		expect(interpretarTema('claro')).toBe('claro');
		expect(interpretarTema('oscuro')).toBe('oscuro');
	});

	it('un tema ausente o no válido vuelve a Automático', () => {
		expect(interpretarTema(null)).toBe('auto');
		expect(interpretarTema(undefined)).toBe('auto');
		expect(interpretarTema('azul')).toBe('auto');
		expect(interpretarTema('CLARO')).toBe('auto');
	});

	it('la transparencia acepta normal y reducida', () => {
		expect(interpretarTransparencia('normal')).toBe('normal');
		expect(interpretarTransparencia('reducida')).toBe('reducida');
	});

	it('una transparencia ausente o no válida vuelve a normal', () => {
		expect(interpretarTransparencia(null)).toBe('normal');
		expect(interpretarTransparencia('<script>')).toBe('normal');
		expect(interpretarTransparencia(1)).toBe('normal');
	});
});
