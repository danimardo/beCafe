import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { prepararAmbiente, type ConfiguracionArranque } from './arranque';
import { crearEntornoPrueba, usarRegistro, type EntornoPrueba } from './plataforma';
import { crearRegistroFalso } from './plataforma/pruebas/registro-falso';
import { registroAuditoria, usuario } from './usuarios';

// CA-139 (RF-139, DEC-104): primer administrador en el arranque. El enlace solo sale por la salida estándar.

describe('arranque: primer administrador (CA-139)', () => {
	let entorno: EntornoPrueba;
	let registro: ReturnType<typeof crearRegistroFalso>;
	let directorio: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		registro = crearRegistroFalso();
		usarRegistro(registro);
		directorio = mkdtempSync(join(tmpdir(), 'becafe-arranque-'));
	});

	afterEach(() => {
		entorno.cerrar();
		rmSync(directorio, { recursive: true, force: true });
	});

	function configuracion(
		datos: Partial<Pick<ConfiguracionArranque, 'adminInicialEmail' | 'adminInicialNombre'>> = {},
	): ConfiguracionArranque {
		return {
			origen: 'http://localhost:4300',
			directorioDatos: directorio,
			nivelLog: 'info',
			adminInicialEmail: 'ana@ejemplo.es',
			adminInicialNombre: 'Ana',
			version: '0.1.0',
			commit: 'prueba',
			desarrollo: true,
			carpetaMigraciones: join(process.cwd(), 'drizzle'),
			...datos,
		};
	}

	it('CA-139: sin usuarios y con las dos variables crea el administrador, emite el enlace solo a la salida estándar y audita con origen arranque', () => {
		const ambiente = prepararAmbiente(configuracion());

		const admin = ambiente.db.select().from(usuario).where(eq(usuario.email, 'ana@ejemplo.es')).get();
		expect(admin).toMatchObject({ nombre: 'Ana', rol: 'administrador', estado: 'activo' });
		expect(registro.enlacesSoloSalida).toHaveLength(1);
		expect(registro.enlacesSoloSalida[0]).toContain('http://localhost:4300/acceso/');
		const alta = registro.eventos.find((evento) => evento.codigo === 'auth.admin_inicial_creado');
		expect(Object.keys(alta?.campos ?? {})).toEqual(['usuarioId']);
		const auditoria = ambiente.db
			.select()
			.from(registroAuditoria)
			.where(eq(registroAuditoria.objetoId, admin?.id ?? ''))
			.all();
		const enlace = auditoria.find((fila) => fila.accion === 'enlace.generado');
		expect(enlace?.actorId).toBeNull();
		expect(JSON.parse(enlace?.detalle ?? '{}')).toMatchObject({ origen: 'arranque' });
	});

	it('CA-139: con usuarios no crea nada ni emite otro enlace, aunque falten las variables', () => {
		const primero = prepararAmbiente(configuracion());
		expect(primero.db.select().from(usuario).all()).toHaveLength(1);

		const segundo = prepararAmbiente(configuracion({ adminInicialEmail: undefined, adminInicialNombre: undefined }));

		expect(registro.enlacesSoloSalida).toHaveLength(1);
		expect(registro.eventos.filter((evento) => evento.codigo === 'auth.admin_inicial_creado')).toHaveLength(1);
		expect(segundo.db.select().from(usuario).all()).toHaveLength(1);
	});

	it('CA-139: sin usuarios y sin las variables emite app.entorno_invalido con los nombres, sin valores, y no arranca', () => {
		expect(() => prepararAmbiente(configuracion({ adminInicialEmail: undefined, adminInicialNombre: undefined }))).toThrow(
			'ENTORNO_NO_VALIDO',
		);

		const evento = registro.eventos.find((item) => item.codigo === 'app.entorno_invalido');
		expect(evento?.campos).toEqual({ variables: ['ADMIN_INICIAL_EMAIL', 'ADMIN_INICIAL_NOMBRE'] });
		expect(JSON.stringify(evento)).not.toContain('@');
		expect(registro.enlacesSoloSalida).toHaveLength(0);
	});

	it('CA-139: si falta solo el correo, lo nombra y no crea el administrador', () => {
		expect(() => prepararAmbiente(configuracion({ adminInicialEmail: undefined }))).toThrow('ENTORNO_NO_VALIDO');

		expect(registro.eventos.find((item) => item.codigo === 'app.entorno_invalido')?.campos).toEqual({ variables: ['ADMIN_INICIAL_EMAIL'] });
		expect(entorno.base.db.select().from(usuario).all()).toHaveLength(0);
	});
});
