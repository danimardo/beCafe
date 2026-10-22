import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { generarEnlaceParaPersona, reactivarPersona } from './invitar';
import { VIGENCIA_INVITACION_MS } from './enlaces';
import { credencial, sesion } from './esquema';
import { crearSesion, hashToken } from './sesiones';
import { crearPersona, definirContrasena } from './pruebas/persona';
import { usuario } from '../usuarios';
import { enTransaccion, type Ambiente } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';
import type { Actor } from './actor';

const ahoraDe = (entorno: EntornoPrueba) => entorno.reloj.ahora();

describe('reactivación y enlaces de personas de baja (RF-136, CA-136)', () => {
	let entorno: EntornoPrueba;
	let ambiente: Ambiente;
	let admin: Actor;

	beforeEach(async () => {
		entorno = crearEntornoPrueba();
		ambiente = entorno.ambiente;
		const persona = crearPersona(ambiente, { correo: 'ana@ejemplo.es', rol: 'administrador' });
		await definirContrasena(ambiente, persona);
		const token = enTransaccion(ambiente.db, (tx) => crearSesion(tx, { usuarioId: persona.id, instante: ahoraDe(entorno) }));
		const fila = ambiente.db
			.select()
			.from(sesion)
			.where(eq(sesion.idHash, hashToken(token)))
			.get();
		if (!fila) throw new Error('sesión de prueba ausente');
		admin = { usuarioId: persona.id, rol: 'administrador', autenticadoEn: fila.ultimaAutenticacionEn, sesionIdHash: fila.idHash };
	});

	afterEach(() => entorno.cerrar());

	const CUANDO = (): string => ahoraDe(entorno);

	it('CA-136: reactivar deja a la persona sin contraseña, sin enlaces válidos y sin sesiones; la siguiente invitación dura 24 horas', async () => {
		const baja = crearPersona(ambiente, { correo: 'marta@ejemplo.es', estado: 'baja' });
		await definirContrasena(ambiente, baja);
		await reactivarPersona(ambiente.db, { actor: admin, usuarioId: baja.id, contrasenaActual: undefined, instante: CUANDO() });
		const fila = ambiente.db.select().from(usuario).where(eq(usuario.id, baja.id)).get();
		expect(fila).toMatchObject({ estado: 'activo', bajaEn: null });
		expect(ambiente.db.select().from(credencial).where(eq(credencial.usuarioId, baja.id)).get()).toBeUndefined();
		const siguiente = await generarEnlaceParaPersona(ambiente.db, {
			actor: admin,
			usuarioId: baja.id,
			contrasenaActual: undefined,
			instante: CUANDO(),
		});
		expect(siguiente.tipo).toBe('invitacion');
		expect(Date.parse(siguiente.expiraEn) - Date.parse(CUANDO())).toBe(VIGENCIA_INVITACION_MS);
	});

	it('CA-136: reactivar a una persona que ya está activa devuelve 409 (ESTADO_INCORRECTO)', async () => {
		const activa = crearPersona(ambiente, { correo: 'raul@ejemplo.es' });
		await expect(
			reactivarPersona(ambiente.db, { actor: admin, usuarioId: activa.id, contrasenaActual: undefined, instante: CUANDO() }),
		).rejects.toMatchObject({ codigo: 'ESTADO_INCORRECTO' });
	});

	it('generar un enlace para una persona de baja devuelve 409', async () => {
		const baja = crearPersona(ambiente, { correo: 'nora@ejemplo.es', estado: 'baja' });
		await expect(
			generarEnlaceParaPersona(ambiente.db, { actor: admin, usuarioId: baja.id, contrasenaActual: undefined, instante: CUANDO() }),
		).rejects.toMatchObject({ codigo: 'ESTADO_INCORRECTO' });
	});
});
