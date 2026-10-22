import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { iniciarSesion } from './iniciar-sesion';
import { credencial } from './esquema';
import { CONTRASENA_VALIDA, crearPersona, definirContrasena } from './pruebas/persona';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';

const MINUTO = 60_000;
const ERROR_ESPERADO = { codigo: 'CREDENCIALES_INCORRECTAS' };

describe('inicio de sesión con bloqueo (RN-048, CA-133, RN-055)', () => {
	let entorno: EntornoPrueba;
	let personaId: string;

	beforeEach(async () => {
		entorno = crearEntornoPrueba();
		const persona = crearPersona(entorno.ambiente, { correo: 'ana@ejemplo.es' });
		personaId = persona.id;
		await definirContrasena(entorno.ambiente, persona);
	});

	afterEach(() => entorno.cerrar());

	const intentar = (correo: string, contrasena: string) =>
		iniciarSesion(entorno.ambiente.db, { correo, contrasena, instante: entorno.reloj.ahora() });
	const fallar = async (veces: number) => {
		for (let intento = 0; intento < veces; intento++) await intentar('ana@ejemplo.es', 'mal').catch(() => undefined);
	};
	const cuenta = () => entorno.base.db.select().from(credencial).where(eq(credencial.usuarioId, personaId)).get();

	it('CA-133: cuatro fallos no bloquean; con la contraseña correcta se entra y el contador vuelve a cero', async () => {
		await fallar(4);
		expect(cuenta()?.bloqueadoHasta).toBeNull();
		await expect(intentar('ana@ejemplo.es', CONTRASENA_VALIDA)).resolves.toMatchObject({ usuarioId: personaId });
		expect(cuenta()?.intentosFallidos).toBe(0);
	});

	it('CA-133: el quinto fallo bloquea y el sexto intento, aunque sea correcto, se rechaza', async () => {
		await fallar(5);
		expect(cuenta()?.bloqueadoHasta).not.toBeNull();
		await expect(intentar('ana@ejemplo.es', CONTRASENA_VALIDA)).rejects.toMatchObject(ERROR_ESPERADO);
	});

	it('CA-133: el bloqueo dura 15 minutos; antes del límite sigue, y en el límite se evalúa', async () => {
		await fallar(5);
		entorno.reloj.avanzar(15 * MINUTO - 1000);
		await expect(intentar('ana@ejemplo.es', CONTRASENA_VALIDA)).rejects.toMatchObject(ERROR_ESPERADO);
		entorno.reloj.avanzar(1000);
		await expect(intentar('ana@ejemplo.es', CONTRASENA_VALIDA)).resolves.toMatchObject({ usuarioId: personaId });
	});

	it('CA-133: un intento durante el bloqueo no alarga el bloqueo', async () => {
		await fallar(5);
		const antes = cuenta()?.bloqueadoHasta;
		entorno.reloj.avanzar(5 * MINUTO);
		await fallar(1);
		expect(cuenta()?.bloqueadoHasta).toBe(antes);
	});

	it('CA-133: un correo inexistente recibe el mismo error y no cuenta como fallo de ninguna cuenta', async () => {
		for (let intento = 0; intento < 8; intento++) {
			await expect(intentar('nadie@ejemplo.es', 'mal')).rejects.toMatchObject(ERROR_ESPERADO);
		}
		expect(cuenta()?.intentosFallidos).toBe(0);
	});

	it('RN-055: una persona de baja recibe el mismo error aunque la contraseña sea correcta', async () => {
		const baja = crearPersona(entorno.ambiente, { correo: 'luis@ejemplo.es', estado: 'baja' });
		await definirContrasena(entorno.ambiente, baja);
		await expect(intentar('luis@ejemplo.es', CONTRASENA_VALIDA)).rejects.toMatchObject(ERROR_ESPERADO);
	});

	it('registra el rechazo con su motivo y sin el correo', async () => {
		await fallar(1);
		const eventos = entorno.eventos().filter((evento) => evento.codigo === 'auth.acceso_fallido');
		expect(eventos).toHaveLength(1);
		expect(JSON.stringify(eventos)).not.toContain('ana@ejemplo.es');
	});
});
