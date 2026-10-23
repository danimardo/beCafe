import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { registrarAviso } from './registrar';
import { cambiarPreferencia, leerPreferencias } from './preferencias';
import { notificacion, entregaPush, suscripcionPush } from './esquema';

// CA-102 (RF-102, Clarifications 5 y 6): preferencias por tipo, `deuda` siempre activa y avisos de administración solo para administradores.
const INICIO = '2026-10-23T09:00:00.000Z';

describe('preferencias de avisos (CA-102)', () => {
	let entorno: EntornoPrueba;
	let ana: string;
	let admin: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INICIO);
		ana = nuevoId();
		admin = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => {
			crearUsuario(tx, { id: ana, nombre: 'Ana', correo: `ana-${ana}@ejemplo.test`, rol: 'miembro', instante: INICIO });
			crearUsuario(tx, { id: admin, nombre: 'Admin', correo: `admin-${admin}@ejemplo.test`, rol: 'administrador', instante: INICIO });
		});
	});

	afterEach(() => {
		entorno.cerrar();
	});

	const persona = { usuarioId: '', rol: 'miembro' as const };
	const miembro = () => ({ ...persona, usuarioId: ana });
	const administrador = () => ({ usuarioId: admin, rol: 'administrador' as const });

	it('CA-102: desactivar stock bajo impide la entrega push de ese tipo', () => {
		const suscripcion = nuevoId();
		entorno.ambiente.db
			.insert(suscripcionPush)
			.values({
				id: suscripcion,
				usuarioId: ana,
				endpoint: 'https://push.ejemplo.test/a',
				clavePdh: 'p',
				claveAuth: 'a',
				creadaEn: INICIO,
				actualizadaEn: INICIO,
			})
			.run();
		cambiarPreferencia(entorno.ambiente, miembro(), { tipo: 'stock_bajo', activada: false });

		enTransaccion(entorno.ambiente.db, (tx) =>
			registrarAviso(tx, {
				tipo: 'stock_bajo',
				datos: { tipoCapsulaId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', nombreTipo: 'Lungo', stock: 1 },
				instante: entorno.reloj.ahora(),
			}),
		);

		expect(entorno.ambiente.db.select().from(notificacion).all()).toHaveLength(2);
		expect(entorno.ambiente.db.select().from(entregaPush).all()).toHaveLength(0);
	});

	it('CA-102: deuda no se puede desactivar', () => {
		expect(() => cambiarPreferencia(entorno.ambiente, miembro(), { tipo: 'deuda', activada: false })).toThrow(ErrorDeNegocio);
	});

	it('un miembro no cambia los avisos de administración', () => {
		expect(() => cambiarPreferencia(entorno.ambiente, miembro(), { tipo: 'stock_negativo', activada: false })).toThrow(ErrorDeNegocio);
	});

	it('un miembro no ve los avisos de administración; un administrador sí; deuda siempre activada', () => {
		const vistosPorMiembro = leerPreferencias(entorno.ambiente.db, miembro()).map((item) => item.tipo);
		const vistosPorAdmin = leerPreferencias(entorno.ambiente.db, administrador()).map((item) => item.tipo);

		expect(vistosPorMiembro).not.toContain('stock_negativo');
		expect(vistosPorAdmin).toContain('stock_negativo');
		const deuda = leerPreferencias(entorno.ambiente.db, miembro()).find((item) => item.tipo === 'deuda');
		expect(deuda).toMatchObject({ activada: true, editable: false });
	});

	it('sin fila, cada tipo aparece activado; tras cambiarlo, refleja el valor guardado', () => {
		cambiarPreferencia(entorno.ambiente, miembro(), { tipo: 'resumen_mensual', activada: false });
		cambiarPreferencia(entorno.ambiente, miembro(), { tipo: 'resumen_mensual', activada: true });
		const resumen = leerPreferencias(entorno.ambiente.db, miembro()).find((item) => item.tipo === 'resumen_mensual');
		const stock = leerPreferencias(entorno.ambiente.db, miembro()).find((item) => item.tipo === 'stock_bajo');
		expect(resumen?.activada).toBe(true);
		expect(stock?.activada).toBe(true);
	});
});
