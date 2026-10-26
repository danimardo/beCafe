import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearEntornoPrueba, nuevoId, ErrorDeNegocio, type Db, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, usuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { registrarCompra } from './compras';
import { avisoEconomia, consumo, movimiento } from './esquema';
import { leerSaldoPropio } from './saldos';
import {
	anularConsumo,
	deshacerConsumo,
	leerConsumo,
	leerConsumosRecientesPropios,
	leerHistorialConsumos,
	leerTiposInicio,
	leerTiposRegistrables,
	registrarConsumo,
} from './consumos';
import { cambiarEstadoCapsula } from './capsulas';
import { leerExistenciaTx } from './existencias';
import { prepararMiembros, prepararTipo } from './pruebas/constructores';

const INSTANTE = '2026-10-22T10:00:00.000Z';
const ADMIN: Actor = { usuarioId: '01ADMIN0000000000000000000', rol: 'administrador', autenticadoEn: INSTANTE, sesionIdHash: 'hash-admin' };

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

/** Un administrador real: `anulado_por` referencia a una persona de la base. */
function crearAdministrador(db: Db): string {
	const id = nuevoId();
	crearUsuario(db, { id, nombre: 'Admin de prueba', correo: `admin-${id}@example.test`, rol: 'administrador', instante: INSTANTE });
	return id;
}

