import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, ErrorDeNegocio, enTransaccion, type EntornoPrueba } from '#lib/server/plataforma';
import { insertarTipo } from './datos';
import { leerFotoCapsula } from './fotos';

const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('lectura de la foto de un tipo (constitución V)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		enTransaccion(entorno.ambiente.db, (tx) =>
			insertarTipo(tx, {
				id: 'TIPO1',
				nombre: 'Lungo',
				marca: 'Marca',
				intensidad: undefined,
				color: 'cap-lungo',
				fotoRuta: 'foto.webp',
				instante: INSTANTE,
			}),
		);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('devuelve el nombre de la foto a una persona con sesión', () => {
		expect(leerFotoCapsula(entorno.ambiente.db, { usuarioId: 'PERSONA' }, 'TIPO1')).toBe('foto.webp');
	});

	it('sin sesión, se rechaza sin devolver nada', () => {
		expect(() => leerFotoCapsula(entorno.ambiente.db, undefined, 'TIPO1')).toThrow(ErrorDeNegocio);
	});

	it('un tipo sin foto devuelve nulo y uno inexistente devuelve indefinido', () => {
		enTransaccion(entorno.ambiente.db, (tx) =>
			insertarTipo(tx, {
				id: 'TIPO2',
				nombre: 'Decaf',
				marca: 'Marca',
				intensidad: undefined,
				color: 'cap-decaf',
				fotoRuta: null,
				instante: INSTANTE,
			}),
		);
		expect(leerFotoCapsula(entorno.ambiente.db, { usuarioId: 'PERSONA' }, 'TIPO2')).toBeNull();
		expect(leerFotoCapsula(entorno.ambiente.db, { usuarioId: 'PERSONA' }, 'NOEXISTE')).toBeUndefined();
	});
});
