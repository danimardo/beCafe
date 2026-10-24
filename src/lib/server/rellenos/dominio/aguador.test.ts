import { describe, expect, it } from 'vitest';
import { elegirAguadores, type ConteoPersona } from './aguador';

// Plan F8 D5, tarea T021: elección pura del aguador (RN-084, RN-085).
const activos = (...ids: string[]) => new Set(ids);

describe('elegirAguadores (RN-084, RN-085)', () => {
	it('elige a la persona con más rellenos', () => {
		const conteos: ConteoPersona[] = [
			{ usuarioId: 'ana', rellenos: 6 },
			{ usuarioId: 'luis', rellenos: 4 },
		];
		expect(elegirAguadores(conteos, activos('ana', 'luis'))).toEqual([{ usuarioId: 'ana', rellenos: 6 }]);
	});

	it('con empate de dos, las dos personas', () => {
		const conteos: ConteoPersona[] = [
			{ usuarioId: 'ana', rellenos: 6 },
			{ usuarioId: 'jorge', rellenos: 6 },
			{ usuarioId: 'luis', rellenos: 4 },
		];
		expect(elegirAguadores(conteos, activos('ana', 'jorge', 'luis')).map((fila) => fila.usuarioId)).toEqual(['ana', 'jorge']);
	});

	it('con empate de tres, las tres personas', () => {
		const conteos: ConteoPersona[] = [
			{ usuarioId: 'ana', rellenos: 3 },
			{ usuarioId: 'jorge', rellenos: 3 },
			{ usuarioId: 'luis', rellenos: 3 },
		];
		expect(elegirAguadores(conteos, activos('ana', 'jorge', 'luis'))).toHaveLength(3);
	});

	it('sin rellenos, la lista está vacía', () => {
		expect(elegirAguadores([], activos('ana'))).toEqual([]);
	});

	it('una persona de baja cuenta en el conteo, pero no opta al título', () => {
		const conteos: ConteoPersona[] = [
			{ usuarioId: 'ana', rellenos: 9 },
			{ usuarioId: 'luis', rellenos: 2 },
		];
		expect(elegirAguadores(conteos, activos('luis'))).toEqual([{ usuarioId: 'luis', rellenos: 2 }]);
	});
});
