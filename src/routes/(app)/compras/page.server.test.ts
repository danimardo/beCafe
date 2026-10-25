import { isRedirect } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { darDeAltaCapsula, leerComprasRecientes, registrarAportacion } from '#lib/server/economia';

// Acciones de compras (CA-040, CA-043, RF-046) con evento falso. La hucha se dota antes con una aportación.
const INSTANTE = '2026-10-21T09:00:00.000Z';

async function capturar(operacion: () => unknown): Promise<unknown> {
	try {
		return await operacion();
	} catch (causa) {
		return causa;
	}
}

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

	function enviar(accion: 'registrar', actor: Actor | undefined, cuerpo: URLSearchParams) {
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
					['cantidad', '-1'],
					['importe', '24,00'],
				]),
			),
		);

		expect(estado).toBe(400);
		expect(datos).toHaveProperty('errores');
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});

	it('CA-197: la cuadrícula envía todos los tipos; los de cantidad 0 se descartan y queda una compra de una línea', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		registrarAportacion(entorno.ambiente, marta, { clienteId: nuevoId(), importe: 5000 });
		const [uno, dos] = [await tipoActivo(admin), await tipoActivo(admin)];

		const lanzado = await capturar(() =>
			enviar(
				'registrar',
				marta,
				new URLSearchParams([
					['clienteId', nuevoId()],
					['tipo', uno],
					['cantidad', '0'],
					['importe', ''],
					['tipo', dos],
					['cantidad', '3'],
					['importe', '12,00'],
				]),
			),
		);

		expect(isRedirect(lanzado)).toBe(true);
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10).map((c) => c.importeTotal)).toEqual([1200]);
	});

	it('CA-198: sin hucha, la acción devuelve la confirmación con saldo, importe y resultado, sin escribir', async () => {
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

		expect(resultado).toMatchObject({ status: 409, data: { confirmacion: { saldo: 0, importe: 2400, resultado: -2400 } } });
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(0);
	});

	it('EV-106, CA-198: «Registrar igualmente» con el saldo vigente registra; con un saldo desfasado vuelve a pedir confirmación', async () => {
		const marta = sesionDe('miembro', 'Marta');
		const admin = sesionDe('administrador', 'Admin');
		const tipo = await tipoActivo(admin);
		const cuerpo = (saldoConfirmado: string) =>
			new URLSearchParams([
				['clienteId', nuevoId()],
				['tipo', tipo],
				['cantidad', '2'],
				['importe', '24,00'],
				['confirmarHuchaNegativa', 'si'],
				['saldoConfirmado', saldoConfirmado],
			]);

		await expect(enviar('registrar', marta, cuerpo('500'))).resolves.toMatchObject({ status: 409, data: { confirmacion: { saldo: 0 } } });
		expect(isRedirect(await capturar(() => enviar('registrar', marta, cuerpo('0'))))).toBe(true);
		expect(leerComprasRecientes(entorno.ambiente.db, marta, 10)).toHaveLength(1);
	});
});
