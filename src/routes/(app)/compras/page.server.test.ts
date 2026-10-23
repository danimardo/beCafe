import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { darDeAltaCapsula, leerComprasRecientes, registrarAportacion } from '#lib/server/economia';

// Acciones de compras (CA-040, CA-043, RF-046) con evento falso. La hucha se dota antes con una aportación.
const INSTANTE = '2026-10-21T09:00:00.000Z';

describe('acciones de /compras', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function tipoActivo(admin: Actor): Promise<string> {
		const { id } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: `Tipo ${nuevoId()}`,
			marca: 'Marca de prueba',
			intensidad: 5,
			color: 'cap-ristretto',
			umbralMinimo: 0,
		});
		return id;
	}

	function enviar(accion: 'registrar' | 'anadirLinea' | 'quitarLinea', actor: Actor | undefined, cuerpo: URLSearchParams) {
		return actions[accion](
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/compras',
				params: {},
				cuerpo,
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('CA-040: una compra de dos cápsulas se registra y redirige a su detalle', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		registrarAportacion(entorno.ambiente, marta, { clienteId: nuevoId(), importe: 5000 });
		const tipo = await tipoActivo(admin);

		const cuerpo = new URLSearchParams([
			['clienteId', nuevoId()],
			['tipo', tipo],
			['cantidad', '2'],
			['importe', '24,00'],
		]);

		let redireccion: unknown;
		try {
			await enviar('registrar', marta, cuerpo);
		} catch (causa) {
			redireccion = causa;
		}
		expect(redireccion).toMatchObject({ status: 303 });
		const [compra] = leerComprasRecientes(entorno.ambiente.db, marta, 10);
		expect(compra).toMatchObject({ importeTotal: 2400, usuarioId: marta.usuarioId });
	});

	it('CA-043: una cantidad no válida se rechaza con error y no se escribe ninguna compra', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		const tipo = await tipoActivo(admin);

		const { estado, datos } = desenvolverFallo(
			await enviar(
				'registrar',
				marta,
				new URLSearchParams([
					['clienteId', nuevoId()],
					['tipo', tipo],
					['cantidad', '0'],
					['importe', '24,00'],
				]),
			),
		);

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores');
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});

	it('anadirLinea devuelve la línea escrita y una línea más, sin registrar nada', async () => {
		const marta = sesionDe('miembro', 'Marta');

		const resultado = await enviar(
			'anadirLinea',
			marta,
			new URLSearchParams([
				['tipo', 'T1'],
				['cantidad', '1'],
				['importe', '3,00'],
			]),
		);

		expect(resultado).toMatchObject({ numeroLineas: 2, lineas: [{ tipoCapsulaId: 'T1', cantidad: '1', importe: '3,00' }] });
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});

	it('quitarLinea devuelve una línea menos sin dejar de tener una, y no registra nada', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const cuerpo = new URLSearchParams([
			['tipo', 'T1'],
			['cantidad', '1'],
			['importe', '3,00'],
			['tipo', 'T2'],
			['cantidad', '2'],
			['importe', '6,00'],
		]);

		await expect(enviar('quitarLinea', marta, cuerpo)).resolves.toMatchObject({ numeroLineas: 1, lineas: [{ tipoCapsulaId: 'T1' }] });
		await expect(
			enviar(
				'quitarLinea',
				marta,
				new URLSearchParams([
					['tipo', 'T1'],
					['cantidad', '1'],
					['importe', '3,00'],
				]),
			),
		).resolves.toMatchObject({
			numeroLineas: 1,
			lineas: [],
		});
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});

	it('T031: sin hucha para la compra, la confirmación devuelve 409 con el saldo teórico y no escribe', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		const tipo = await tipoActivo(admin);

		const resultado = await enviar(
			'registrar',
			marta,
			new URLSearchParams([
				['clienteId', nuevoId()],
				['tipo', tipo],
				['cantidad', '2'],
				['importe', '24,00'],
			]),
		);

		expect(resultado).toMatchObject({
			status: 409,
			data: { saldoTeorico: 0, errores: { general: { codigo: 'CONFIRMACION_REQUERIDA' } } },
		});
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});
});
