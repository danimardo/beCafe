import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '#lib/server/auth';
import { crearAzarFijo, crearEntornoPrueba, enTransaccion, nuevoId, RecursoNoEncontrado, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { registrarAportacion } from './aportaciones';
import { anularCompra, leerCompra, leerComprasRecientes, leerFotoTicket, registrarCompra } from './compras';
import { darDeAltaCapsula } from './capsulas';
import {
	anularArqueo,
	anularLineaRecuento,
	confirmarArqueo,
	confirmarRecuento,
	leerControl,
	previsualizarArqueo,
	previsualizarRecuento,
} from './control';
import { darDeBaja, leerLiquidacion, previsualizarBaja } from './baja';
import { anularAportacion } from './anulaciones';
import { anotarMovimientos } from './libro';
import { marcarBaja } from '#lib/server/usuarios';
import sharp from 'sharp';
import { leerAportacion } from './saldos';
import { existencia } from './esquema';
import { prepararMiembros, prepararTipo } from './pruebas/constructores';

// Ramas de error y de caso límite de los casos de uso de `economia` (constitución VIII, umbral del 90 % de ramas).
// Cada prueba fija un resultado observable: un rechazo con su código, un recurso ausente o un valor calculado.
const INSTANTE = '2026-10-21T09:00:00.000Z';

function actorDe(usuarioId: string, rol: Actor['rol'] = 'miembro'): Actor {
	return { usuarioId, rol, autenticadoEn: INSTANTE, sesionIdHash: `hash-${usuarioId}` };
}

function crearAdmin(entorno: EntornoPrueba): Actor {
	const id = nuevoId();
	enTransaccion(entorno.ambiente.db, (tx) =>
		crearUsuario(tx, { id, nombre: 'Admin', correo: `admin-${id}@ejemplo.test`, rol: 'administrador', instante: INSTANTE }),
	);
	return actorDe(id, 'administrador');
}

describe('casos límite y errores de economía (CA-040, CA-064, CA-080, CA-090, CA-135, RF-046)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE, crearAzarFijo(Array.from({ length: 50 }, () => 0)));
	});

	afterEach(() => {
		entorno.cerrar();
	});

	it('RN-037: una compra con el mismo tipo en dos líneas se guarda con ambas líneas y su total', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });

		const { id } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [
				{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 },
				{ tipoCapsulaId: tipo, cantidad: 2, importe: 200 },
			],
			confirmoHuchaNegativa: false,
		});

		const compraGuardada = leerCompra(entorno.ambiente.db, admin, id);
		expect(compraGuardada.lineas).toHaveLength(2);
		expect(compraGuardada.importeTotal).toBe(300);
	});

	it('CA-040: una compra sin foto no tiene ruta de foto y una compra inexistente no se encuentra', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		const { id } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 }],
			confirmoHuchaNegativa: false,
		});

		expect(leerFotoTicket(entorno.ambiente, admin, id)).toBeNull();
		expect(() => leerFotoTicket(entorno.ambiente, admin, nuevoId())).toThrow(RecursoNoEncontrado);
	});

	it('CA-043: anular una compra vigente la deja anulada y sin regularizaciones si no hay consumos que regularizar', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		const { id } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 1, importe: 100 }],
			confirmoHuchaNegativa: false,
		});

		const resumen = anularCompra(entorno.ambiente, admin, id, 'Ticket duplicado');

		expect(resumen).toEqual([]);
		expect(leerCompra(entorno.ambiente.db, admin, id)).toMatchObject({ estado: 'anulado', regularizaciones: [] });
	});

	it('CA-043: si el stock guardado no coincide con la historia, la anulación se rechaza y se registra como invariante', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		const { id } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo, cantidad: 2, importe: 200 }],
			confirmoHuchaNegativa: false,
		});
		entorno.ambiente.db.update(existencia).set({ stock: 99 }).run();

		expect(() => anularCompra(entorno.ambiente, admin, id, 'Prueba de invariante')).toThrow(
			'La reconstrucción del stock no coincide con el guardado',
		);
	});

	it('anular una compra que no existe responde RecursoNoEncontrado', () => {
		const admin = crearAdmin(entorno);

		expect(() => anularCompra(entorno.ambiente, admin, nuevoId(), 'Motivo')).toThrow(RecursoNoEncontrado);
	});

	it('CA-090: un recuento con más cápsulas de las registradas no tiene valor de faltante', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);

		const [linea] = previsualizarRecuento(entorno.ambiente.db, admin, [{ tipoCapsulaId: tipo, contado: 3, registradoPrevisto: 0 }]);

		expect(linea).toMatchObject({ registrado: 0, contado: 3, diferencia: 3, valorFaltante: 0 });
	});

	it('CA-080: un arqueo sin diferencia no reparte partes', () => {
		const admin = crearAdmin(entorno);
		prepararMiembros(entorno.ambiente.db, 2);

		expect(previsualizarArqueo(entorno.ambiente.db, admin, 0)).toMatchObject({
			saldoTeorico: 0,
			diferencia: 0,
			parteMinima: 0,
			parteMaxima: 0,
		});
	});

	it('CAMBIO_CONCURRENTE: un recuento con un registrado distinto del que vio la administración no se guarda', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await prepararTipo(entorno.ambiente);

		await expect(
			confirmarRecuento(entorno.ambiente, admin, {
				lineas: [{ tipoCapsulaId: tipo, contado: 2, registradoPrevisto: 7 }],
				contrasenaActual: undefined,
			}),
		).rejects.toThrow('CAMBIO_CONCURRENTE');
	});

	it('anular un arqueo o una línea de recuento inexistente responde RecursoNoEncontrado', async () => {
		const admin = crearAdmin(entorno);

		await expect(
			anularArqueo(entorno.ambiente, admin, { id: nuevoId(), motivo: 'Motivo', contrasenaActual: undefined }),
		).rejects.toBeInstanceOf(RecursoNoEncontrado);
		await expect(
			anularLineaRecuento(entorno.ambiente, admin, { id: nuevoId(), motivo: 'Motivo', contrasenaActual: undefined }),
		).rejects.toBeInstanceOf(RecursoNoEncontrado);
	});

	it('CA-135: la liquidación de una persona inexistente responde RecursoNoEncontrado', async () => {
		const admin = crearAdmin(entorno);

		expect(() => leerLiquidacion(entorno.ambiente.db, admin, nuevoId())).toThrow(RecursoNoEncontrado);
		await expect(
			darDeBaja(entorno.ambiente, admin, {
				usuarioId: nuevoId(),
				modo: 'ninguna',
				saldoPrevisto: 0,
				confirmoHuchaNegativa: false,
				contrasenaActual: undefined,
			}),
		).rejects.toBeInstanceOf(RecursoNoEncontrado);
	});

	it('RF-046: leer una aportación que no existe responde RecursoNoEncontrado', () => {
		const admin = crearAdmin(entorno);

		expect(() => leerAportacion(entorno.ambiente.db, admin, nuevoId())).toThrow(RecursoNoEncontrado);
	});

	it('RF-081: si el contado cambia entre la vista previa y la confirmación, el arqueo no se guarda', async () => {
		const admin = crearAdmin(entorno);
		prepararMiembros(entorno.ambiente.db, 2);

		await expect(
			confirmarArqueo(entorno.ambiente, admin, { contado: 500, contadoPrevisto: 0, saldoTeoricoPrevisto: 0, contrasenaActual: undefined }),
		).rejects.toThrow('CAMBIO_CONCURRENTE');
		expect(leerControl(entorno.ambiente.db, admin).arqueos).toHaveLength(0);
	});

	it('T030: las lecturas de compras sin sesión se rechazan con SIN_SESION', () => {
		expect(() => leerCompra(entorno.ambiente.db, undefined, nuevoId())).toThrow('SIN_SESION');
		expect(() => leerComprasRecientes(entorno.ambiente.db, undefined, 5)).toThrow('SIN_SESION');
	});

	it('CA-135: la vista previa de una devolución calcula la hucha tras la baja y no escribe nada', () => {
		const admin = crearAdmin(entorno);
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE }),
		);
		registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 1000 });

		expect(previsualizarBaja(entorno.ambiente.db, admin, ana, 'devolucion')).toMatchObject({
			modo: 'devolucion',
			saldo: 1000,
			huchaActual: 1000,
			huchaDespues: 0,
			huchaNegativa: false,
		});
		expect(leerLiquidacion(entorno.ambiente.db, admin, ana).saldo).toBe(1000);
	});

	it('CA-135: la vista previa rechaza un modo que no corresponde al saldo con VALIDACION', () => {
		const admin = crearAdmin(entorno);
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE }),
		);

		expect(() => previsualizarBaja(entorno.ambiente.db, admin, ana, 'pago')).toThrow('VALIDACION');
	});

	it('CA-135: la vista previa de un pago y de un incobrable calcula la hucha y el reparto entre los demás', () => {
		const admin = crearAdmin(entorno);
		const [ana, bruno] = prepararMiembros(entorno.ambiente.db, 2);
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: ana,
					tipo: 'cargo_consumo',
					importe: -600,
					origenTipo: 'consumo',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]),
		);

		expect(previsualizarBaja(entorno.ambiente.db, admin, ana, 'pago')).toMatchObject({
			saldo: -600,
			huchaDespues: 600,
			huchaNegativa: false,
			importeReparto: 0,
		});
		// Reparten el administrador y Bruno; Ana no cuenta porque es la persona que se da de baja.
		expect(previsualizarBaja(entorno.ambiente.db, admin, ana, 'incobrable')).toMatchObject({ importeReparto: 600, personasReparto: 2 });
		expect(bruno).toBeDefined();
	});

	it('CA-135: devolver un saldo mayor que la hucha deja la hucha en negativo y se marca', () => {
		const admin = crearAdmin(entorno);
		const [ana] = prepararMiembros(entorno.ambiente.db, 1);
		enTransaccion(entorno.ambiente.db, (tx) =>
			anotarMovimientos(tx, [
				{
					cuenta: 'persona',
					usuarioId: ana,
					tipo: 'abono_aportacion',
					importe: 1000,
					origenTipo: 'aportacion',
					origenId: nuevoId(),
					creadoEn: INSTANTE,
				},
			]),
		);

		expect(previsualizarBaja(entorno.ambiente.db, admin, ana, 'devolucion')).toMatchObject({
			huchaActual: 0,
			huchaDespues: -1000,
			huchaNegativa: true,
		});
	});

	it('leer una compra inexistente responde RecursoNoEncontrado', () => {
		const admin = crearAdmin(entorno);

		expect(() => leerCompra(entorno.ambiente.db, admin, nuevoId())).toThrow(RecursoNoEncontrado);
	});

	it('CA-040: una compra con foto devuelve la ruta de su foto', async () => {
		const admin = crearAdmin(entorno);
		const tipo = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Con foto',
			marca: 'Marca',
			intensidad: 5,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		registrarAportacion(entorno.ambiente, admin, { clienteId: nuevoId(), importe: 5000 });
		const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 90, g: 50, b: 30 } } })
			.jpeg()
			.toBuffer();
		const { id } = await registrarCompra(entorno.ambiente, admin, {
			clienteId: nuevoId(),
			lineas: [{ tipoCapsulaId: tipo.id, cantidad: 1, importe: 100 }],
			foto: new Uint8Array(buffer),
			confirmoHuchaNegativa: false,
		});

		expect(leerFotoTicket(entorno.ambiente, admin, id)).toMatch(/fotos/);
	});

	it('anular una aportación inexistente responde RecursoNoEncontrado', () => {
		const admin = crearAdmin(entorno);

		expect(() => anularAportacion(entorno.ambiente, admin, nuevoId(), 'Motivo')).toThrow(RecursoNoEncontrado);
	});

	it('Clarifications 10: la aportación de una persona dada de baja no se puede anular (ESTADO_INCORRECTO)', () => {
		const admin = crearAdmin(entorno);
		const ana = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INSTANTE }),
		);
		const { id } = registrarAportacion(entorno.ambiente, actorDe(ana), { clienteId: nuevoId(), importe: 500 });
		enTransaccion(entorno.ambiente.db, (tx) => marcarBaja(tx, { usuarioId: ana, instante: INSTANTE }));

		expect(() => anularAportacion(entorno.ambiente, admin, id, 'Motivo')).toThrow('ESTADO_INCORRECTO');
	});
});
