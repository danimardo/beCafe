import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, registroAuditoria } from '#lib/server/usuarios';
import { cambiarConfiguracion, type ActorConfiguracion } from './cambiar';
import { leerConfiguracion } from './leer';

// Plan F8 D7, tarea T016: cambio de parámetros con auditoría (CA-150) y rangos (Clarifications 2). La reautenticación (CA-138) la prueba la ruta.
const INSTANTE = '2026-10-23T10:00:00.000Z';

describe('cambiar la configuración (CA-150, CA-138, RF-150)', () => {
	let entorno: EntornoPrueba;
	let admin: ActorConfiguracion;
	let miembro: ActorConfiguracion;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		admin = personaDe('administrador', 'Administración');
		miembro = personaDe('miembro', 'Ana');
	});

	afterEach(() => entorno.cerrar());

	function personaDe(rol: 'miembro' | 'administrador', nombre: string): ActorConfiguracion {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@example.test`, rol, instante: INSTANTE }),
		);
		return { usuarioId };
	}

	function rechazo(accion: () => unknown): unknown {
		try {
			accion();
		} catch (causa) {
			return causa;
		}
		return undefined;
	}

	it('CA-150: subir el plazo a 30 minutos lo guarda y anota el valor anterior y el nuevo con su autor', () => {
		const cambios = cambiarConfiguracion(entorno.ambiente, admin, { plazoAutoanulacionMin: 30 });

		expect(cambios).toEqual([{ clave: 'plazo_autoanulacion_min', anterior: 15, nuevo: 30 }]);
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(30);
		expect(
			entorno.ambiente.db.select().from(registroAuditoria).where(eq(registroAuditoria.accion, 'configuracion.cambiada')).all(),
		).toEqual([
			expect.objectContaining({
				actorId: admin.usuarioId,
				objetoTipo: 'configuracion',
				objetoId: 'plazo_autoanulacion_min',
				detalle: JSON.stringify({ clave: 'plazo_autoanulacion_min', anterior: 15, nuevo: 30 }),
				creadoEn: INSTANTE,
			}),
		]);
	});

	it('solo cambian los parámetros distintos; sin cambios no hay auditoría', () => {
		const cambios = cambiarConfiguracion(entorno.ambiente, admin, { plazoAutoanulacionMin: 15, limiteDeudaCentimos: -800 });

		expect(cambios).toEqual([{ clave: 'limite_deuda_centimos', anterior: -500, nuevo: -800 }]);
		expect(entorno.ambiente.db.select().from(registroAuditoria).all()).toHaveLength(1);
	});

	it.each([
		['plazoAutoanulacionMin', 1, true],
		['plazoAutoanulacionMin', 1440, true],
		['plazoAutoanulacionMin', 0, false],
		['plazoAutoanulacionMin', 1441, false],
		['limiteDeudaCentimos', -100, true],
		['limiteDeudaCentimos', -10_000, true],
		['limiteDeudaCentimos', -99, false],
		['limiteDeudaCentimos', -10_001, false],
		['intervaloRellenosMin', 0, true],
		['intervaloRellenosMin', 1440, true],
		['intervaloRellenosMin', -1, false],
		['intervaloRellenosMin', 1441, false],
	] as const)('rango de %s: %s %s', (campo, valor, aceptado) => {
		const causa = rechazo(() => cambiarConfiguracion(entorno.ambiente, admin, { [campo]: valor }));

		if (aceptado) expect(causa).toBeUndefined();
		else expect(causa).toBeInstanceOf(ErrorDeNegocio);
	});

	it('un miembro no cambia la configuración (SIN_PERMISO)', () => {
		expect(() => cambiarConfiguracion(entorno.ambiente, miembro, { plazoAutoanulacionMin: 30 })).toThrow(ErrorDeNegocio);
		expect(leerConfiguracion(entorno.ambiente.db).plazoAutoanulacionMin).toBe(15);
	});
});
