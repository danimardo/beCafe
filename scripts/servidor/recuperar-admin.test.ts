import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { recuperarDesdeComando, SALIDA, leerArgumentos, validarEntorno } from './comando';
import { crearEntornoPrueba, usarRegistro, type EntornoPrueba } from '#lib/server/plataforma';
import { crearRegistroFalso } from '../../src/lib/server/plataforma/pruebas/registro-falso';
import { enlaceAcceso } from '#lib/server/auth';
import { registroAuditoria, usuario } from '#lib/server/usuarios';
import { construirUsuario } from '../../src/lib/server/usuarios/pruebas/constructores';

// RF-139b y CA-139 (contracts/api.md): códigos de salida, vigencias y auditoría con origen `comando`.
const INSTANTE = '2026-10-21T09:00:00.000Z';
const UNA_HORA = '2026-10-21T10:00:00.000Z';
const VEINTICUATRO_HORAS = '2026-10-22T09:00:00.000Z';

describe('comando de recuperación de administrador (RF-139b, CA-139)', () => {
	let entorno: EntornoPrueba;
	let registro: ReturnType<typeof crearRegistroFalso>;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
		registro = crearRegistroFalso();
		usarRegistro(registro);
	});

	afterEach(() => entorno.cerrar());

	function enlaces() {
		return entorno.base.db.select().from(enlaceAcceso).all();
	}

	it('CA-139: un administrador activo recibe un enlace de recuperación de 1 h y la salida es 0', () => {
		const admin = construirUsuario(entorno.base.db, { email: 'ana@ejemplo.es', rol: 'administrador' });

		const codigo = recuperarDesdeComando(entorno.ambiente, ['--correo', 'ana@ejemplo.es']);

		expect(codigo).toBe(SALIDA.ok);
		expect(registro.enlacesSoloSalida).toHaveLength(1);
		expect(registro.enlacesSoloSalida[0]).toContain('/acceso/');
		const generado = enlaces().find((fila) => fila.usuarioId === admin.id);
		expect(generado).toMatchObject({ tipo: 'recuperacion', expiraEn: UNA_HORA });
	});

	it('CA-139: un correo nuevo con --nombre crea un administrador con invitación de 24 h', () => {
		const codigo = recuperarDesdeComando(entorno.ambiente, ['--correo', 'luis@ejemplo.es', '--nombre', 'Luis']);

		expect(codigo).toBe(SALIDA.ok);
		const creado = entorno.base.db.select().from(usuario).where(eq(usuario.email, 'luis@ejemplo.es')).get();
		expect(creado).toMatchObject({ rol: 'administrador', estado: 'activo' });
		expect(enlaces().find((fila) => fila.usuarioId === creado?.id)).toMatchObject({ tipo: 'invitacion', expiraEn: VEINTICUATRO_HORAS });
	});

	it('CA-139: la auditoría de la recuperación tiene origen comando y actor nulo', () => {
		const admin = construirUsuario(entorno.base.db, { email: 'ana@ejemplo.es', rol: 'administrador' });

		recuperarDesdeComando(entorno.ambiente, ['--correo', 'ana@ejemplo.es']);

		const filas = entorno.base.db.select().from(registroAuditoria).where(eq(registroAuditoria.objetoId, admin.id)).all();
		const enlace = filas.find((fila) => fila.accion === 'enlace.generado');
		expect(enlace?.actorId).toBeNull();
		expect(JSON.parse(enlace?.detalle ?? '{}')).toMatchObject({ origen: 'comando' });
	});

	it('un correo nuevo sin --nombre es un error de uso (salida 2) y no crea nada', () => {
		const codigo = recuperarDesdeComando(entorno.ambiente, ['--correo', 'nuevo@ejemplo.es']);

		expect(codigo).toBe(SALIDA.uso);
		expect(entorno.base.db.select().from(usuario).all()).toHaveLength(0);
	});

	it('un miembro no se toca: salida 3 y sin enlace', () => {
		construirUsuario(entorno.base.db, { email: 'pedro@ejemplo.es', rol: 'miembro' });

		const codigo = recuperarDesdeComando(entorno.ambiente, ['--correo', 'pedro@ejemplo.es']);

		expect(codigo).toBe(SALIDA.estado);
		expect(enlaces()).toHaveLength(0);
	});

	it('una persona dada de baja no se toca: salida 3 y sin enlace', () => {
		construirUsuario(entorno.base.db, { email: 'marta@ejemplo.es', rol: 'administrador', estado: 'baja' });

		const codigo = recuperarDesdeComando(entorno.ambiente, ['--correo', 'marta@ejemplo.es']);

		expect(codigo).toBe(SALIDA.estado);
		expect(enlaces()).toHaveLength(0);
	});

	it('sin --correo es un error de uso (salida 2) con el evento de rechazo', () => {
		const codigo = recuperarDesdeComando(entorno.ambiente, []);

		expect(codigo).toBe(SALIDA.uso);
		expect(registro.eventos).toContainEqual(expect.objectContaining({ codigo: 'operacion.rechazada', campos: { codigo: 'VALIDACION' } }));
	});

	it('un entorno no válido devuelve solo los nombres de las variables', () => {
		const resultado = validarEntorno({ ORIGIN: 'ftp://ejemplo.es', LOG_LEVEL: 'info' });

		expect(resultado).toEqual({ ok: false, variables: ['ORIGIN', 'DIRECTORIO_DATOS'] });
		expect(JSON.stringify(resultado)).not.toContain('ftp://');
	});

	it('leerArgumentos ignora un --nombre sin valor y rechaza un correo mal formado', () => {
		expect(leerArgumentos(['--correo', 'ana@ejemplo.es', '--nombre'])).toEqual({ correo: 'ana@ejemplo.es', nombre: undefined });
		expect(leerArgumentos(['--correo', 'no-es-correo'])).toBeUndefined();
	});
});
