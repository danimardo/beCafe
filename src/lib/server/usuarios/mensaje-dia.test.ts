import { afterEach, describe, expect, it } from 'vitest';
import { crearAzarFijo, crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { IDS_MENSAJES_DIA } from '#lib/shared/mascota/mensajes-dia';
import { asignarMensajeDia, crearUsuario } from './index';
import { mensajeDia } from './esquema';

// RN-091, RF-268, EV-114 contra SQLite real: el mensaje del día vive en la cuenta.
const INSTANTE = '2026-10-27T08:00:00.000Z';
const DIA_MS = 24 * 60 * 60 * 1000;

describe('mensaje del día por persona', () => {
	let entorno: EntornoPrueba;

	function preparar(azar: readonly number[]): { ana: string; luis: string } {
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo(azar));
		const ana = nuevoId();
		const luis = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE });
			crearUsuario(tx, { id: luis, nombre: 'Luis', correo: 'luis@ejemplo.es', rol: 'miembro', instante: INSTANTE });
		});
		return { ana, luis };
	}

	afterEach(() => entorno.cerrar());

	it('CA-266: el mismo día devuelve el mismo mensaje, aunque se pida varias veces', () => {
		const { ana } = preparar([3, 0, 0]);
		const primero = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		expect(primero?.mensajeId).toBe(IDS_MENSAJES_DIA[3]);
		entorno.reloj.avanzar(5 * 60 * 60 * 1000);
		expect(asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false })).toEqual(primero);
		expect(entorno.ambiente.db.select().from(mensajeDia).all()).toHaveLength(1);
	});

	it('CA-266: cada persona recibe el suyo y al día siguiente, otro', () => {
		const { ana, luis } = preparar([0, 0, 0]);
		const deAna = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		const deLuis = asignarMensajeDia(entorno.ambiente, luis, { hayAviso: false });
		expect(deAna?.mensajeId).toBe(deLuis?.mensajeId);
		entorno.reloj.avanzar(DIA_MS);
		const manana = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		expect(manana?.mensajeId).not.toBe(deAna?.mensajeId);
	});

	it('CA-268: 40 días seguidos no repiten y el día 41 abre una vuelta nueva', () => {
		const { ana } = preparar(Array.from({ length: 41 }, () => 0));
		const vistos: string[] = [];
		for (let dia = 0; dia < IDS_MENSAJES_DIA.length; dia += 1) {
			const mensaje = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
			if (!mensaje) throw new Error('Sin mensaje');
			vistos.push(mensaje.mensajeId);
			entorno.reloj.avanzar(DIA_MS);
		}
		expect(new Set(vistos).size).toBe(IDS_MENSAJES_DIA.length);
		expect([...vistos].sort()).toEqual([...IDS_MENSAJES_DIA].sort());

		const nuevo = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		expect(IDS_MENSAJES_DIA).toContain(nuevo?.mensajeId);
		const vueltas = entorno.ambiente.db.select({ vuelta: mensajeDia.vuelta }).from(mensajeDia).all();
		expect(vueltas.filter((fila) => fila.vuelta === 2)).toHaveLength(1);
		expect(entorno.eventos().some((evento) => evento.codigo === 'mensaje_dia.ciclo_reiniciado')).toBe(true);
	});

	it('RN-091: un día con aviso no asigna ni gasta ningún mensaje', () => {
		const { ana } = preparar([0, 0]);
		expect(asignarMensajeDia(entorno.ambiente, ana, { hayAviso: true })).toBeNull();
		expect(entorno.ambiente.db.select().from(mensajeDia).all()).toHaveLength(0);
		// Al desaparecer el aviso ese mismo día, se asigna el primero del catálogo: no se perdió ninguno.
		expect(asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false })?.mensajeId).toBe(IDS_MENSAJES_DIA[0]);
	});

	it('RN-091: si ya tenía mensaje hoy, un aviso posterior no lo quita', () => {
		const { ana } = preparar([0, 0]);
		const asignado = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		expect(asignarMensajeDia(entorno.ambiente, ana, { hayAviso: true })).toEqual(asignado);
	});

	it('RN-091: el día cambia a medianoche de Madrid, no de UTC', () => {
		// 22:30 UTC del 27-10 ya es 23:30 del 27 en Madrid (CET aún no, CEST hasta el 25-10: UTC+1 desde entonces).
		entorno = crearEntornoPrueba('2026-10-27T22:30:00.000Z', crearAzarFijo([0, 1]));
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: 'ana@ejemplo.es', rol: 'miembro', instante: INSTANTE });
		});
		const antes = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		entorno.reloj.avanzar(45 * 60 * 1000);
		const despues = asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		expect(despues?.mensajeId).not.toBe(antes?.mensajeId);
	});

	it('RNF-F15-4: los eventos no llevan el texto del mensaje', () => {
		const { ana } = preparar([0]);
		asignarMensajeDia(entorno.ambiente, ana, { hayAviso: false });
		const evento = entorno.eventos().find((candidato) => candidato.codigo === 'mensaje_dia.asignado');
		expect(evento).toBeDefined();
		expect(JSON.stringify(evento)).not.toMatch(/cafetera|café/i);
	});
});
