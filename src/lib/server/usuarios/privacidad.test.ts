import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aceptarPrivacidadPersona, buscarUsuarioPorId, privacidadPendiente } from './index';
import { crearUsuario } from './alta';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';

// Aceptación del texto de privacidad (RF-160, CA-160): guarda la versión y el instante, y un texto nuevo vuelve a pedirlo.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const AHORA = '2026-10-21T10:30:00.000Z';

describe('aceptación del texto de privacidad (CA-160)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Pedro', correo: 'pedro@ejemplo.es', rol: 'miembro', instante: INSTANTE }),
		);
	});

	afterEach(() => entorno.cerrar());

	it('CA-160: aceptar guarda la versión y el instante, y la persona deja de tener el texto pendiente', () => {
		const antes = buscarUsuarioPorId(entorno.ambiente.db, usuarioId);
		expect(antes && privacidadPendiente(antes, 1)).toBe(true);

		aceptarPrivacidadPersona(entorno.ambiente.db, { usuarioId, version: 1, instante: AHORA });

		const despues = buscarUsuarioPorId(entorno.ambiente.db, usuarioId);
		expect(despues?.privacidadVersion).toBe(1);
		expect(despues?.privacidadLeidaEn).toBe(AHORA);
		expect(despues && privacidadPendiente(despues, 1)).toBe(false);
	});

	it('CA-160: con una versión vigente mayor que la aceptada, la persona vuelve a tener el texto pendiente', () => {
		aceptarPrivacidadPersona(entorno.ambiente.db, { usuarioId, version: 1, instante: AHORA });

		const persona = buscarUsuarioPorId(entorno.ambiente.db, usuarioId);

		expect(persona && privacidadPendiente(persona, 2)).toBe(true);
	});

	it('CA-160: el evento de aceptación lleva solo el identificador y la versión, sin datos personales', () => {
		aceptarPrivacidadPersona(entorno.ambiente.db, { usuarioId, version: 1, instante: AHORA });

		const evento = entorno.eventos().find((registrado) => registrado.codigo === 'privacidad.aceptada');

		expect(evento?.campos).toEqual({ usuarioId, version: 1 });
	});
});
