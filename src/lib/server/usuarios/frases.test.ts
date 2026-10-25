import { afterEach, describe, expect, it } from 'vitest';
import { crearAzarFijo, crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { IDS_REGISTRO } from '#lib/shared/mascota/frases';
import { crearUsuario, entregarFrase, entregarSaludo, INTERVALO_SALUDO_MS, leerSaludoDisponible } from './index';
import { fraseEntregada } from './esquema';

// RF-213 a RF-215, RN-088 y RN-089 contra SQLite real: el ciclo de frases vive en la cuenta.
const INSTANTE = '2026-10-25T08:00:00.000Z';

describe('frases de Capsulito por persona', () => {
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

	it('CA-215: 80 frases de registro seguidas no se repiten y la 81 empieza un ciclo nuevo', () => {
		const { ana } = preparar(Array.from({ length: 81 }, () => 0));
		const entregadas = Array.from({ length: 80 }, () => entregarFrase(entorno.ambiente, ana, 'registro').fraseId);
		expect(new Set(entregadas).size).toBe(80);
		expect([...entregadas].sort()).toEqual([...IDS_REGISTRO].sort());

		const siguiente = entregarFrase(entorno.ambiente, ana, 'registro');
		expect(IDS_REGISTRO).toContain(siguiente.fraseId);
		const ciclos = entorno.ambiente.db.select({ ciclo: fraseEntregada.ciclo }).from(fraseEntregada).all();
		expect(ciclos.filter((fila) => fila.ciclo === 2)).toHaveLength(1);
		expect(entorno.eventos().some((evento) => evento.codigo === 'frase.ciclo_reiniciado')).toBe(true);
	});

	it('CA-215: cada persona tiene su propio ciclo', () => {
		const { ana, luis } = preparar([0, 0]);
		expect(entregarFrase(entorno.ambiente, ana, 'registro').fraseId).toBe('registro_01');
		expect(entregarFrase(entorno.ambiente, luis, 'registro').fraseId).toBe('registro_01');
	});

	it('las listas de registro y de saludo no comparten ciclo', () => {
		const { ana } = preparar([0, 0]);
		expect(entregarFrase(entorno.ambiente, ana, 'registro').fraseId).toBe('registro_01');
		expect(entregarSaludo(entorno.ambiente, ana)?.fraseId).toBe('saludo_01');
	});

	it('CA-214: el saludo vuelve a estar disponible a las 2 horas exactas del anterior', () => {
		const { ana } = preparar([0, 0]);
		expect(leerSaludoDisponible(entorno.ambiente.db, ana, entorno.ambiente.reloj.ahora())).toBe(true);
		expect(entregarSaludo(entorno.ambiente, ana)?.fraseId).toBe('saludo_01');
		expect(leerSaludoDisponible(entorno.ambiente.db, ana, entorno.ambiente.reloj.ahora())).toBe(false);

		entorno.reloj.avanzar(INTERVALO_SALUDO_MS - 60_000);
		expect(entregarSaludo(entorno.ambiente, ana)).toBeNull();

		entorno.reloj.avanzar(60_000);
		expect(leerSaludoDisponible(entorno.ambiente.db, ana, entorno.ambiente.reloj.ahora())).toBe(true);
		expect(entregarSaludo(entorno.ambiente, ana)?.fraseId).toBe('saludo_02');
	});

	it('una frase retirada del catálogo no cuenta como entregada', () => {
		const { ana } = preparar([0]);
		entorno.ambiente.db
			.insert(fraseEntregada)
			.values({ usuarioId: ana, lista: 'registro', ciclo: 1, fraseId: 'retirada', entregadaEn: INSTANTE })
			.run();
		expect(entregarFrase(entorno.ambiente, ana, 'registro').fraseId).toBe('registro_01');
	});

	it('los eventos no contienen el texto de la frase', () => {
		const { ana } = preparar([0]);
		entregarFrase(entorno.ambiente, ana, 'registro');
		const evento = entorno.eventos().find((e) => e.codigo === 'frase.entregada');
		expect(evento?.campos).toEqual({ usuarioId: ana, lista: 'registro', fraseId: 'registro_01', ciclo: 1 });
	});
});
