import { afterEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, leerInstalacion, registrarInstalacion, type Rol } from './index';
import { instalacionApp } from './esquema';

// F16 (RF-278, RF-280, RF-281, RF-283) contra SQLite real.
const INSTANTE = '2026-10-27T08:00:00.000Z';
const HORA_MS = 60 * 60 * 1000;

describe('estado de instalación por persona', () => {
	let entorno: EntornoPrueba;

	function preparar(): { ana: string; luis: string; admin: string } {
		entorno = crearEntornoPrueba(INSTANTE);
		const ids = { ana: nuevoId(), luis: nuevoId(), admin: nuevoId() };
		const alta = (id: string, nombre: string, rol: Rol) =>
			enTransaccion(entorno.ambiente.db, (tx) => crearUsuario(tx, { id, nombre, correo: `${nombre}@ejemplo.es`, rol, instante: INSTANTE }));
		alta(ids.ana, 'ana', 'miembro');
		alta(ids.luis, 'luis', 'miembro');
		alta(ids.admin, 'admin', 'administrador');
		return ids;
	}

	afterEach(() => entorno.cerrar());

	it('CA-278: cada persona tiene como máximo una fila y «sin datos» es no tener ninguna', () => {
		const { ana, admin } = preparar();
		expect(leerInstalacion(entorno.ambiente.db, { usuarioId: admin, rol: 'administrador' }, ana)).toBeNull();
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'rechazada');
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'instalada');
		expect(entorno.ambiente.db.select().from(instalacionApp).all()).toHaveLength(1);
	});

	it('CA-280: rechazada pasa a instalada; instalada no vuelve a rechazada; repetir no cambia el instante', () => {
		const { ana, admin } = preparar();
		const leer = () => leerInstalacion(entorno.ambiente.db, { usuarioId: admin, rol: 'administrador' }, ana);

		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'rechazada');
		expect(leer()).toEqual({ estado: 'rechazada', instante: INSTANTE });

		entorno.reloj.avanzar(HORA_MS);
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'instalada');
		const instalada = leer();
		expect(instalada?.estado).toBe('instalada');

		entorno.reloj.avanzar(HORA_MS);
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'instalada');
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'rechazada');
		expect(leer()).toEqual(instalada);
	});

	it('CA-281: un administrador lee el estado de otra persona; un miembro no, y solo lee el suyo', () => {
		const { ana, luis } = preparar();
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'instalada');

		expect(() => leerInstalacion(entorno.ambiente.db, { usuarioId: luis, rol: 'miembro' }, ana)).toThrow(
			expect.objectContaining({ codigo: 'SIN_PERMISO' }),
		);
		expect(leerInstalacion(entorno.ambiente.db, { usuarioId: ana, rol: 'miembro' }, ana)?.estado).toBe('instalada');
		expect(entorno.eventos()).toContainEqual(expect.objectContaining({ codigo: 'auth.permiso_denegado' }));
	});

	it('CA-283: cada cambio emite instalacion.registrada solo con el identificador y el estado; repetir no emite nada', () => {
		const { ana } = preparar();
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'rechazada');
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'rechazada');
		registrarInstalacion(entorno.ambiente, { usuarioId: ana }, 'instalada');

		const eventos = entorno.eventos().filter((evento) => evento.codigo === 'instalacion.registrada');
		expect(eventos).toHaveLength(2);
		expect(eventos[0]?.campos).toEqual({ usuarioId: ana, estado: 'rechazada' });
		expect(eventos[1]?.campos).toEqual({ usuarioId: ana, estado: 'instalada' });
	});
});
