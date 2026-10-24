import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enTransaccion, nuevoId, type EntornoPrueba, crearEntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { anularRelleno } from './anular';
import { contarRellenos, leerEstadoAgua, leerRellenos } from './consultas';
import { registrarRelleno, type PersonaRelleno } from './registrar';

// Plan F8 D2 y D6, tareas T008 y T018: estado de la tarjeta, historial y ranking (CA-170, CA-175).
const INSTANTE = esquemaInstanteUtc.parse('2026-10-23T10:00:00.000Z');
const MINUTO = 60_000;

describe('consultas de rellenos (CA-170, CA-175)', () => {
	let entorno: EntornoPrueba;
	let jorge: PersonaRelleno;
	let ana: PersonaRelleno;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const idJorge = nuevoId();
		const idAna = nuevoId();
		crearUsuario(entorno.ambiente.db, {
			id: idJorge,
			nombre: 'Jorge Gil',
			correo: `${idJorge}@example.test`,
			rol: 'miembro',
			instante: INSTANTE,
		});
		crearUsuario(entorno.ambiente.db, { id: idAna, nombre: 'Ana', correo: `${idAna}@example.test`, rol: 'miembro', instante: INSTANTE });
		jorge = { usuarioId: idJorge };
		ana = { usuarioId: idAna };
	});

	afterEach(() => {
		entorno.cerrar();
	});

	const ahora = () => entorno.reloj.ahora();

	it('CA-170: el último relleno vigente es de Jorge y no es propio para Ana', () => {
		registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });

		const estado = leerEstadoAgua(entorno.ambiente.db, ana, ahora());

		expect(estado.ultimo).toMatchObject({ nombre: 'Jorge Gil', esPropio: false, registradoEn: INSTANTE });
	});

	it('CA-170: sin rellenos, la tarjeta no tiene último', () => {
		expect(leerEstadoAgua(entorno.ambiente.db, ana, ahora()).ultimo).toBeNull();
	});

	it('CA-170: si el último está anulado, el último vigente es el anterior', () => {
		const anterior = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(90 * MINUTO);
		const ultimo = registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });
		anularRelleno(entorno.ambiente, jorge, ultimo.id, 'Error');

		const estado = leerEstadoAgua(entorno.ambiente.db, ana, ahora());

		expect(estado.ultimo?.id).toBe(anterior.id);
		expect(estado.ultimo?.esPropio).toBe(true);
	});

	it('el historial devuelve los rellenos del más reciente al más antiguo y con anulados solo si se piden', () => {
		const primero = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		entorno.reloj.avanzar(90 * MINUTO);
		const segundo = registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });
		anularRelleno(entorno.ambiente, jorge, segundo.id, 'Error');

		const vigentes = leerRellenos(entorno.ambiente.db, { incluirAnulados: false, limite: 20 });
		const todos = leerRellenos(entorno.ambiente.db, { incluirAnulados: true, limite: 20 });

		expect(vigentes.map((relleno) => relleno.id)).toEqual([primero.id]);
		expect(todos.map((relleno) => relleno.id)).toEqual([segundo.id, primero.id]);
	});

	it('CA-175: el ranking cuenta solo vigentes y mantiene a las personas de baja', () => {
		registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });
		entorno.reloj.avanzar(90 * MINUTO);
		const anulado = registrarRelleno(entorno.ambiente, ana, { clienteId: nuevoId() });
		anularRelleno(entorno.ambiente, ana, anulado.id, 'Error');
		const hasta = esquemaInstanteUtc.parse('2026-11-01T00:00:00.000Z');

		const periodo = contarRellenos(entorno.ambiente.db, { desde: INSTANTE, hasta });

		expect(periodo.map((fila) => fila.usuarioId)).toEqual([jorge.usuarioId]);
	});

	it('CA-175: un relleno a las 23:59 de Madrid del último día cuenta; el periodo termina a las 00:00 del día siguiente', () => {
		// 23:59 de Madrid del 31 de octubre (CET no aplica: octubre aún es CEST, UTC+2) son las 21:59 UTC.
		entorno.reloj.avanzar(Date.parse('2026-10-31T21:59:00.000Z') - Date.parse(INSTANTE));
		registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });
		const hasta = esquemaInstanteUtc.parse('2026-10-31T22:00:00.000Z');

		expect(contarRellenos(entorno.ambiente.db, { desde: INSTANTE, hasta })).toHaveLength(1);
	});

	it('CA-175: un relleno de una persona dada de baja sigue contando en el ranking', () => {
		registrarRelleno(entorno.ambiente, jorge, { clienteId: nuevoId() });
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: jorge.usuarioId, instante: INSTANTE }));
		const hasta = esquemaInstanteUtc.parse('2026-11-01T00:00:00.000Z');

		expect(contarRellenos(entorno.ambiente.db, { desde: INSTANTE, hasta })).toHaveLength(1);
	});
});
