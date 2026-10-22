import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { exigirReautenticacion, reautenticar } from './reautenticacion';
import { credencial, sesion } from './esquema';
import { crearSesion, hashToken } from './sesiones';
import { CONTRASENA_VALIDA, crearPersona, definirContrasena } from './pruebas/persona';
import { enTransaccion } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';
import type { Actor } from './actor';

const MINUTO = 60_000;

describe('reautenticación de administrador (RN-050, RF-138, CA-138)', () => {
	let entorno: EntornoPrueba;
	let actor: Actor;

	beforeEach(async () => {
		entorno = crearEntornoPrueba();
		const persona = crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es', rol: 'administrador' });
		await definirContrasena(entorno.ambiente, persona);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId: persona.id, instante: entorno.reloj.ahora() }));
		actor = { usuarioId: persona.id, rol: 'administrador', autenticadoEn: entorno.reloj.ahora(), sesionIdHash: hashToken(token) };
	});

	afterEach(() => entorno.cerrar());

	const exigir = (contrasenaActual?: string) =>
		exigirReautenticacion(entorno.ambiente.db, { actor, contrasenaActual, instante: entorno.reloj.ahora() });

	it('CA-138: con 15 minutos exactos se permite la acción sin contraseña', async () => {
		entorno.reloj.avanzar(15 * MINUTO);
		await expect(exigir()).resolves.toBeUndefined();
	});

	it('CA-138: con 16 minutos se exige la contraseña', async () => {
		entorno.reloj.avanzar(16 * MINUTO);
		await expect(exigir()).rejects.toMatchObject({ codigo: 'REAUTENTICACION_REQUERIDA' });
	});

	it('CA-138: con la contraseña correcta se ejecuta y se renueva la última autenticación', async () => {
		entorno.reloj.avanzar(16 * MINUTO);
		await exigir(CONTRASENA_VALIDA);
		const fila = entorno.base.db.select().from(sesion).where(eq(sesion.idHash, actor.sesionIdHash)).get();
		expect(fila?.ultimaAutenticacionEn).toBe(entorno.reloj.ahora());
	});

	it('CA-138: una contraseña incorrecta devuelve error de campo y no cuenta para el bloqueo', async () => {
		entorno.reloj.avanzar(16 * MINUTO);
		await expect(exigir('equivocada')).rejects.toMatchObject({ codigo: 'CREDENCIALES_INCORRECTAS' });
		const cuenta = entorno.base.db.select().from(credencial).where(eq(credencial.usuarioId, actor.usuarioId)).get();
		expect(cuenta?.intentosFallidos).toBe(0);
		expect(cuenta?.bloqueadoHasta).toBeNull();
	});

	it('registra el resultado de la reautenticación', async () => {
		entorno.reloj.avanzar(16 * MINUTO);
		await reautenticar(entorno.ambiente.db, { actor, contrasena: 'equivocada', instante: entorno.reloj.ahora() }).catch(() => undefined);
		expect(entorno.eventos().some((evento) => evento.codigo === 'auth.reautenticacion' && evento.campos.resultado === 'fallida')).toBe(
			true,
		);
	});
});
