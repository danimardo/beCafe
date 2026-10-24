import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { configuracion } from '#lib/server/configuracion';
import { anularConsumo, darDeAltaCapsula, registrarCompra, registrarConsumo } from '#lib/server/economia';
import { anularRelleno, registrarRelleno } from '#lib/server/rellenos';
import { crearEntornoPrueba, crearRelojFijo, enTransaccion, nuevoId, ErrorDeNegocio, type EntornoPrueba } from '#lib/server/plataforma';
import { cambiarRol, crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { esquemaInstanteUtc, esquemaMes } from '#lib/shared/fechas/tipos';
import { leerEquipo, leerPersonales } from './consultas';

// Plan F5 D3 y D4; tarea T015: cifras del equipo y personales (CA-120 a CA-122), periodos y permisos.
// Solo API pública de `economia` y `usuarios`: los datos se crean como los crearía la aplicación.
const INSTANTE = '2026-11-05T10:00:00.000Z';
const AHORA = esquemaInstanteUtc.parse(INSTANTE);
const ADMIN_CATALOGO: Actor = {
	usuarioId: '01ADMIN0000000000000000000',
	rol: 'administrador',
	autenticadoEn: INSTANTE,
	sesionIdHash: 'hash-admin',
};

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

describe('estadísticas de consumo (CA-120, CA-121, CA-122, RN-035, RN-060, RN-061)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function persona(nombre: string, rol: 'miembro' | 'administrador' = 'miembro'): string {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@example.test`, rol, instante: INSTANTE });
		return id;
	}

	/** Un tipo con coste medio: sin compra previa, la aplicación no admite consumos de él (TIPO_SIN_COSTE). */
	async function tipo(): Promise<string> {
		const { id } = await darDeAltaCapsula(entorno.ambiente, ADMIN_CATALOGO, {
			nombre: `Tipo ${nuevoId()}`,
			marca: 'Marca de prueba',
			intensidad: 5,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		const comprador = persona('Comprador');
		await registrarCompra(entorno.ambiente, actorDe(comprador), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: id, cantidad: 100, importe: 3483 }],
			confirmoHuchaNegativa: true,
		});
		return id;
	}

	/** Registra un consumo como lo haría la pantalla. Devuelve el identificador y el precio que aplicó la aplicación. */
	function toque(usuarioId: string, tipoCapsulaId: string, horaGesto: string, invitado = false) {
		return registrarConsumo(entorno.ambiente, actorDe(usuarioId), {
			clienteId: nuevoId(),
			tipoCapsulaId,
			invitado,
			horaGesto,
			via: 'directo',
		});
	}

	const OCTUBRE = { periodo: 'mes' as const, mes: esquemaMes.parse('2026-10') };

	it('CA-120: el equipo cuenta cafés por mes y por tipo, con ceros en los meses sin consumos', async () => {
		const ana = persona('Ana');
		const bea = persona('Bea');
		const tipoCafe = await tipo();
		toque(ana, tipoCafe, '2026-03-05T09:00:00.000Z');
		toque(bea, tipoCafe, '2026-03-06T09:00:00.000Z');

		const equipo = leerEquipo(entorno.ambiente.db, actorDe(ana), { periodo: 'anio', anio: 2026 }, AHORA);

		expect(equipo.cafes).toBe(2);
		expect(equipo.porMes).toHaveLength(12);
		expect(equipo.porMes.find((fila) => fila.mes === '2026-03')).toEqual(expect.objectContaining({ cafes: 2 }));
		expect(equipo.porMes.find((fila) => fila.mes === '2026-07')).toEqual(expect.objectContaining({ cafes: 0 }));
		expect(equipo.porTipo).toEqual([{ tipoCapsulaId: tipoCafe, cafes: 2 }]);
	});

	it('CA-120: los invitados van aparte y no suman a los cafés', async () => {
		const ana = persona('Ana');
		const tipoCafe = await tipo();
		toque(ana, tipoCafe, '2026-10-05T09:00:00.000Z', true);
		toque(ana, tipoCafe, '2026-10-06T09:00:00.000Z');

		const equipo = leerEquipo(entorno.ambiente.db, actorDe(ana), OCTUBRE, AHORA);

		expect(equipo).toEqual(expect.objectContaining({ cafes: 1, invitados: 1 }));
	});

	it('CA-121: un administrador ve las mismas cifras de Ana que la propia Ana', async () => {
		const ana = persona('Ana');
		const admin = persona('Administración', 'administrador');
		const tipoCafe = await tipo();
		toque(ana, tipoCafe, '2026-10-07T09:00:00.000Z');

		const comoAna = leerPersonales(entorno.ambiente.db, actorDe(ana), ana, OCTUBRE, AHORA);
		const comoAdmin = leerPersonales(entorno.ambiente.db, actorDe(admin, 'administrador'), ana, OCTUBRE, AHORA);

		expect(comoAdmin).toEqual(comoAna);
	});

	it('RN-035: los consumos anulados no cuentan', async () => {
		const ana = persona('Ana');
		const admin = persona('Administración', 'administrador');
		const tipoCafe = await tipo();
		const anulado = toque(ana, tipoCafe, '2026-10-08T09:00:00.000Z');
		anularConsumo(entorno.ambiente, actorDe(admin, 'administrador'), anulado.id, 'Registro de prueba');

		expect(leerPersonales(entorno.ambiente.db, actorDe(ana), ana, OCTUBRE, AHORA).cafes).toBe(0);
	});

	it('CA-121: un consumo a las 23:59 del 31 de octubre en Madrid cuenta en octubre; a las 00:00 del 1 de noviembre, en noviembre', async () => {
		const ana = persona('Ana');
		const tipoCafe = await tipo();
		toque(ana, tipoCafe, '2026-10-31T22:59:00.000Z');
		toque(ana, tipoCafe, '2026-10-31T23:00:00.000Z');

		const octubre = leerPersonales(entorno.ambiente.db, actorDe(ana), ana, OCTUBRE, AHORA);
		const noviembre = leerPersonales(entorno.ambiente.db, actorDe(ana), ana, { periodo: 'mes', mes: esquemaMes.parse('2026-11') }, AHORA);

		expect(octubre.cafes).toBe(1);
		expect(noviembre.cafes).toBe(1);
	});

	it('CA-122: un miembro que pide las estadísticas de otra persona recibe SIN_PERMISO', () => {
		const ana = persona('Ana');
		const bea = persona('Bea');

		expect(() => leerPersonales(entorno.ambiente.db, actorDe(bea), ana, { periodo: 'todo' }, AHORA)).toThrow(ErrorDeNegocio);
	});

	it('RN-060: un administrador degradado deja de ver las estadísticas de otras personas en la siguiente consulta', () => {
		const ana = persona('Ana');
		const admin = persona('Administración', 'administrador');
		expect(() => leerPersonales(entorno.ambiente.db, actorDe(admin, 'administrador'), ana, { periodo: 'todo' }, AHORA)).not.toThrow();

		const otroAdmin = persona('Otra administración', 'administrador');
		enTransaccion(entorno.ambiente.db, (tx) =>
			cambiarRol(tx, { usuarioId: admin, rolNuevo: 'miembro', actorId: otroAdmin, instante: INSTANTE }),
		);

		expect(() => leerPersonales(entorno.ambiente.db, actorDe(admin), ana, { periodo: 'todo' }, AHORA)).toThrow(ErrorDeNegocio);
	});

	it('el equipo incluye a las personas dadas de baja (RN-046)', async () => {
		const ana = persona('Ana');
		const bea = persona('Bea');
		const tipoCafe = await tipo();
		toque(bea, tipoCafe, '2026-10-09T09:00:00.000Z');
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: bea, instante: INSTANTE }));

		expect(leerEquipo(entorno.ambiente.db, actorDe(ana), OCTUBRE, AHORA).cafes).toBe(1);
	});

	it('gastado suma el precio aplicado de los vigentes, invitados incluidos', async () => {
		const ana = persona('Ana');
		const tipoCafe = await tipo();
		const primero = toque(ana, tipoCafe, '2026-10-10T09:00:00.000Z', true);
		const segundo = toque(ana, tipoCafe, '2026-10-11T09:00:00.000Z');

		expect(leerPersonales(entorno.ambiente.db, actorDe(ana), ana, OCTUBRE, AHORA).gastado).toBe(primero.precio + segundo.precio);
	});

	it('un periodo «todo» sin consumos está vacío', () => {
		const ana = persona('Ana');

		expect(leerPersonales(entorno.ambiente.db, actorDe(ana), ana, { periodo: 'todo' }, AHORA)).toEqual({
			cafes: 0,
			invitados: 0,
			gastado: 0,
			porMes: [],
			porTipo: [],
			rellenos: 0,
			ranking: [],
		});
	});
});

