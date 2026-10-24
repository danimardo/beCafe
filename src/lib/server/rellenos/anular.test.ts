import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { configuracion } from '#lib/server/configuracion';
import {
	ErrorDeNegocio,
	enTransaccion,
	nuevoId,
	RecursoNoEncontrado,
	type EntornoPrueba,
	crearEntornoPrueba,
} from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { anularRelleno, deshacerRelleno, MOTIVO_DESHACER } from './anular';
import { registrarRelleno, type PersonaRelleno } from './registrar';
import { rellenoAgua } from './esquema';
import { contarRellenos } from './consultas';

// Plan F8 D4, tareas T009 y T014: «Deshacer» y anulación (CA-171, CA-174, RN-083, Clarifications 6).
const INSTANTE = esquemaInstanteUtc.parse('2026-10-23T10:00:00.000Z');
const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;

describe('anulación de rellenos (CA-171, CA-174, RN-083)', () => {
	let entorno: EntornoPrueba;
	let ana: PersonaRelleno;
	let luis: PersonaRelleno;
	let admin: PersonaRelleno;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const ids = { ana: nuevoId(), luis: nuevoId(), admin: nuevoId() };
		crearUsuario(entorno.ambiente.db, {
			id: ids.ana,
			nombre: 'Ana',
			correo: `${ids.ana}@example.test`,
			rol: 'miembro',
			instante: INSTANTE,
		});
		crearUsuario(entorno.ambiente.db, {
			id: ids.luis,
			nombre: 'Luis',
			correo: `${ids.luis}@example.test`,
			rol: 'miembro',
			instante: INSTANTE,
		});
		crearUsuario(entorno.ambiente.db, {
			id: ids.admin,
			nombre: 'Admin',
			correo: `${ids.admin}@example.test`,
			rol: 'administrador',
			instante: INSTANTE,
		});
		ana = { usuarioId: ids.ana };
		luis = { usuarioId: ids.luis };
		admin = { usuarioId: ids.admin };
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function fijarPlazo(minutos: number) {
		entorno.ambiente.db
			.insert(configuracion)
			.values({ clave: 'plazo_autoanulacion_min', valor: String(minutos), modificadoPor: admin.usuarioId, modificadoEn: INSTANTE })
			.onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(minutos) } })
			.run();
	}

	function rechazo(accion: () => unknown): ErrorDeNegocio {
		try {
			accion();
		} catch (causa) {
			if (causa instanceof ErrorDeNegocio) return causa;
			throw causa;
		}
		throw new Error('se esperaba un rechazo');
	}

	function filaDe(id: string) {
		return entorno.ambiente.db.select().from(rellenoAgua).where(eq(rellenoAgua.id, id)).get();
	}

	it('CA-171: «Deshacer» a los 4 s anula el relleno con el motivo fijo y deja de contar en el ranking', () => {
		const relleno = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(4000);

		deshacerRelleno(entorno.ambiente, ana, relleno.id);

		const fila = filaDe(relleno.id);
		expect(fila?.estado).toBe('anulado');
		expect(fila?.motivoAnulacion).toBe(MOTIVO_DESHACER);
		expect(
			contarRellenos(entorno.ambiente.db, { desde: INSTANTE, hasta: esquemaInstanteUtc.parse('2026-11-01T00:00:00.000Z') }),
		).toHaveLength(0);
	});

	it('CA-171: deshacer fuera de plazo devuelve FUERA_DE_PLAZO', () => {
		const relleno = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(16 * MINUTO);

		expect(rechazo(() => deshacerRelleno(entorno.ambiente, ana, relleno.id)).codigo).toBe('FUERA_DE_PLAZO');
	});

	it('CA-171: deshacer el relleno de otra persona devuelve SIN_PERMISO', () => {
		const relleno = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });

		expect(rechazo(() => deshacerRelleno(entorno.ambiente, luis, relleno.id)).codigo).toBe('SIN_PERMISO');
	});

	it('CA-174: Ana anula a los 10 min con plazo de 15; a los 20 min, FUERA_DE_PLAZO', () => {
		fijarPlazo(15);
		const primero = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(10 * MINUTO);
		anularRelleno(entorno.ambiente, ana, primero.id, 'Lo registré dos veces');
		expect(filaDe(primero.id)?.estado).toBe('anulado');

		const segundo = registrarRelleno(entorno.ambiente, luis, { clienteId: nuevoId() });
		entorno.reloj.avanzar(20 * MINUTO);
		const error = rechazo(() => anularRelleno(entorno.ambiente, luis, segundo.id, 'Tarde'));
		expect(error.codigo).toBe('FUERA_DE_PLAZO');
	});

	it('CA-174: un administrador anula a los 3 días, siempre', () => {
		const relleno = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(3 * DIA);

		anularRelleno(entorno.ambiente, admin, relleno.id, 'Error de carga');

		expect(filaDe(relleno.id)?.estado).toBe('anulado');
	});

	it('CA-174: anular un relleno ya anulado devuelve YA_ANULADO y no cambia el motivo', () => {
		const relleno = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		anularRelleno(entorno.ambiente, ana, relleno.id, 'Primera');

		expect(rechazo(() => anularRelleno(entorno.ambiente, admin, relleno.id, 'Segunda')).codigo).toBe('YA_ANULADO');
		expect(filaDe(relleno.id)?.motivoAnulacion).toBe('Primera');
	});

	it('Clarifications 6: un administrador anula el relleno de una persona dada de baja', () => {
		const relleno = registrarRelleno(entorno.ambiente, luis, { clienteId: nuevoId() });
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: luis.usuarioId, instante: INSTANTE }));

		anularRelleno(entorno.ambiente, admin, relleno.id, 'Baja con relleno pendiente');

		expect(filaDe(relleno.id)?.estado).toBe('anulado');
	});

	it('un relleno inexistente devuelve RecursoNoEncontrado', () => {
		expect(() => anularRelleno(entorno.ambiente, ana, nuevoId(), 'nada')).toThrow(RecursoNoEncontrado);
	});
});
