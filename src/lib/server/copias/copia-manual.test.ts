import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, tieneEjecucion, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, leerUltimaAuditoria } from '#lib/server/usuarios';
import { crearS3Falso, type S3Falso } from './pruebas/s3-falso';
import { hacerCopiaDiaria, TAREA_COPIA_DIARIA } from './copia-diaria';
import { hacerCopiaManual } from './copia-manual';
import { ErrorCopia, ErrorOperacionCopia } from './errores';
import { copiaSeguridad } from './esquema';
import { crearSubidaS3 } from './subida-s3';

// Plan F17 D3, tarea T005: «Hacer copia ahora» con S3 falso (CA-286, CA-287, CA-288, RF-286, RF-287, RF-288).
const INSTANTE = '2026-10-27T10:00:00.000Z';

describe('copia manual (CA-286, CA-287, CA-288)', () => {
	let entorno: EntornoPrueba;
	let s3: S3Falso;
	let admin: Actor;
	let miembro: Actor;

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		s3 = await crearS3Falso();
		entorno.ambiente.copias.s3 = {
			endpoint: s3.endpoint,
			bucket: 'becafe-prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		};
		admin = sesionDe('administrador', 'Administración');
		miembro = sesionDe('miembro', 'Ana');
	});

	afterEach(async () => {
		await s3.cerrar();
		entorno.cerrar();
	});

	function sesionDe(rol: 'miembro' | 'administrador', nombre: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@example.test`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	const copias = () => entorno.ambiente.db.select().from(copiaSeguridad).all();

	it('CA-286, CA-287: sube una copia completa con su origen y su tipo, y queda registrada como manual', async () => {
		const resultado = await hacerCopiaManual(entorno.ambiente, admin);

		expect(resultado.clave).toBe('becafe/2026/10/becafe-2026-10-27T10-00-00.000Z__local__manual.tar.gz');
		expect(s3.peticiones.some((peticion) => peticion.metodo === 'PUT' && peticion.ruta.endsWith(resultado.clave) && peticion.firmada)).toBe(
			true,
		);
		expect(s3.ultimaSubida()?.length).toBe(resultado.tamano);
		const [copia] = copias();
		expect(copia).toMatchObject({ estado: 'correcta', tipo: 'manual', claveObjeto: resultado.clave });
	});

	it('CA-287: la auditoría guarda quién la lanzó y el evento no lleva datos personales', async () => {
		await hacerCopiaManual(entorno.ambiente, admin);

		const [copia] = copias();
		expect(leerUltimaAuditoria(entorno.ambiente.db, 'copia.manual')).toMatchObject({ actorId: admin.usuarioId, objetoId: copia.id });
		const codigos = entorno.eventos().map((evento) => evento.codigo);
		expect(codigos).toContain('copia.manual_iniciada');
		expect(entorno.eventos().find((evento) => evento.codigo === 'copia.completada')?.campos).toMatchObject({
			tipo: 'manual',
			origen: 'local',
		});
	});

	it('CA-286: dos copias a la vez no se ejecutan: la segunda se rechaza como «en curso»', async () => {
		const resultados = await Promise.allSettled([hacerCopiaManual(entorno.ambiente, admin), hacerCopiaManual(entorno.ambiente, admin)]);

		expect(resultados.map((resultado) => resultado.status).sort()).toEqual(['fulfilled', 'rejected']);
		const rechazo = resultados.find((resultado) => resultado.status === 'rejected');
		expect(rechazo?.status === 'rejected' && rechazo.reason).toBeInstanceOf(ErrorOperacionCopia);
		expect(rechazo?.status === 'rejected' && rechazo.reason instanceof ErrorOperacionCopia && rechazo.reason.codigo).toBe('EN_CURSO');
		expect(copias()).toHaveLength(1);
		expect(s3.peticiones.filter((peticion) => peticion.metodo === 'PUT')).toHaveLength(1);
	});

	it('CA-286: con una copia diaria en curso, la manual se rechaza; con la anterior terminada, se puede repetir', async () => {
		entorno.ambiente.db.insert(copiaSeguridad).values({ id: nuevoId(), iniciadaEn: INSTANTE, estado: 'en_curso', tipo: 'diaria' }).run();
		await expect(hacerCopiaManual(entorno.ambiente, admin)).rejects.toMatchObject({ codigo: 'EN_CURSO' });

		entorno.ambiente.db.update(copiaSeguridad).set({ estado: 'fallida', codigoError: 'INTERRUMPIDA' }).run();
		await expect(hacerCopiaManual(entorno.ambiente, admin)).resolves.toMatchObject({ correcta: true });
	});

	it('CA-286: con una restauración en curso, se rechaza sin crear ninguna copia', async () => {
		entorno.ambiente.mantenimiento.restaurando = true;

		await expect(hacerCopiaManual(entorno.ambiente, admin)).rejects.toMatchObject({ codigo: 'EN_CURSO' });

		expect(copias()).toHaveLength(0);
	});

	it('CA-286: si el bucket falla, la copia queda fallida, se avisa a los administradores y se puede volver a intentar', async () => {
		s3.responder(500);

		const rechazo = await hacerCopiaManual(entorno.ambiente, admin).catch((causa: unknown) => causa);

		expect(rechazo).toBeInstanceOf(ErrorCopia);
		expect(rechazo instanceof ErrorCopia && [rechazo.codigo, rechazo.estadoHttp]).toEqual(['S3_RESPUESTA', 500]);
		expect(copias()[0]).toMatchObject({ estado: 'fallida', tipo: 'manual', codigoError: 'S3_RESPUESTA' });
		expect(entorno.eventos().find((evento) => evento.codigo === 'copia.fallida')?.campos).toMatchObject({
			tipo: 'manual',
			origen: 'local',
		});

		s3.responder('ok');
		await expect(hacerCopiaManual(entorno.ambiente, admin)).resolves.toMatchObject({ correcta: true });
	});

	it('CA-288: sin S3 configurado se rechaza y no se crea ninguna copia', async () => {
		entorno.ambiente.copias.s3 = undefined;

		await expect(hacerCopiaManual(entorno.ambiente, admin)).rejects.toMatchObject({ codigo: 'SIN_S3' });

		expect(copias()).toHaveLength(0);
	});

	it('CA-286: un miembro y una persona sin sesión no pueden hacer copias', async () => {
		await expect(hacerCopiaManual(entorno.ambiente, miembro)).rejects.toBeInstanceOf(ErrorDeNegocio);
		await expect(hacerCopiaManual(entorno.ambiente, undefined)).rejects.toBeInstanceOf(ErrorDeNegocio);

		expect(copias()).toHaveLength(0);
		expect(s3.peticiones).toHaveLength(0);
	});

	it('RF-286: una copia manual en curso no impide la copia diaria de las 03:00', async () => {
		entorno.ambiente.db.insert(copiaSeguridad).values({ id: nuevoId(), iniciadaEn: INSTANTE, estado: 'en_curso', tipo: 'manual' }).run();

		await hacerCopiaDiaria({
			db: entorno.ambiente.db,
			reloj: entorno.reloj,
			directorioDatos: entorno.ambiente.copias.directorioDatos,
			origen: 'local',
			subir: crearSubidaS3(
				entorno.ambiente.copias.s3 ??
					(() => {
						throw new Error('S3 de prueba');
					})(),
			),
		});

		expect(tieneEjecucion(entorno.ambiente.db, TAREA_COPIA_DIARIA, '2026-10-27')).toBe(true);
		const diaria = entorno.ambiente.db.select().from(copiaSeguridad).where(eq(copiaSeguridad.tipo, 'diaria')).all();
		expect(diaria).toHaveLength(1);
		expect(diaria[0]?.estado).toBe('correcta');
	});
});
