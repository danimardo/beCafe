import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { registrarAportacion } from '#lib/server/economia';
import { configuracion } from '#lib/server/configuracion';
import { crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { esquemaInstanteUtc } from '#lib/shared/fechas/tipos';
import { registrarRelleno, anularRelleno, type PersonaRelleno } from '#lib/server/rellenos';
import { leerHistorial, type FiltrosGenerales } from './historial';

// Plan F8 D6 y tarea T016: historial mezclado de economía y rellenos (RF-175). Orden, paginación, totales y filtros.
const INSTANTE = esquemaInstanteUtc.parse('2026-10-23T10:00:00.000Z');
const MINUTO = 60_000;
const FILTROS_TODOS: FiltrosGenerales = { quien: 'todo', tipo: 'todos', anulados: false, pagina: 1 };

describe('historial mezclado (RF-175, plan F8 D6)', () => {
	let entorno: EntornoPrueba;
	let ana: Actor;
	let luis: Actor;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		const idAna = nuevoId();
		const idLuis = nuevoId();
		crearUsuario(entorno.ambiente.db, { id: idAna, nombre: 'Ana', correo: `${idAna}@example.test`, rol: 'miembro', instante: INSTANTE });
		crearUsuario(entorno.ambiente.db, { id: idLuis, nombre: 'Luis', correo: `${idLuis}@example.test`, rol: 'miembro', instante: INSTANTE });
		// Sin intervalo entre rellenos: la paginación necesita muchos rellenos en la misma hora.
		entorno.ambiente.db
			.insert(configuracion)
			.values({ clave: 'intervalo_rellenos_min', valor: '0', modificadoPor: idAna, modificadoEn: INSTANTE })
			.run();
		ana = { usuarioId: idAna, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'hash-ana' };
		luis = { usuarioId: idLuis, rol: 'miembro', autenticadoEn: INSTANTE, sesionIdHash: 'hash-luis' };
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function relleno(persona: Actor): PersonaRelleno {
		return { usuarioId: persona.usuarioId };
	}

	it('con «Todos» mezcla aportaciones y rellenos por fecha, con el relleno sin importe', () => {
		registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 500 });
		entorno.reloj.avanzar(5 * MINUTO);
		const r = registrarRelleno(entorno.ambiente, relleno(luis), { clienteId: nuevoId() });

		const pagina = leerHistorial(entorno.ambiente.db, ana, FILTROS_TODOS);

		expect(pagina.total).toBe(2);
		expect(pagina.filas.map((fila) => fila.tipo)).toEqual(['relleno', 'aportacion']);
		expect(pagina.filas[0]).toMatchObject({ id: r.id, autorNombre: 'Luis', importe: 0 });
	});

	it('con «Rellenos de agua» solo aparecen rellenos y se puede filtrar por «Míos»', () => {
		registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 500 });
		registrarRelleno(entorno.ambiente, relleno(ana), { clienteId: nuevoId() });
		entorno.reloj.avanzar(90 * MINUTO);
		registrarRelleno(entorno.ambiente, relleno(luis), { clienteId: nuevoId() });

		const todos = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, tipo: 'rellenos' });
		const mios = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, tipo: 'rellenos', quien: 'mios' });

		expect(todos.filas.map((fila) => fila.tipo)).toEqual(['relleno', 'relleno']);
		expect(todos.total).toBe(2);
		expect(mios.total).toBe(1);
		expect(mios.filas[0].autorNombre).toBe('Ana');
	});

	it('un tipo económico no incluye rellenos', () => {
		registrarRelleno(entorno.ambiente, relleno(ana), { clienteId: nuevoId() });

		const pagina = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, tipo: 'aportaciones' });

		expect(pagina.filas).toEqual([]);
		expect(pagina.total).toBe(0);
	});

	it('la paginación corta la lista mezclada: la página 2 tiene el resto y el total es la suma', () => {
		for (let numero = 0; numero < 25; numero++) {
			registrarRelleno(entorno.ambiente, relleno(numero % 2 === 0 ? ana : luis), { clienteId: nuevoId() });
		}
		registrarAportacion(entorno.ambiente, ana, { clienteId: nuevoId(), importe: 100 });

		const pagina1 = leerHistorial(entorno.ambiente.db, ana, FILTROS_TODOS);
		const pagina2 = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, pagina: 2 });

		expect(pagina1.total).toBe(26);
		expect(pagina1.filas).toHaveLength(20);
		expect(pagina2.filas).toHaveLength(6);
		const ids = [...pagina1.filas, ...pagina2.filas].map((fila) => fila.id);
		expect(new Set(ids).size).toBe(26);
	});

	it('los rellenos anulados aparecen solo cuando se piden', () => {
		const anulado = registrarRelleno(entorno.ambiente, relleno(ana), { clienteId: nuevoId() });
		anularRelleno(entorno.ambiente, relleno(ana), anulado.id, 'Error');

		const sinAnulados = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, tipo: 'rellenos' });
		const conAnulados = leerHistorial(entorno.ambiente.db, ana, { ...FILTROS_TODOS, tipo: 'rellenos', anulados: true });

		expect(sinAnulados.total).toBe(0);
		expect(conAnulados.filas[0].anulado).toBe(true);
	});
});
