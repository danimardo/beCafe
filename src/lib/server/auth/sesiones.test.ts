import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
	crearSesion,
	cerrarSesionesDeUsuario,
	cerrarSesionesGlobal,
	cerrarSesionesPorBaja,
	hashToken,
	motivoSesionInvalida,
	opcionesCookie,
	resolverSesion,
	DURACION_SESION_MS,
} from './sesiones';
import { sesion } from './esquema';
import { crearPersona } from './pruebas/persona';
import { enTransaccion } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';
import { usuario } from '../usuarios';

const HORA = 60 * 60 * 1000;

describe('sesiones (RN-049, RN-051, RNF-005)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		usuarioId = crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es' }).id;
	});

	afterEach(() => entorno.cerrar());

	const abrir = () => enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: entorno.reloj.ahora() }));
	const resolver = (token: string) => resolverSesion(entorno.ambiente.db, token, entorno.reloj.ahora());

	it('RNF-005: guarda solo el SHA-256 del token, nunca el token', () => {
		const token = abrir();
		const filas = entorno.base.db.select().from(sesion).all();
		expect(filas).toHaveLength(1);
		expect(filas[0]?.idHash).toBe(hashToken(token));
		expect(JSON.stringify(filas)).not.toContain(token);
	});

	it('RN-049: sin uso, la sesión caduca a los 90 días desde su último uso', () => {
		const token = abrir();
		entorno.reloj.avanzar(DURACION_SESION_MS);
		expect(resolver(token)).toBeNull();
	});

	it('RN-049: un uso a los 89 días y 23 horas reinicia la ventana de 90 días', () => {
		const token = abrir();
		entorno.reloj.avanzar(DURACION_SESION_MS - HORA);
		expect(resolver(token)?.renovada).toBe(true);
		entorno.reloj.avanzar(DURACION_SESION_MS - HORA);
		expect(resolver(token)).not.toBeNull();
	});

	it('RN-049: renueva la caducidad como mucho una vez por hora', () => {
		const token = abrir();
		entorno.reloj.avanzar(30 * 60 * 1000);
		expect(resolver(token)?.renovada).toBe(false);
		entorno.reloj.avanzar(30 * 60 * 1000);
		expect(resolver(token)?.renovada).toBe(true);
		entorno.reloj.avanzar(10 * 60 * 1000);
		expect(resolver(token)?.renovada).toBe(false);
	});

	it('RN-051: cerrar sesiones de una persona invalida sus tokens en la siguiente petición', () => {
		const token = abrir();
		enTransaccion(entorno.ambiente.db, (tx) => cerrarSesionesDeUsuario(tx, usuarioId));
		expect(resolver(token)).toBeNull();
	});

	it('CA-137: cerrar sesión en todos los dispositivos invalida todas las sesiones y registra alcance todas', () => {
		const primera = abrir();
		const segunda = abrir();

		cerrarSesionesGlobal(entorno.ambiente.db, usuarioId);

		expect(resolver(primera)).toBeNull();
		expect(resolver(segunda)).toBeNull();
		expect(entorno.eventos()).toContainEqual(
			expect.objectContaining({ codigo: 'auth.sesion_cerrada', campos: { usuarioId, alcance: 'todas' } }),
		);
	});

	it('RN-051: una persona que no está activa no tiene sesión válida aunque el token exista', () => {
		const token = abrir();
		entorno.base.db.update(usuario).set({ estado: 'baja', bajaEn: entorno.reloj.ahora() }).where(eq(usuario.id, usuarioId)).run();
		expect(resolver(token)).toBeNull();
	});

	it('RNF-005: la cookie es HttpOnly y solo lleva Secure con ORIGIN https', () => {
		expect(opcionesCookie('https://becafe.example')).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true });
		expect(opcionesCookie('http://localhost:5173')).toMatchObject({ secure: false });
	});

	it('EV-041, D9: un token de una sesión cerrada por la baja se distingue de uno sin sesión', () => {
		const token = abrir();
		enTransaccion(entorno.ambiente.db, (tx) => cerrarSesionesPorBaja(tx, usuarioId, entorno.reloj.ahora()));

		expect(motivoSesionInvalida(entorno.ambiente.db, token)).toBe('baja');
		expect(motivoSesionInvalida(entorno.ambiente.db, 'token-inventado')).toBe('sin_sesion');
	});
});
