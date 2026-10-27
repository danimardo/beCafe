import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { actions } from './+page.server';
import { crearEventoAccion } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { copiaSeguridad, crearS3Falso, leerPruebas, type S3Falso } from '#lib/server/copias';

// Acción de la pantalla de copias (CA-143, RF-143). El `load` no se prueba: lo cubren las pruebas E2E (AGENTS §7).
const INSTANTE = '2026-10-23T10:00:00.000Z';

describe('anotar una prueba de restauración desde el panel (CA-143)', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function sesionDe(rol: 'miembro' | 'administrador'): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function anotar(actor: Actor, campos: Record<string, string>) {
		return actions.anotarPrueba(
			crearEventoAccion({
				locals: { ambiente: entorno.ambiente, actor },
				ruta: '/(app)/admin/copias',
				params: {},
				cuerpo: new URLSearchParams(campos),
				cabeceras: { 'content-type': 'application/x-www-form-urlencoded' },
			}),
		);
	}

	it('un administrador anota una prueba correcta con su fecha', async () => {
		const admin = sesionDe('administrador');

		await expect(anotar(admin, { realizadaEl: '2026-10-22', resultado: 'correcta' })).resolves.toEqual({ anotada: true });
		expect(leerPruebas(entorno.ambiente.db, admin)).toHaveLength(1);
	});

	it('una fecha futura se rechaza y no se guarda', async () => {
		const admin = sesionDe('administrador');

		const resultado = await anotar(admin, { realizadaEl: '2026-10-24', resultado: 'correcta' });

		expect(resultado).toMatchObject({ status: 400 });
		expect(leerPruebas(entorno.ambiente.db, admin)).toHaveLength(0);
	});

	it('un miembro no anota pruebas (SIN_PERMISO)', async () => {
		const ana = sesionDe('miembro');

		const resultado = await anotar(ana, { realizadaEl: '2026-10-22', resultado: 'correcta' });

		expect(resultado).toMatchObject({ status: 403 });
	});
});

describe('hacer una copia ahora desde el panel (CA-286, CA-288, RF-286)', () => {
	let entorno: EntornoPrueba;
	let s3: S3Falso;

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
	});

	afterEach(async () => {
		await s3.cerrar();
		entorno.cerrar();
	});

	function sesionDe(rol: 'miembro' | 'administrador'): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre: 'Ana', correo: `ana-${usuarioId}@ejemplo.es`, rol, instante: INSTANTE }),
		);
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	const hacerCopia = (actor: Actor | undefined) =>
		actions.copiaManual(crearEventoAccion({ locals: { ambiente: entorno.ambiente, actor }, ruta: '/(app)/admin/copias', params: {} }));

	it('CA-286: un administrador hace la copia y la acción lo confirma', async () => {
		await expect(hacerCopia(sesionDe('administrador'))).resolves.toEqual({ copiaHecha: true });

		expect(s3.peticiones.filter((peticion) => peticion.metodo === 'PUT')).toHaveLength(1);
	});

	it('CA-286: con una copia en curso, la acción responde 409 con un mensaje que dice qué hacer', async () => {
		entorno.ambiente.db.insert(copiaSeguridad).values({ id: nuevoId(), iniciadaEn: INSTANTE, estado: 'en_curso', tipo: 'diaria' }).run();

		const resultado = await hacerCopia(sesionDe('administrador'));

		expect(resultado).toMatchObject({ status: 409 });
		expect(resultado).toMatchObject({ data: { errores: { copia: { codigo: 'EN_CURSO' } } } });
	});

	it('CA-286: si el bucket falla, responde 424 (falló el bucket) con el motivo en español y sin detalles internos', async () => {
		s3.responder(500);

		const resultado = await hacerCopia(sesionDe('administrador'));

		expect(resultado).toMatchObject({ status: 424 });
		expect(JSON.stringify(resultado)).toContain('S3 respondió con un error');
		expect(JSON.stringify(resultado)).not.toContain(s3.endpoint);
	});

	it('CA-288: sin S3 configurado responde 404 y lo explica', async () => {
		entorno.ambiente.copias.s3 = undefined;

		const resultado = await hacerCopia(sesionDe('administrador'));

		expect(resultado).toMatchObject({ status: 404, data: { errores: { copia: { codigo: 'SIN_S3' } } } });
	});

	it('CA-286: un miembro recibe 403 y no se hace ninguna copia', async () => {
		await expect(hacerCopia(sesionDe('miembro'))).rejects.toMatchObject({ status: 403 });

		expect(s3.peticiones).toHaveLength(0);
	});

	it('CA-286: sin sesión no se hace ninguna copia', async () => {
		await expect(hacerCopia(undefined)).resolves.toMatchObject({ status: 401 });

		expect(s3.peticiones).toHaveLength(0);
	});
});