describe('ranking de rellenos del equipo (CA-175, RN-085, RF-175)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		// Sin intervalo, cada relleno se acepta: el ranking depende del autor, no de la espera.
		entorno.ambiente.db
			.insert(configuracion)
			.values({ clave: 'intervalo_rellenos_min', valor: '0', modificadoPor: ADMIN_CATALOGO.usuarioId, modificadoEn: INSTANTE })
			.onConflictDoUpdate({ target: configuracion.clave, set: { valor: '0' } })
			.run();
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function persona(nombre: string, rol: 'miembro' | 'administrador' = 'miembro'): string {
		const id = nuevoId();
		crearUsuario(entorno.ambiente.db, { id, nombre, correo: `${id}@example.test`, rol, instante: INSTANTE });
		return id;
	}

	function rellenar(usuarioId: string): string {
		return registrarRelleno(entorno.ambiente, { usuarioId }, { clienteId: nuevoId() }).id;
	}

	const OCTUBRE = { periodo: 'mes' as const, mes: esquemaMes.parse('2026-10') };
	const NOVIEMBRE = { periodo: 'mes' as const, mes: esquemaMes.parse('2026-11') };

	it('CA-175: el ranking ordena por número de rellenos, de más a menos', () => {
		const ana = persona('Ana');
		const bea = persona('Bea');
		rellenar(bea);
		rellenar(ana);
		rellenar(ana);

		const equipo = leerEquipo(entorno.ambiente.db, actorDe(ana), { periodo: 'todo' }, AHORA);

		expect(equipo.rellenos).toBe(3);
		expect(equipo.ranking).toEqual([
			{ usuarioId: ana, nombre: 'Ana', rellenos: 2, baja: false },
			{ usuarioId: bea, nombre: 'Bea', rellenos: 1, baja: false },
		]);
	});

	it('CA-175: un relleno anulado no cuenta en el ranking', () => {
		const ana = persona('Ana');
		const bea = persona('Bea');
		const admin = persona('Administración', 'administrador');
		rellenar(ana);
		const anulado = rellenar(bea);
		anularRelleno(entorno.ambiente, { usuarioId: admin }, anulado, 'Registro de prueba');

		const equipo = leerEquipo(entorno.ambiente.db, actorDe(ana), { periodo: 'todo' }, AHORA);

		expect(equipo.ranking.map((fila) => fila.nombre)).toEqual(['Ana']);
	});

	it('CA-175: una persona dada de baja sigue en el ranking, marcada como baja (RN-085)', () => {
		const ana = persona('Ana');
		const luis = persona('Luis');
		rellenar(luis);
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: luis, instante: INSTANTE }));

		const equipo = leerEquipo(entorno.ambiente.db, actorDe(ana), { periodo: 'todo' }, AHORA);

		expect(equipo.ranking).toEqual([{ usuarioId: luis, nombre: 'Luis', rellenos: 1, baja: true }]);
	});

	it('CA-175: un relleno a las 23:59 del 31 de octubre en Madrid cuenta en octubre; a las 00:00 del 1 de noviembre, en noviembre', () => {
		const ana = persona('Ana');
		const reloj = crearRelojFijo('2026-10-31T22:59:00.000Z');
		const ambiente = { ...entorno.ambiente, reloj };
		registrarRelleno(ambiente, { usuarioId: ana }, { clienteId: nuevoId() });
		reloj.avanzar(60_000);
		registrarRelleno(ambiente, { usuarioId: ana }, { clienteId: nuevoId() });

		const octubre = leerEquipo(entorno.ambiente.db, actorDe(ana), OCTUBRE, AHORA);
		const noviembre = leerEquipo(entorno.ambiente.db, actorDe(ana), NOVIEMBRE, AHORA);

		expect(octubre.rellenos).toBe(1);
		expect(noviembre.rellenos).toBe(1);
	});
});
