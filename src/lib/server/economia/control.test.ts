import { asc, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearAzarFijo, crearEntornoPrueba, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { z } from 'zod';
import { notificacion } from '#lib/server/notificaciones';
import { crearUsuario, usuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { registrarCompra } from './compras';
import {
	anularArqueo,
	anularLineaRecuento,
	confirmarArqueo,
	confirmarRecuento,
	leerControl,
	previsualizarArqueo,
	previsualizarRecuento,
} from './control';
import { leerSaldoHucha, leerSaldoPropio } from './saldos';
import { prepararMiembros, prepararTipo } from './pruebas/constructores';
import { arqueo, existencia, lineaRecuento, movimiento, reparto } from './esquema';

const INSTANTE = '2026-10-21T09:00:00.000Z';
const MINUTO = 60_000;

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro', autenticadoEn = INSTANTE): Actor {
	return { usuarioId, rol, autenticadoEn, sesionIdHash: `hash-${usuarioId}` };
}

/** Un administrador activo: también cuenta como miembro para el reparto. */
function crearAdmin(entorno: EntornoPrueba): Actor {
	const id = nuevoId();
	crearUsuario(entorno.ambiente.db, { id, nombre: 'Admin', correo: `admin-${id}@ejemplo.test`, rol: 'administrador', instante: INSTANTE });
	return actorDe(id, 'administrador');
}

describe('control de la hucha y del stock (CA-080 a CA-093, CA-064, CA-138)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo(Array.from({ length: 50 }, () => 0)));
	});

	afterEach(() => {
		entorno.cerrar();
	});

	/** Hucha con un saldo teórico dado, aportado por una persona. */
	function dotarHucha(importe: number): void {
		const [dotador] = prepararMiembros(entorno.ambiente.db, 1);
		registrarAportacion(entorno.ambiente, actorDe(dotador), { clienteId: nuevoId(), importe });
	}

	it('CA-080: teórico 42,00 € y contado 35,00 € dan diferencia −7,00 € y guardan el saldo teórico', async () => {
		const admin = crearAdmin(entorno);
		dotarHucha(4200);
		const prevision = previsualizarArqueo(entorno.ambiente.db, admin, 3500);
		expect(prevision).toMatchObject({ saldoTeorico: 4200, diferencia: -700 });

		const id = await confirmarArqueo(entorno.ambiente, admin, {
			contado: 3500,
			contadoPrevisto: 3500,
			saldoTeoricoPrevisto: 4200,
			contrasenaActual: undefined,
		});

		expect(entorno.ambiente.db.select().from(arqueo).get()).toMatchObject({ id, saldoTeorico: 4200, contado: 3500, diferencia: -700 });
		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(3500);
	});

	it('CA-081: −7,00 € entre 6 personas activas da cuatro de −1,17 € y dos de −1,16 €, con azar fijo', async () => {
		entorno.cerrar();
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo([0, 0, 0, 0]));
		const admin = crearAdmin(entorno);
		prepararMiembros(entorno.ambiente.db, 5);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 4200 });

		await confirmarArqueo(entorno.ambiente, admin, {
			contado: 3500,
			contadoPrevisto: 3500,
			saldoTeoricoPrevisto: 4200,
			contrasenaActual: undefined,
		});

		const partes = entorno.ambiente.db
			.select()
			.from(movimiento)
			.all()
			.filter((m) => m.tipo === 'reparto_arqueo')
			.map((m) => m.importe);
		expect(partes.filter((importe) => importe === -117)).toHaveLength(4);
		expect(partes.filter((importe) => importe === -116)).toHaveLength(2);
		expect(partes.reduce((suma, importe) => suma + importe, 0)).toBe(-700);
		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(3500);
		expect(entorno.ambiente.db.select().from(reparto).all()).toHaveLength(1);
	});

	it('CA-090 y CA-091: stock 30 a coste 0,4000 € cuenta 24 → stock 24 y reparto de −2,40 €', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 30, importe: 1200 }],
			confirmoHuchaNegativa: false,
		});

		const prevision = previsualizarRecuento(entorno.ambiente.db, admin, [{ tipoCapsulaId: tipo, contado: 24, registradoPrevisto: 30 }]);
		expect(prevision[0]).toMatchObject({ registrado: 30, diferencia: -6, valorFaltante: 240 });

		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 24, registradoPrevisto: 30 }],
			contrasenaActual: undefined,
		});

		expect(
			entorno.ambiente.db
				.select()
				.from(movimiento)
				.all()
				.filter((m) => m.tipo === 'reparto_recuento')
				.reduce((s, m) => s + m.importe, 0),
		).toBe(-240);
	});

	it('CA-092: stock 20 con 23 contados sube a 23 sin movimientos y con el mismo coste', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 20, importe: 800 }],
			confirmoHuchaNegativa: false,
		});
		const movimientosAntes = entorno.ambiente.db.select().from(movimiento).all().length;

		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 23, registradoPrevisto: 20 }],
			contrasenaActual: undefined,
		});

		expect(entorno.ambiente.db.select().from(movimiento).all().length).toBe(movimientosAntes);
		expect(
			entorno.ambiente.db
				.select()
				.from(movimiento)
				.all()
				.filter((m) => m.tipo.startsWith('reparto')),
		).toHaveLength(0);
	});

	it('Clarifications 6: un faltante de un tipo sin coste vale 0 € y no reparte nada', async () => {
		const admin = crearAdmin(entorno);
		prepararMiembros(entorno.ambiente.db, 2);
		const tipo = await prepararTipo(entorno.ambiente);
		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 5, registradoPrevisto: 0 }],
			contrasenaActual: undefined,
		});

		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 3, registradoPrevisto: 5 }],
			contrasenaActual: undefined,
		});

		expect(entorno.ambiente.db.select().from(reparto).all()).toHaveLength(0);
	});

	it('CA-093: un arqueo no cambia el stock y un recuento no cambia la hucha', async () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		dotarHucha(5000);
		const tipo = await prepararTipo(entorno.ambiente);
		await registrarCompra(entorno.ambiente, actorDe(ana), {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 10, importe: 400 }],
			confirmoHuchaNegativa: false,
		});

		await confirmarArqueo(entorno.ambiente, admin, {
			contado: 4000,
			contadoPrevisto: 4000,
			saldoTeoricoPrevisto: 4600,
			contrasenaActual: undefined,
		});
		const saldoTrasArqueo = leerSaldoHucha(entorno.ambiente.db).saldo;
		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 9, registradoPrevisto: 10 }],
			contrasenaActual: undefined,
		});

		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(saldoTrasArqueo);
	});

	it('CA-064: no se anula el arqueo A1 mientras exista A2; al anular A2, A1 sí se puede anular', async () => {
		const admin = crearAdmin(entorno);
		dotarHucha(4200);
		const a1 = await confirmarArqueo(entorno.ambiente, admin, {
			contado: 4000,
			contadoPrevisto: 4000,
			saldoTeoricoPrevisto: 4200,
			contrasenaActual: undefined,
		});
		entorno.reloj.avanzar(MINUTO);
		const a2 = await confirmarArqueo(entorno.ambiente, admin, {
			contado: 3800,
			contadoPrevisto: 3800,
			saldoTeoricoPrevisto: 4000,
			contrasenaActual: undefined,
		});

		await expect(anularArqueo(entorno.ambiente, admin, { id: a1, motivo: 'Error', contrasenaActual: undefined })).rejects.toThrow(
			'NO_ES_EL_ULTIMO',
		);
		await anularArqueo(entorno.ambiente, admin, { id: a2, motivo: 'Error', contrasenaActual: undefined });
		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(4000);
		await anularArqueo(entorno.ambiente, admin, { id: a1, motivo: 'Error', contrasenaActual: undefined });
		expect(leerSaldoHucha(entorno.ambiente.db).saldo).toBe(4200);
	});

	it('CA-064: no se anula la línea R1 de un tipo mientras exista R2; al anular R2 el stock vuelve a su valor anterior', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 5, registradoPrevisto: 0 }],
			contrasenaActual: undefined,
		});
		entorno.reloj.avanzar(MINUTO);
		await confirmarRecuento(entorno.ambiente, admin, {
			lineas: [{ tipoCapsulaId: tipo, contado: 7, registradoPrevisto: 5 }],
			contrasenaActual: undefined,
		});
		const lineas = entorno.ambiente.db.select().from(lineaRecuento).orderBy(asc(lineaRecuento.contado)).all();
		expect(lineas).toHaveLength(2);
		const [r1, r2] = lineas;

		await expect(anularLineaRecuento(entorno.ambiente, admin, { id: r1.id, motivo: 'Error', contrasenaActual: undefined })).rejects.toThrow(
			'NO_ES_EL_ULTIMO',
		);
		await anularLineaRecuento(entorno.ambiente, admin, { id: r2.id, motivo: 'Error', contrasenaActual: undefined });
		expect(entorno.ambiente.db.select().from(existencia).get()?.stock).toBe(5);
		await anularLineaRecuento(entorno.ambiente, admin, { id: r1.id, motivo: 'Error', contrasenaActual: undefined });
		expect(entorno.ambiente.db.select().from(existencia).get()?.stock).toBe(0);
	});

	it('CAMBIO_CONCURRENTE: si el teórico cambió desde la vista previa, el arqueo no se guarda', async () => {
		const admin = crearAdmin(entorno);
		dotarHucha(4200);

		await expect(
			confirmarArqueo(entorno.ambiente, admin, {
				contado: 3500,
				contadoPrevisto: 3500,
				saldoTeoricoPrevisto: 9999,
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('CAMBIO_CONCURRENTE');
		expect(entorno.ambiente.db.select().from(arqueo).all()).toHaveLength(0);
	});

	it('CA-138: con la última autenticación a 16 minutos se pide la contraseña; a 15 minutos no', async () => {
		const admin16 = crearAdmin(entorno);
		const hace16 = actorDe(admin16.usuarioId, 'administrador', '2026-10-21T08:44:00.000Z');
		await expect(
			confirmarArqueo(entorno.ambiente, hace16, { contado: 0, contadoPrevisto: 0, saldoTeoricoPrevisto: 0, contrasenaActual: undefined }),
		).rejects.toThrow('REAUTENTICACION_REQUERIDA');
		const hace15 = actorDe(admin16.usuarioId, 'administrador', '2026-10-21T08:45:00.000Z');
		await expect(
			confirmarArqueo(entorno.ambiente, hace15, { contado: 0, contadoPrevisto: 0, saldoTeoricoPrevisto: 0, contrasenaActual: undefined }),
		).resolves.toEqual(expect.any(String));
	});

	it('un miembro no puede registrar un arqueo ni leer el control', () => {
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		expect(() => leerControl(entorno.ambiente.db, actorDe(ana))).toThrow('SIN_PERMISO');
		expect(leerSaldoPropio(entorno.ambiente.db, actorDe(ana))).toBe(0);
	});

	describe('aviso de recuento (RF-246, CA-246)', () => {
		const esquemaDatos = z.object({
			accion: z.string(),
			importe: z.number(),
			personas: z.number(),
			minimo: z.number(),
			maximo: z.number(),
			lineas: z.array(z.object({ diferencia: z.number() })),
		});

		function avisos() {
			return entorno.ambiente.db
				.select()
				.from(notificacion)
				.all()
				.filter((fila) => fila.tipo === 'recuento')
				.map((fila) => ({ usuarioId: fila.usuarioId, origenId: fila.origenId, datos: esquemaDatos.parse(JSON.parse(fila.datos)) }));
		}

		/** Hucha con saldo y un tipo con 30 cápsulas a 0,4000 € cada una. */
		async function tipoConStock(): Promise<string> {
			const [ana] = prepararMiembros(entorno.ambiente.db, 1);
			dotarHucha(5000);
			const tipo = await prepararTipo(entorno.ambiente);
			await registrarCompra(entorno.ambiente, actorDe(ana), {
				clienteId: nuevoId(),
				lineas: [{ tipoCapsulaId: tipo, cantidad: 30, importe: 1200 }],
				confirmoHuchaNegativa: false,
			});
			return tipo;
		}

		const recontar = (admin: Actor, tipoCapsulaId: string, contado: number, registradoPrevisto: number) =>
			confirmarRecuento(entorno.ambiente, admin, { lineas: [{ tipoCapsulaId, contado, registradoPrevisto }], contrasenaActual: undefined });

		it('CA-246: un faltante avisa a cada persona activa con el importe y el rango que coinciden con los cargos', async () => {
			const admin = crearAdmin(entorno);
			prepararMiembros(entorno.ambiente.db, 2);
			const tipo = await tipoConStock();

			const id = await recontar(admin, tipo, 24, 30);

			const filas = avisos();
			const activas = entorno.ambiente.db
				.select()
				.from(usuario)
				.all()
				.filter((persona) => persona.estado === 'activo');
			expect(filas.map((fila) => fila.usuarioId).sort()).toEqual(activas.map((persona) => persona.id).sort());
			const cargos = entorno.ambiente.db
				.select()
				.from(movimiento)
				.all()
				.filter((m) => m.tipo === 'reparto_recuento')
				.map((m) => -m.importe);
			const [{ datos, origenId }] = filas;
			expect(origenId).toBe(id);
			expect(datos).toMatchObject({ accion: 'registrado', lineas: [{ diferencia: -6 }], importe: 240, personas: activas.length });
			expect(datos.importe).toBe(cargos.reduce((suma, cargo) => suma + cargo, 0));
			expect(datos.maximo).toBe(Math.max(...cargos, 0));
			expect(datos.minimo).toBe(datos.personas === cargos.length ? Math.min(...cargos) : 0);
		});

		it('CA-246: un sobrante avisa sin cargos', async () => {
			const admin = crearAdmin(entorno);
			const tipo = await tipoConStock();

			await recontar(admin, tipo, 33, 30);

			expect(avisos()[0]?.datos).toMatchObject({ lineas: [{ diferencia: 3 }], importe: 0, personas: 0, minimo: 0, maximo: 0 });
		});

		it('CA-246: un recuento sin diferencias no avisa', async () => {
			const admin = crearAdmin(entorno);
			const tipo = await tipoConStock();

			await recontar(admin, tipo, 30, 30);

			expect(avisos()).toHaveLength(0);
		});

		it('CA-246: un cambio concurrente no deja aviso', async () => {
			const admin = crearAdmin(entorno);
			const tipo = await tipoConStock();

			await expect(recontar(admin, tipo, 24, 29)).rejects.toThrow('CAMBIO_CONCURRENTE');

			expect(avisos()).toHaveLength(0);
		});

		it('CA-246: una persona de baja no recibe el aviso', async () => {
			const admin = crearAdmin(entorno);
			const [baja] = prepararMiembros(entorno.ambiente.db, 1);
			const tipo = await tipoConStock();
			entorno.ambiente.db.update(usuario).set({ estado: 'baja' }).where(eq(usuario.id, baja)).run();

			await recontar(admin, tipo, 24, 30);

			expect(avisos().map((fila) => fila.usuarioId)).not.toContain(baja);
			expect(avisos().length).toBeGreaterThan(0);
		});

		it('CA-246: anular la línea avisa de nuevo con la acción «anulado»; una línea sin diferencia no avisa', async () => {
			const admin = crearAdmin(entorno);
			const tipo = await tipoConStock();
			await recontar(admin, tipo, 24, 30);
			const [linea] = entorno.ambiente.db.select().from(lineaRecuento).all();
			const antes = avisos().length;

			await anularLineaRecuento(entorno.ambiente, admin, { id: linea.id, motivo: 'Error', contrasenaActual: undefined });

			const nuevos = avisos().filter((fila) => fila.datos.accion === 'anulado');
			expect(nuevos).toHaveLength(antes);
			expect(nuevos[0]?.datos).toMatchObject({ importe: 240, lineas: [{ diferencia: -6 }] });

			// La línea sin diferencia no avisó al registrarse y tampoco avisa al anularse.
			await recontar(admin, tipo, 30, 30);
			const avisosAntes = avisos().length;
			const [sinDiferencia] = entorno.ambiente.db
				.select()
				.from(lineaRecuento)
				.all()
				.filter((fila) => fila.diferencia === 0);
			await anularLineaRecuento(entorno.ambiente, admin, { id: sinDiferencia.id, motivo: 'Error', contrasenaActual: undefined });
			expect(sinDiferencia.diferencia).toBe(0);
			expect(avisos()).toHaveLength(avisosAntes);
		});
	});
});
