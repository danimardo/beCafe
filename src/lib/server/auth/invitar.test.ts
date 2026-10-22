import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { darDeAltaConInvitacion } from './invitar';
import { validarEnlace, VIGENCIA_INVITACION_MS } from './enlaces';
import { credencial, sesion } from './esquema';
import { crearSesion, hashToken } from './sesiones';
import { crearPersona, definirContrasena } from './pruebas/persona';
import { registroAuditoria, usuario } from '../usuarios';
import { enTransaccion, type Ambiente } from '../plataforma';
import { crearEntornoPrueba, type EntornoPrueba } from '../plataforma/pruebas/entorno-prueba';
import type { Actor } from './actor';

const ahoraDe = (entorno: EntornoPrueba) => entorno.reloj.ahora();

describe('invitación y alta de personas (RF-130, RF-131, CA-130, CA-131, CA-139c)', () => {
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

	it('CA-130: el alta deja a Pedro activo y sin contraseña', async () => {
		const { usuarioId } = await darDeAltaConInvitacion(ambiente.db, {
			actor: admin,
			nombre: 'Pedro',
			correo: 'Pedro@Ejemplo.es',
			rol: 'miembro',
			contrasenaActual: undefined,
			instante: CUANDO(),
		});
		const fila = ambiente.db.select().from(usuario).where(eq(usuario.id, usuarioId)).get();
		expect(fila).toMatchObject({ estado: 'activo', email: 'pedro@ejemplo.es' });
		expect(ambiente.db.select().from(credencial).where(eq(credencial.usuarioId, usuarioId)).get()).toBeUndefined();
	});

	it('CA-131: la invitación vale 24 horas desde la creación', async () => {
		const { token, expiraEn, usuarioId } = await darDeAltaConInvitacion(ambiente.db, {
			actor: admin,
			nombre: 'Pedro',
			correo: 'pedro@ejemplo.es',
			rol: 'miembro',
			contrasenaActual: undefined,
			instante: CUANDO(),
		});
		expect(Date.parse(expiraEn) - Date.parse(CUANDO())).toBe(VIGENCIA_INVITACION_MS);
		expect(validarEnlace(ambiente.db, token, CUANDO())).toMatchObject({ valido: true, tipo: 'invitacion', usuarioId });
	});

	it('CORREO_DUPLICADO: el mismo correo en otra capitalización se rechaza', async () => {
		await expect(
			darDeAltaConInvitacion(ambiente.db, {
				actor: admin,
				nombre: 'Otra',
				correo: 'ANA@ejemplo.es',
				rol: 'miembro',
				contrasenaActual: undefined,
				instante: CUANDO(),
			}),
		).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
	});

	it('CA-139c: la auditoría anota autor y fecha, sin correos ni nombres en el detalle', async () => {
		const { usuarioId } = await darDeAltaConInvitacion(ambiente.db, {
			actor: admin,
			nombre: 'Pedro Pérez',
			correo: 'pedro@ejemplo.es',
			rol: 'miembro',
			contrasenaActual: undefined,
			instante: CUANDO(),
		});
		const filas = ambiente.db.select().from(registroAuditoria).where(eq(registroAuditoria.objetoId, usuarioId)).all();
		expect(filas.map((fila) => fila.accion).sort()).toEqual(['enlace.generado', 'usuario.alta']);
		for (const fila of filas) {
			expect(fila.actorId).toBe(admin.usuarioId);
			expect(fila.creadoEn).toBe(CUANDO());
			expect(fila.detalle).not.toMatch(/@|Pedro/);
		}
	});

	it('un miembro no puede dar de alta a nadie y el intento queda registrado', async () => {
		const miembro = crearPersona(ambiente, { correo: 'luis@ejemplo.es' });
		const actorMiembro: Actor = { ...admin, usuarioId: miembro.id, rol: 'miembro' };
		await expect(
			darDeAltaConInvitacion(ambiente.db, {
				actor: actorMiembro,
				nombre: 'Pedro',
				correo: 'pedro@ejemplo.es',
				rol: 'miembro',
				contrasenaActual: undefined,
				instante: CUANDO(),
			}),
		).rejects.toMatchObject({ codigo: 'SIN_PERMISO' });
		expect(entorno.eventos().some((evento) => evento.codigo === 'auth.permiso_denegado')).toBe(true);
	});

	it('con la ventana vencida, una acción de administración exige la contraseña actual', async () => {
		entorno.reloj.avanzar(16 * 60 * 1000);
		await expect(
			darDeAltaConInvitacion(ambiente.db, {
				actor: admin,
				nombre: 'Pedro',
				correo: 'pedro@ejemplo.es',
				rol: 'miembro',
				contrasenaActual: undefined,
				instante: CUANDO(),
			}),
		).rejects.toMatchObject({ codigo: 'REAUTENTICACION_REQUERIDA' });
	});
});
