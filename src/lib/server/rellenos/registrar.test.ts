import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import fc from 'fast-check';
import { configuracion } from '#lib/server/configuracion';
import { saldoPersona } from '#lib/server/economia';
import { ErrorDeNegocio, enTransaccion, nuevoId, type EntornoPrueba, crearEntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, marcarBaja } from '#lib/server/usuarios';
import { anularRelleno } from './anular';
import { registrarRelleno } from './registrar';
import { rellenoAgua } from './esquema';

// Plan F8 D1, tarea T005/T007: registro con intervalo, idempotencia y su invariante (RF-171, RN-080, RN-082, INV-07).
const INSTANTE = '2026-10-23T10:00:00.000Z';
const MINUTO = 60_000;

describe('registrarRelleno (CA-172, RN-082, INV-07)', () => {
	let entorno: EntornoPrueba;
	let ana: string;
	let luis: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		ana = nuevoId();
		luis = nuevoId();
		crearUsuario(entorno.ambiente.db, { id: ana, nombre: 'Ana', correo: `${ana}@example.test`, rol: 'miembro', instante: INSTANTE });
		crearUsuario(entorno.ambiente.db, { id: luis, nombre: 'Luis', correo: `${luis}@example.test`, rol: 'miembro', instante: INSTANTE });
	});

	afterEach(() => {
		entorno.cerrar();
	});

	function fijarIntervalo(minutos: number) {
		entorno.ambiente.db
			.insert(configuracion)
			.values({ clave: 'intervalo_rellenos_min', valor: String(minutos), modificadoPor: ana, modificadoEn: INSTANTE })
			.onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(minutos) } })
			.run();
	}

	function registrar(persona: string) {
		return registrarRelleno(entorno.ambiente, { usuarioId: persona }, { clienteId: nuevoId() });
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

	it('CA-172: a los 20 min de un relleno de Ana, con intervalo de 60, Luis recibe RELLENO_RECIENTE con el autor y el instante', () => {
		registrar(ana);
		entorno.reloj.avanzar(20 * MINUTO);

		const error = rechazo(() => registrar(luis));

		expect(error.codigo).toBe('RELLENO_RECIENTE');
		expect(error.detalle).toEqual({ autorId: ana, registradoEn: INSTANTE, esPropio: false });
	});

	it('CA-172: si se anula el relleno de Ana, Luis puede registrar dentro del intervalo', () => {
		const primero = registrar(ana);
		anularRelleno(entorno.ambiente, { usuarioId: ana }, primero.id, 'Me equivoqué');
		entorno.reloj.avanzar(20 * MINUTO);

		expect(registrar(luis).duplicado).toBe(false);
	});

	it('el límite es exacto: a los 60 min se acepta y a los 59 min 59 s no', () => {
		registrar(ana);
		entorno.reloj.avanzar(60 * MINUTO - 1000);
		expect(rechazo(() => registrar(luis)).codigo).toBe('RELLENO_RECIENTE');

		entorno.reloj.avanzar(1000);
		expect(registrar(luis).duplicado).toBe(false);
	});

	it('con intervalo 0 no hay comprobación: se acepta cada relleno', () => {
		fijarIntervalo(0);
		registrar(ana);
		expect(registrar(luis).duplicado).toBe(false);
		expect(registrar(ana).duplicado).toBe(false);
	});

	it('un cambio de intervalo se aplica al siguiente registro', () => {
		registrar(ana);
		entorno.reloj.avanzar(10 * MINUTO);
		fijarIntervalo(5);
		expect(registrar(luis).duplicado).toBe(false);
	});

	it('un clienteId repetido devuelve el relleno original y no crea otro', () => {
		const clienteId = nuevoId();
		const primero = registrarRelleno(entorno.ambiente, { usuarioId: ana }, { clienteId });
		const reenvio = registrarRelleno(entorno.ambiente, { usuarioId: ana }, { clienteId });

		expect(reenvio).toEqual({ id: primero.id, duplicado: true });
		const filas = entorno.ambiente.db.select().from(rellenoAgua).where(eq(rellenoAgua.clienteId, clienteId)).all();
		expect(filas).toHaveLength(1);
	});

	it('la persona de baja no puede registrar', () => {
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: luis, instante: INSTANTE }));

		expect(rechazo(() => registrar(luis)).codigo).toBe('USUARIO_DE_BAJA');
	});

	it('RN-080: registrar un relleno no cambia los saldos', () => {
		const antes = saldoPersona(entorno.ambiente.db, ana);

		registrar(ana);

		expect(saldoPersona(entorno.ambiente.db, ana)).toBe(antes);
	});

	it('INV-07: tras una secuencia aleatoria de registros y anulaciones, dos rellenos vigentes consecutivos están separados al menos el intervalo', () => {
		// Un solo entorno con migraciones para todos los casos: cada caso vacía la tabla antes (crear una base por caso excede el tiempo de la prueba).
		const entornoLocal = crearEntornoPrueba(INSTANTE);
		try {
			fc.assert(
				fc.property(fc.array(fc.record({ minutos: fc.integer({ min: 0, max: 90 }), anular: fc.boolean() }), { maxLength: 20 }), (pasos) => {
					entornoLocal.ambiente.db.delete(rellenoAgua).run();
					const persona = nuevoId();
					crearUsuario(entornoLocal.ambiente.db, {
						id: persona,
						nombre: 'Ana',
						correo: `${persona}@example.test`,
						rol: 'miembro',
						instante: INSTANTE,
					});
					const registrados: { id: string; instante: number }[] = [];
					for (const paso of pasos) {
						entornoLocal.reloj.avanzar(paso.minutos * MINUTO);
						try {
							const resultado = registrarRelleno(entornoLocal.ambiente, { usuarioId: persona }, { clienteId: nuevoId() });
							registrados.push({ id: resultado.id, instante: Date.parse(entornoLocal.reloj.ahora()) });
						} catch (causa) {
							if (!(causa instanceof ErrorDeNegocio) || causa.codigo !== 'RELLENO_RECIENTE') throw causa;
						}
						if (paso.anular && registrados.length > 0) {
							try {
								anularRelleno(entornoLocal.ambiente, { usuarioId: persona }, registrados[registrados.length - 1].id, 'prueba');
								registrados.pop();
							} catch (causa) {
								if (!(causa instanceof ErrorDeNegocio) || causa.codigo !== 'FUERA_DE_PLAZO') throw causa;
							}
						}
					}
					const vigentes = entornoLocal.ambiente.db.select().from(rellenoAgua).where(eq(rellenoAgua.estado, 'vigente')).all();
					const instantes = vigentes.map((fila) => Date.parse(fila.registradoEn)).sort((a, b) => a - b);
					return instantes.every((instante, indice) => indice === 0 || instante - instantes[indice - 1] >= 60 * MINUTO);
				}),
				{ numRuns: 50 },
			);
		} finally {
			entornoLocal.cerrar();
		}
	});
});
