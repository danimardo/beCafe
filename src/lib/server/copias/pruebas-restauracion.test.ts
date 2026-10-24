import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { esquemaFechaMadrid } from '#lib/shared/fechas/tipos';
import { copiaSeguridad, pruebaRestauracion } from './esquema';
import { anotarPruebaRestauracion, DIAS_SIN_PROBAR, diasEntre, leerEstadoRestauracion } from './pruebas-restauracion';
import { leerCopias } from './consultas';

// Plan F8 D5, D6, D12-2 y D12-4; tareas T011 y T012: panel de copias (CA-143) y aviso de los 100 días (CA-144).
const INSTANTE = '2026-10-23T10:00:00.000Z';
const HOY = esquemaFechaMadrid.parse('2026-10-23');

describe('pruebas de restauración y aviso de los 100 días (CA-144, RF-144)', () => {
	let entorno: EntornoPrueba;
	let admin: Actor;
	let miembro: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		admin = sesionDe('administrador', 'Administración');
		miembro = sesionDe('miembro', 'Ana');
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@example.test`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	function insertarPrueba(fecha: string, resultado: 'correcta' | 'fallida') {
		entorno.ambiente.db
			.insert(pruebaRestauracion)
			.values({ id: nuevoId(), adminId: admin.usuarioId, realizadaEl: fecha, resultado, notas: null, anotadaEn: INSTANTE })
			.run();
	}

	it('CA-144: sin ninguna prueba, el aviso dice que nunca se ha probado (Clarifications 5)', () => {
		expect(leerEstadoRestauracion(entorno.ambiente.db, admin, HOY)).toEqual({ ultimaCorrecta: null, aviso: 'nunca' });
	});

	it('CA-144: la última prueba correcta hace 101 días da aviso', () => {
		insertarPrueba('2026-07-14', 'correcta');

		expect(leerEstadoRestauracion(entorno.ambiente.db, admin, HOY).aviso).toBe('antigua');
	});

	it('CA-144: hace 100 días exactos no avisa; hace 30 tampoco', () => {
		insertarPrueba('2026-07-15', 'correcta');
		expect(diasEntre(esquemaFechaMadrid.parse('2026-07-15'), HOY)).toBe(DIAS_SIN_PROBAR);
		expect(leerEstadoRestauracion(entorno.ambiente.db, admin, HOY).aviso).toBeNull();
	});

	it('Clarifications 7: una prueba fallida reciente no quita el aviso', () => {
		insertarPrueba('2026-07-14', 'correcta');
		insertarPrueba('2026-10-20', 'fallida');

		expect(leerEstadoRestauracion(entorno.ambiente.db, admin, HOY)).toMatchObject({ ultimaCorrecta: '2026-07-14', aviso: 'antigua' });
	});

	it('CA-143: anotar una prueba con su fecha, resultado y notas la guarda con su autor', () => {
		const id = anotarPruebaRestauracion(entorno.ambiente, admin, {
			realizadaEl: '2026-10-22',
			resultado: 'correcta',
			notas: 'Sin incidencias',
		});

		expect(entorno.ambiente.db.select().from(pruebaRestauracion).all()).toEqual([
			expect.objectContaining({ id, adminId: admin.usuarioId, realizadaEl: '2026-10-22', resultado: 'correcta', notas: 'Sin incidencias' }),
		]);
	});

	it('CA-143: una fecha futura se rechaza con VALIDACION (Clarifications 3)', () => {
		expect(() => anotarPruebaRestauracion(entorno.ambiente, admin, { realizadaEl: '2026-10-24', resultado: 'correcta' })).toThrow(
			ErrorDeNegocio,
		);
	});

	it('CA-143: unas notas de más de 500 caracteres se rechazan', () => {
		expect(() =>
			anotarPruebaRestauracion(entorno.ambiente, admin, { realizadaEl: '2026-10-22', resultado: 'correcta', notas: 'x'.repeat(501) }),
		).toThrow(ErrorDeNegocio);
	});

	it('CA-143: un miembro no puede anotar pruebas ni ver el aviso (SIN_PERMISO)', () => {
		expect(() => anotarPruebaRestauracion(entorno.ambiente, miembro, { realizadaEl: '2026-10-22', resultado: 'correcta' })).toThrow(
			ErrorDeNegocio,
		);
		expect(() => leerEstadoRestauracion(entorno.ambiente.db, miembro, HOY)).toThrow(ErrorDeNegocio);
	});

	it('CA-143: el panel muestra las últimas 30 copias, la más reciente primero', () => {
		enTransaccion(entorno.ambiente.db, (tx) => {
			for (let dia = 1; dia <= 31; dia += 1) {
				const iniciada = `2026-10-${String(dia).padStart(2, '0')}T01:00:00.000Z`;
				tx.insert(copiaSeguridad)
					.values({ id: nuevoId(), iniciadaEn: iniciada, estado: 'correcta', tamano: 10, sha256: 'a'.repeat(64), claveObjeto: 'b' })
					.run();
			}
		});

		const copias = leerCopias(entorno.ambiente.db, admin);

		expect(copias).toHaveLength(30);
		expect(copias[0]?.iniciadaEn).toBe('2026-10-31T01:00:00.000Z');
		expect(copias.at(-1)?.iniciadaEn).toBe('2026-10-02T01:00:00.000Z');
	});

	it('CA-143: un miembro no ve las copias', () => {
		expect(() => leerCopias(entorno.ambiente.db, miembro)).toThrow(ErrorDeNegocio);
	});
});