describe('consumos de cápsulas (CA-010 a CA-017, CA-060 a CA-063, EV-010, EV-011, EV-041, INV-04, INV-05, INV-06)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Hucha con saldo para que las compras no queden en negativo (RN-011). */
	function dotarHucha(importe: number): void {
		const [dotador] = prepararMiembros(entorno.ambiente.db, 1);
		registrarAportacion(entorno.ambiente, actorDe(dotador), { clienteId: nuevoId(), importe });
	}

	/** Compra que deja el tipo con `cantidad` cápsulas y el coste medio `importe` céntimos por cada `cantidad`. */
	async function comprar(tipo: string, cantidad: number, importe: number): Promise<void> {
		const [comprador] = prepararMiembros(entorno.ambiente.db, 1);
		await registrarCompra(entorno.ambiente, actorDe(comprador), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad, importe }],
			confirmoHuchaNegativa: true,
		});
	}

	function stockDe(tipo: string): number {
		return leerExistenciaTx(entorno.ambiente.db, tipo).stock;
	}

	/** Un miembro activo con su sesión lista para registrar. */
	function miembro(): Actor {
		const [id] = prepararMiembros(entorno.ambiente.db, 1);
		return actorDe(id);
	}

	function datosConsumo(tipo: string, extra: Partial<{ clienteId: string; invitado: boolean; horaGesto: string }> = {}) {
		return {
			clienteId: extra.clienteId ?? nuevoId(),
			tipoCapsulaId: tipo,
			invitado: extra.invitado ?? false,
			horaGesto: extra.horaGesto ?? INSTANTE,
			via: 'directo' as const,
		};
	}

	it('CA-011: un consumo de un tipo con coste 3483 baja el stock en 1 y carga 35 céntimos al autor', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const stockAntes = stockDe(tipo);

		const resultado = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));

		expect(resultado).toMatchObject({ precio: 35, descuadre: false, duplicado: false });
		expect(stockDe(tipo)).toBe(stockAntes - 1);
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(-35);
	});

	it('CA-012: el consumo guarda la hora del toque y la de recepción (RF-018)', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		entorno.reloj.avanzar(60_000);
		const horaGesto = '2026-10-22T10:00:30.000Z';

		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo, { horaGesto }));

		const fila = entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get();
		expect(fila).toMatchObject({ horaGesto, horaRegistro: '2026-10-22T10:01:00.000Z', costeMedioAplicado: 3483 });
	});

	it('Clarifications 9: una hora del toque posterior a la recepción se sustituye por la de recepción', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();

		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo, { horaGesto: '2026-10-22T11:00:00.000Z' }));

		const fila = entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get();
		expect(fila?.horaGesto).toBe(INSTANTE);
	});

	it('CA-014: un consumo de invitado queda marcado y el cargo va al autor', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();

		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo, { invitado: true }));

		expect(entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get()?.invitado).toBe(true);
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(-35);
	});

	it('CA-016, EV-010, INV-04: el mismo clienteId devuelve el consumo original sin crear otro ni otro cargo', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const datos = datosConsumo(tipo);

		const primero = registrarConsumo(entorno.ambiente, ana, datos);
		const reenvio = registrarConsumo(entorno.ambiente, ana, datos);

		expect(reenvio).toMatchObject({ id: primero.id, precio: 35, duplicado: true });
		expect(entorno.ambiente.db.select().from(consumo).all()).toHaveLength(1);
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(-35);
		expect(stockDe(tipo)).toBe(99);
		expect(entorno.eventos().map((evento) => evento.codigo)).toContain('consumo.duplicado');
	});

	it('CA-017: con stock 0 y coste 4000, el stock pasa a −1, el cargo es de 40 céntimos y queda el aviso para administradores', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 1, 40);
		registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));
		const luis = miembro();

		const resultado = registrarConsumo(entorno.ambiente, luis, datosConsumo(tipo));

		expect(resultado).toMatchObject({ precio: 40, descuadre: true });
		expect(stockDe(tipo)).toBe(-1);
		expect(leerSaldoPropio(entorno.ambiente.db, luis)).toBe(-40);
		const avisos = entorno.ambiente.db.select().from(avisoEconomia).where(eq(avisoEconomia.origenId, resultado.id)).all();
		expect(avisos).toMatchObject([{ tipo: 'stock_negativo', origenTipo: 'consumo' }]);
	});

	it('CA-217: con stock 0, si la tarjeta lo mostraba sin stock y no hay confirmación, se rechaza sin escribir nada', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 1, 40);
		registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));
		const luis = miembro();

		expect(() => registrarConsumo(entorno.ambiente, luis, { ...datosConsumo(tipo), sinStockVisto: true })).toThrow(
			expect.objectContaining({ codigo: 'CONFIRMAR_SIN_STOCK' }),
		);

		expect(stockDe(tipo)).toBe(0);
		expect(leerSaldoPropio(entorno.ambiente.db, luis)).toBe(0);
		expect(entorno.ambiente.db.select().from(avisoEconomia).all()).toEqual([]);
	});

	it('CA-217: con stock 0 y confirmación, se registra como en CA-017 (stock −1 y aviso de descuadre)', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 1, 40);
		registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));

		const resultado = registrarConsumo(entorno.ambiente, miembro(), { ...datosConsumo(tipo), sinStockVisto: true, confirmado: true });

		expect(resultado).toMatchObject({ precio: 40, descuadre: true });
		expect(stockDe(tipo)).toBe(-1);
	});

	it('CA-217: una tarjeta cargada con stock cuyo stock real ya es 0 se registra con un solo toque', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 1, 40);
		registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));

		// Sin `sinStockVisto`: la persona vio la tarjeta con stock y no se le pide confirmar (RF-011).
		const resultado = registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));

		expect(resultado).toMatchObject({ descuadre: true });
		expect(stockDe(tipo)).toBe(-1);
	});

	it('CA-217: una tarjeta con la marca de sin stock y stock real positivo se registra sin pedir confirmación', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 3, 120);

		const resultado = registrarConsumo(entorno.ambiente, miembro(), { ...datosConsumo(tipo), sinStockVisto: true });

		expect(resultado).toMatchObject({ descuadre: false });
		expect(stockDe(tipo)).toBe(2);
	});

	it('CA-013: un consumo se deshace dentro de los 5 segundos y el stock vuelve a su valor', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 10, 3483);
		const ana = miembro();
		const stockAntes = stockDe(tipo);
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(4000);

		deshacerConsumo(entorno.ambiente, ana, id);

		const fila = entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get();
		expect(fila).toMatchObject({ estado: 'anulado', motivoAnulacion: 'Deshecho por el autor', anuladoPor: ana.usuarioId });
		expect(stockDe(tipo)).toBe(stockAntes);
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(0);
	});

	it('Clarifications 5: deshacer a los 10 minutos se acepta; a los 16 minutos, FUERA_DE_PLAZO', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const aceptado = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(10 * 60_000);
		expect(() => deshacerConsumo(entorno.ambiente, ana, aceptado.id)).not.toThrow();

		const tardio = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(16 * 60_000);
		expect(() => deshacerConsumo(entorno.ambiente, ana, tardio.id)).toThrow(new ErrorDeNegocio('FUERA_DE_PLAZO'));
	});

	it('CA-013 y RN-031: deshacer el consumo de otra persona se rechaza con SIN_PERMISO', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const { id } = registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo));

		expect(() => deshacerConsumo(entorno.ambiente, miembro(), id)).toThrow(new ErrorDeNegocio('SIN_PERMISO'));
	});

	it('CA-010 y RN-006: solo los tipos activos con coste medio son registrables', async () => {
		dotarHucha(5000);
		const conCoste = await prepararTipo(entorno.ambiente);
		await comprar(conCoste, 100, 3483);
		const sinCompras = await prepararTipo(entorno.ambiente);
		const retirado = await prepararTipo(entorno.ambiente);
		await comprar(retirado, 100, 3483);
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, retirado, 'retirado');

		const ids = leerTiposRegistrables(entorno.ambiente.db, miembro(), INSTANTE).map((tipo) => tipo.id);

		expect(ids).toContain(conCoste);
		expect(ids).not.toContain(sinCompras);
		expect(ids).not.toContain(retirado);
	});

	it('TIPO_SIN_COSTE: un tipo sin coste medio no admite consumos', async () => {
		const tipo = await prepararTipo(entorno.ambiente);

		expect(() => registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo))).toThrow(new ErrorDeNegocio('TIPO_SIN_COSTE'));
	});

	it('Clarifications 3: un consumo en cola de un tipo retirado con coste se acepta', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		cambiarEstadoCapsula(entorno.ambiente, ADMIN, tipo, 'retirado');

		expect(registrarConsumo(entorno.ambiente, miembro(), datosConsumo(tipo))).toMatchObject({ precio: 35 });
	});

	it('Clarifications 8: con coste 40 el precio es 0 y el consumo se registra sin movimiento', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 40);
		const ana = miembro();
		const movimientosAntes = entorno.ambiente.db.select().from(movimiento).all().length;

		const resultado = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));

		expect(resultado).toMatchObject({ precio: 0, duplicado: false });
		expect(entorno.ambiente.db.select().from(movimiento).all()).toHaveLength(movimientosAntes);
	});

	it('EV-041, INV-06, RN-054: una persona dada de baja no registra consumos (USUARIO_DE_BAJA)', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		entorno.ambiente.db.update(usuario).set({ estado: 'baja' }).where(eq(usuario.id, ana.usuarioId)).run();

		expect(() => registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo))).toThrow(new ErrorDeNegocio('USUARIO_DE_BAJA'));
		expect(entorno.ambiente.db.select().from(consumo).all()).toHaveLength(0);
	});

	it('CA-060: el autor anula con motivo su consumo de hace 10 minutos; el cargo deja de contar', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(10 * 60_000);

		anularConsumo(entorno.ambiente, ana, id, 'Lo pedí dos veces');

		expect(entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get()?.estado).toBe('anulado');
		expect(leerSaldoPropio(entorno.ambiente.db, ana)).toBe(0);
	});

	it('CA-061: un administrador anula un consumo de hace 3 días y queda como autor de la anulación', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(3 * 24 * 60 * 60_000);

		const administrador = actorDe(crearAdministrador(entorno.ambiente.db), 'administrador');
		anularConsumo(entorno.ambiente, administrador, id, 'Error de registro');

		expect(entorno.ambiente.db.select().from(consumo).where(eq(consumo.id, id)).get()).toMatchObject({
			estado: 'anulado',
			anuladoPor: administrador.usuarioId,
		});
	});

	it('CA-062: el autor no anula a los 20 minutos (FUERA_DE_PLAZO) y otro miembro no anula el consumo ajeno (SIN_PERMISO)', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(20 * 60_000);

		expect(() => anularConsumo(entorno.ambiente, ana, id, 'Tarde')).toThrow(new ErrorDeNegocio('FUERA_DE_PLAZO'));
		expect(() => anularConsumo(entorno.ambiente, miembro(), id, 'Ajeno')).toThrow(new ErrorDeNegocio('SIN_PERMISO'));
	});

	it('EV-011, INV-05: una segunda anulación del mismo consumo se rechaza con YA_ANULADO', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		anularConsumo(entorno.ambiente, ana, id, 'Primera');

		expect(() => anularConsumo(entorno.ambiente, ana, id, 'Segunda')).toThrow(new ErrorDeNegocio('YA_ANULADO'));
		expect(stockDe(tipo)).toBe(100);
	});

	it('RN-013: anular un consumo sube el stock en 1 y no cambia el coste medio', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const { id } = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		const costeAntes = leerExistenciaTx(entorno.ambiente.db, tipo).costeMedio;

		anularConsumo(entorno.ambiente, ana, id, 'Error');

		expect(stockDe(tipo)).toBe(100);
		expect(leerExistenciaTx(entorno.ambiente.db, tipo).costeMedio).toBe(costeAntes);
	});

	it('RF-060 y RN-034: un consumo ajeno no se lee y el historial de un miembro solo muestra los suyos', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const luis = miembro();
		const propio = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		registrarConsumo(entorno.ambiente, luis, datosConsumo(tipo));

		expect(() => leerConsumo(entorno.ambiente.db, luis, propio.id)).toThrow('RECURSO_NO_ENCONTRADO');
		expect(leerHistorialConsumos(entorno.ambiente.db, ana, 1).filas.map((fila) => fila.id)).toEqual([propio.id]);
		expect(leerHistorialConsumos(entorno.ambiente.db, ADMIN, 1).filas).toHaveLength(2);
	});

	it('Tus últimos consumos: solo los vigentes del autor dentro del plazo de autoanulación', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 100, 3483);
		const ana = miembro();
		const viejo = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));
		entorno.reloj.avanzar(20 * 60_000);
		const reciente = registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));

		const ids = leerConsumosRecientesPropios(entorno.ambiente.db, ana, entorno.reloj.ahora()).map((fila) => fila.id);

		expect(ids).toEqual([reciente.id]);
		expect(ids).not.toContain(viejo.id);
	});

	it('RN-073: la estimación de días usa los consumos de los últimos 30 días', async () => {
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await comprar(tipo, 300, 3483);
		const ana = miembro();
		for (let i = 0; i < 3; i += 1) registrarConsumo(entorno.ambiente, ana, datosConsumo(tipo));

		const fila = leerTiposRegistrables(entorno.ambiente.db, ana, entorno.reloj.ahora()).find(
			(tipoRegistrable) => tipoRegistrable.id === tipo,
		);

		// 297 cápsulas, 3 consumos en 30 días: floor(297 × 30 ÷ 3) = 2970 días.
		expect(fila?.estimacion).toEqual({ tipo: 'dias', dias: 2970 });
	});

	describe('orden de las cápsulas en Inicio (RN-090, CA-245)', () => {
		/** Dos tipos comprados y listos para consumir. */
		async function dosTipos(): Promise<[string, string]> {
			dotarHucha(50000);
			const a = await prepararTipo(entorno.ambiente);
			const b = await prepararTipo(entorno.ambiente);
			await comprar(a, 100, 3483);
			await comprar(b, 100, 3483);
			return [a, b];
		}

		const primero = (actor: Actor) => leerTiposInicio(entorno.ambiente.db, actor, INSTANTE)[0]?.id;
		const haceDias = (dias: number) => new Date(Date.parse(INSTANTE) - dias * 86_400_000).toISOString();

		it('CA-245: los consumos propios mandan sobre los del departamento', async () => {
			const [a, b] = await dosTipos();
			const ana = miembro();
			const otra = miembro();
			for (let i = 0; i < 5; i += 1) registrarConsumo(entorno.ambiente, otra, datosConsumo(a));
			for (let i = 0; i < 2; i += 1) registrarConsumo(entorno.ambiente, ana, datosConsumo(b, { invitado: i === 0 }));

			expect(primero(ana)).toBe(b);
			expect(primero(otra)).toBe(a);
		});

		it('CA-245: sin consumos propios en 30 días, manda el departamento', async () => {
			const [a, b] = await dosTipos();
			const nueva = miembro();
			const otra = miembro();
			registrarConsumo(entorno.ambiente, otra, datosConsumo(b));
			registrarConsumo(entorno.ambiente, otra, datosConsumo(b));
			registrarConsumo(entorno.ambiente, otra, datosConsumo(a));

			expect(primero(nueva)).toBe(b);
		});

		it('CA-245: un consumo de hace 31 días no cuenta; uno de hace 29 sí', async () => {
			const [a, b] = await dosTipos();
			const ana = miembro();
			for (let i = 0; i < 3; i += 1) registrarConsumo(entorno.ambiente, ana, datosConsumo(b, { horaGesto: haceDias(31) }));
			registrarConsumo(entorno.ambiente, ana, datosConsumo(a));
			expect(primero(ana)).toBe(a);

			for (let i = 0; i < 2; i += 1) registrarConsumo(entorno.ambiente, ana, datosConsumo(b, { horaGesto: haceDias(29) }));
			expect(primero(ana)).toBe(b);
		});

		it('CA-245: un consumo anulado no cuenta', async () => {
			const [a, b] = await dosTipos();
			const ana = miembro();
			const administrador = actorDe(crearAdministrador(entorno.ambiente.db), 'administrador');
			registrarConsumo(entorno.ambiente, ana, datosConsumo(a));
			const anulables = [0, 1].map(() => registrarConsumo(entorno.ambiente, ana, datosConsumo(b)));
			for (const resultado of anulables) anularConsumo(entorno.ambiente, administrador, resultado.id, 'Prueba');

			expect(primero(ana)).toBe(a);
		});

		it('CA-245: con la misma cuenta, el orden es el alfabético de siempre y mantiene todos los tipos', async () => {
			const [a, b] = await dosTipos();
			const ana = miembro();

			const ids = leerTiposInicio(entorno.ambiente.db, ana, INSTANTE).map((tipo) => tipo.id);

			expect([...ids].sort()).toEqual([a, b].sort());
			expect(ids).toEqual(leerTiposRegistrables(entorno.ambiente.db, ana, INSTANTE).map((tipo) => tipo.id));
		});
	});
});
