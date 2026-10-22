import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { definirContrasenaConEnlace, generarEnlace, validarEnlace, VIGENCIA_INVITACION_MS, VIGENCIA_RECUPERACION_MS } from './enlaces';
import { enlaceAcceso } from './esquema';
import { crearPersona, CONTRASENA_VALIDA } from './pruebas/persona';
import { enTransaccion } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';

const MINUTO = 60_000;

describe('enlaces de acceso (RN-052, RF-131, RF-132, CA-131, CA-132)', () => {
	let entorno: EntornoPrueba;
	let usuarioId: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		usuarioId = crearPersona(entorno.ambiente, { correo: 'pedro@ejemplo.es' }).id;
	});

	afterEach(() => entorno.cerrar());

	const emitir = (tipo: 'invitacion' | 'recuperacion') =>
		enTransaccion(entorno.ambiente.db, (tx) =>
			generarEnlace(tx, { usuarioId, tipo, origen: 'aplicacion', creadoPor: null, instante: entorno.reloj.ahora() }),
		);

	it('CA-131: la invitación caduca a las 24 horas: válida un segundo antes, caducada en el límite', () => {
		const { token } = emitir('invitacion');
		entorno.reloj.avanzar(VIGENCIA_INVITACION_MS - 1000);
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora())).toMatchObject({ valido: true, tipo: 'invitacion' });
		entorno.reloj.avanzar(1000);
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'caducado' });
	});

	it('CA-132: la recuperación caduca a la hora', () => {
		const { token } = emitir('recuperacion');
		entorno.reloj.avanzar(VIGENCIA_RECUPERACION_MS - MINUTO);
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora())).toMatchObject({ valido: true, tipo: 'recuperacion' });
		entorno.reloj.avanzar(MINUTO);
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'caducado' });
	});

	it('RN-052: un enlace nuevo anula los enlaces sin usar de la misma persona', () => {
		const primero = emitir('invitacion');
		emitir('invitacion');
		expect(validarEnlace(entorno.ambiente.db, primero.token, entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'anulado' });
	});

	it('RN-052: validar un enlace no lo consume', () => {
		const { token } = emitir('invitacion');
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora()).valido).toBe(true);
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora()).valido).toBe(true);
	});

	it('CA-132: un enlace usado no vuelve a ser válido', async () => {
		const { token } = emitir('invitacion');
		await definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: CONTRASENA_VALIDA, instante: entorno.reloj.ahora() });
		expect(validarEnlace(entorno.ambiente.db, token, entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'usado' });
		await expect(
			definirContrasenaConEnlace(entorno.ambiente.db, { token, contrasena: CONTRASENA_VALIDA, instante: entorno.reloj.ahora() }),
		).rejects.toMatchObject({ codigo: 'ENLACE_NO_VALIDO' });
	});

	it('CA-132: un token desconocido se rechaza como desconocido', () => {
		expect(validarEnlace(entorno.ambiente.db, 'x'.repeat(43), entorno.reloj.ahora())).toEqual({ valido: false, motivo: 'desconocido' });
	});

	it('guarda solo el hash del token', () => {
		const { token } = emitir('invitacion');
		const filas = entorno.base.db.select().from(enlaceAcceso).where(eq(enlaceAcceso.usuarioId, usuarioId)).all();
		expect(JSON.stringify(filas)).not.toContain(token);
	});
});
