import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { crearActor, definirContrasenaConEnlace, generarEnlace, resolverSesion, type Actor } from '#lib/server/auth';
import { abrirBaseDatos, crearEntornoPrueba, enTransaccion, ErrorDeNegocio, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario } from '#lib/server/usuarios';
import { aplicarRestauracionPendiente } from './aplicar-restauracion';
import { empaquetar } from './empaquetado';
import { ErrorCopia, ErrorRestauracion, type CodigoRestauracion } from './errores';
import { hacerInstantanea } from './instantanea';
import { ARCHIVO_PENDIENTE, claveDeResguardo, esquemaPendiente, restaurarCopia, SUBDIRECTORIO_RESTAURACION } from './restauracion';
import type { ClienteS3 } from './subida-s3';

// Plan F14 D1, tareas T003 y T004: restauración desde la aplicación contra un bucket falso y SQLite real (EV-112, EV-113, CA-254 a CA-256).
const INSTANTE = '2026-10-26T10:00:00.000Z';
const CLAVE_COPIA = 'becafe/2026/10/becafe-2026-10-25T02-00-00.000Z.tar.gz';
const CONTRASENA = 'una contraseña larga de prueba';

type Objeto = { datos: Buffer; sha: string; modificadaEn: string };
type Fallos = { listar: boolean; subir: boolean; descargar: boolean; sumaMal: boolean };

function crearBucketFalso() {
	const objetos = new Map<string, Objeto>();
	const fallos: Fallos = { listar: false, subir: false, descargar: false, sumaMal: false };
	const cliente: ClienteS3 = {
		async subir({ clave, ruta, sha256 }) {
			if (fallos.subir) throw new ErrorCopia('S3_RED');
			objetos.set(clave, { datos: await readFile(ruta), sha: sha256, modificadaEn: INSTANTE });
		},
		listar() {
			if (fallos.listar) return Promise.reject(new ErrorCopia('S3_RED'));
			return Promise.resolve(
				[...objetos].map(([clave, objeto]) => ({
					clave,
					tamano: objeto.datos.length,
					modificadaEn: objeto.modificadaEn,
					resguardo: clave.startsWith('becafe/resguardos/'),
				})),
			);
		},
		async descargar(clave, destino) {
			if (fallos.descargar) throw new ErrorCopia('S3_RED');
			const objeto = objetos.get(clave);
			if (!objeto) throw new ErrorCopia('S3_RESPUESTA', 404);
			await writeFile(destino, objeto.datos);
			return fallos.sumaMal ? 'a'.repeat(64) : objeto.sha;
		},
	};
	return { objetos, fallos, cliente };
}

describe('restaurar una copia desde la aplicación (EV-112, EV-113, RF-253 a RF-256)', () => {
	let entorno: EntornoPrueba;
	let bucket: ReturnType<typeof crearBucketFalso>;
	let admin: Actor;
	let trabajo: string;
	const reiniciar = vi.fn();

	beforeEach(async () => {
		entorno = crearEntornoPrueba(INSTANTE);
		bucket = crearBucketFalso();
		reiniciar.mockReset();
		trabajo = await mkdtemp(join(tmpdir(), 'becafe-prueba-restauracion-'));
		entorno.ambiente.copias.s3 = {
			endpoint: 'http://127.0.0.1:1',
			bucket: 'prueba',
			region: 'eu-south-2',
			claveAcceso: 'clave-de-prueba',
			claveSecreta: 'secreto-de-prueba',
		};
		entorno.ambiente.reiniciar = reiniciar;
		admin = await sesionDe('administrador', 'Administración', true);
	});

	afterEach(async () => {
		entorno.cerrar();
		await rm(trabajo, { recursive: true, force: true });
	});

	async function sesionDe(rol: 'miembro' | 'administrador', nombre: string, conContrasena = false): Promise<Actor> {
		const db = entorno.ambiente.db;
		const usuarioId = nuevoId();
		enTransaccion(db, (tx) =>
			crearUsuario(tx, { id: usuarioId, nombre, correo: `${nombre.toLowerCase()}-${usuarioId}@example.test`, rol, instante: INSTANTE }),
		);
		const { token } = enTransaccion(db, (tx) =>
			generarEnlace(tx, { usuarioId, tipo: 'invitacion', origen: 'aplicacion', creadoPor: null, instante: INSTANTE }),
		);
		const { sesionToken } = await definirContrasenaConEnlace(db, {
			token,
			contrasena: conContrasena ? CONTRASENA : `${CONTRASENA} de ${nombre}`,
			instante: INSTANTE,
		});
		const sesion = resolverSesion(db, sesionToken, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	/** Guarda en el bucket una copia del estado actual (con `preparar` aplicado a la instantánea antes de empaquetarla). */
	async function guardarCopia(clave = CLAVE_COPIA, preparar?: (ruta: string) => void) {
		const instantanea = join(trabajo, `instantanea-${nuevoId()}.db`);
		hacerInstantanea(entorno.ambiente.db, instantanea);
		preparar?.(instantanea);
		const destino = join(trabajo, `copia-${nuevoId()}.tar.gz`);
		await mkdir(entorno.ambiente.directorioFotos, { recursive: true });
		const { sha256 } = await empaquetar({ instantanea, directorioFotos: entorno.ambiente.directorioFotos, destino });
		bucket.objetos.set(clave, { datos: await readFile(destino), sha: sha256, modificadaEn: '2026-10-25T02:00:00.000Z' });
	}

	function personas(db = entorno.ambiente.db): number {
		return db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM usuario`)[0]?.n ?? 0;
	}

	const restaurar = (actor: Actor | undefined = admin, contrasena = CONTRASENA, clave = CLAVE_COPIA) =>
		restaurarCopia(entorno.ambiente, actor, { clave, contrasena }, bucket.cliente);

	function directorioDatos() {
		return entorno.ambiente.copias.directorioDatos;
	}

	async function esperarRechazo(codigo: CodigoRestauracion) {
		const rechazo = await restaurar().catch((causa: unknown) => causa);
		expect(rechazo).toBeInstanceOf(ErrorRestauracion);
		expect(rechazo instanceof ErrorRestauracion && rechazo.codigo).toBe(codigo);
		expect(existsSync(join(directorioDatos(), SUBDIRECTORIO_RESTAURACION, ARCHIVO_PENDIENTE))).toBe(false);
		expect(entorno.ambiente.mantenimiento.restaurando).toBe(false);
		expect(reiniciar).not.toHaveBeenCalled();
		expect(personas()).toBe(2);
	}

	describe('con una copia válida del bucket', () => {
		beforeEach(async () => {
			await guardarCopia();
			await sesionDe('miembro', 'Ana');
		});

		it('EV-112: prepara la restauración, sube la copia de resguardo y pide el reinicio', async () => {
			await restaurar();

			const marca = esquemaPendiente.parse(
				JSON.parse(await readFile(join(directorioDatos(), SUBDIRECTORIO_RESTAURACION, ARCHIVO_PENDIENTE), 'utf-8')),
			);
			expect(marca.clave).toBe(CLAVE_COPIA);
			expect(marca.adminId).toBe(admin.usuarioId);
			expect(marca.resguardo).toBe(claveDeResguardo(INSTANTE));
			expect(bucket.objetos.has(marca.resguardo)).toBe(true);
			expect(reiniciar).toHaveBeenCalledTimes(1);
			// Los registros siguen bloqueados hasta que el proceso termina (plan F14 D2).
			expect(entorno.ambiente.mantenimiento.restaurando).toBe(true);
			// Preparar no cambia ningún dato: la base sigue con las dos personas.
			expect(personas()).toBe(2);
		});

		it('EV-112, CA-256: al arrancar, los datos son los de la copia y queda todo limpio', async () => {
			await restaurar();

			const marca = aplicarRestauracionPendiente(directorioDatos());

			expect(marca?.clave).toBe(CLAVE_COPIA);
			expect(existsSync(join(directorioDatos(), SUBDIRECTORIO_RESTAURACION))).toBe(false);
			const restaurada = abrirBaseDatos(join(directorioDatos(), 'becafe.db'));
			try {
				// En la copia solo estaba la administración; Ana se registró después y se pierde (RF-254).
				expect(personas(restaurada.db)).toBe(1);
			} finally {
				restaurada.cerrar();
			}
			expect((await stat(join(directorioDatos(), 'fotos'))).isDirectory()).toBe(true);
		});

		it('CA-254: una contraseña incorrecta no restaura nada', async () => {
			const rechazo = await restaurar(admin, 'contraseña equivocada').catch((causa: unknown) => causa);

			expect(rechazo).toBeInstanceOf(ErrorDeNegocio);
			expect(rechazo instanceof ErrorDeNegocio && rechazo.codigo).toBe('CREDENCIALES_INCORRECTAS');
			expect(entorno.ambiente.mantenimiento.restaurando).toBe(false);
			expect(bucket.objetos.size).toBe(1);
			expect(reiniciar).not.toHaveBeenCalled();
		});

		it('CA-254: un miembro no puede restaurar', async () => {
			const ana = await sesionDe('miembro', 'Beto');

			const rechazo = await restaurar(ana).catch((causa: unknown) => causa);

			expect(rechazo).toBeInstanceOf(ErrorDeNegocio);
			expect(rechazo instanceof ErrorDeNegocio && rechazo.codigo).toBe('SIN_PERMISO');
			expect(bucket.objetos.size).toBe(1);
		});

		it('CA-254: con otra restauración en curso, se rechaza sin tocar el bloqueo', async () => {
			entorno.ambiente.mantenimiento.restaurando = true;

			const rechazo = await restaurar().catch((causa: unknown) => causa);

			expect(rechazo instanceof ErrorRestauracion && rechazo.codigo).toBe('EN_CURSO');
			expect(entorno.ambiente.mantenimiento.restaurando).toBe(true);
			expect(bucket.objetos.size).toBe(1);
		});

		it('CA-253: sin S3 configurado, no se ofrece ni se permite restaurar', async () => {
			entorno.ambiente.copias.s3 = undefined;

			const rechazo = await restaurar().catch((causa: unknown) => causa);

			expect(rechazo instanceof ErrorRestauracion && rechazo.codigo).toBe('SIN_S3');
		});

		it('EV-113: una copia que ya no está en el bucket se rechaza', async () => {
			const rechazo = await restaurar(admin, CONTRASENA, 'becafe/2026/10/otra.tar.gz').catch((causa: unknown) => causa);

			expect(rechazo instanceof ErrorRestauracion && rechazo.codigo).toBe('NO_ENCONTRADA');
			expect(entorno.ambiente.mantenimiento.restaurando).toBe(false);
		});

		it('EV-113, CA-255: si el bucket no responde al listar, no cambia nada', async () => {
			bucket.fallos.listar = true;
			await esperarRechazo('BUCKET');
			expect(bucket.objetos.size).toBe(1);
		});

		it('EV-113, CA-255: si falla la copia de resguardo, no cambia nada', async () => {
			bucket.fallos.subir = true;
			await esperarRechazo('BUCKET');
			expect([...bucket.objetos.keys()]).toEqual([CLAVE_COPIA]);
		});

		it('EV-113, CA-255: si falla la descarga, no cambia nada', async () => {
			bucket.fallos.descargar = true;
			await esperarRechazo('BUCKET');
		});

		it('EV-113, CA-255: si la suma de verificación no coincide, la copia se rechaza como dañada', async () => {
			bucket.fallos.sumaMal = true;
			await esperarRechazo('DANADA');
		});

		it('EV-113, CA-255: una copia que no es un archivo válido se rechaza como dañada', async () => {
			bucket.objetos.set(CLAVE_COPIA, { datos: Buffer.from('esto no es una copia'), sha: 'a'.repeat(64), modificadaEn: INSTANTE });
			await esperarRechazo('DANADA');
		});

		it('EV-113, CA-255: una copia de una versión más nueva se rechaza antes de sustituir nada', async () => {
			await guardarCopia(CLAVE_COPIA, (ruta) => {
				const conexion = abrirBaseDatos(ruta);
				try {
					conexion.db.run(sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('migracion-futura', 9999999999999)`);
				} finally {
					conexion.cerrar();
				}
			});
			await esperarRechazo('VERSION_NUEVA');
		});

		it('CA-255: tras un fallo se puede volver a intentar y la preparación queda completa', async () => {
			bucket.fallos.descargar = true;
			await restaurar().catch(() => undefined);
			bucket.fallos.descargar = false;

			await restaurar();

			expect(existsSync(join(directorioDatos(), SUBDIRECTORIO_RESTAURACION, ARCHIVO_PENDIENTE))).toBe(true);
		});
	});

	describe('al arrancar con una marca que no se puede aplicar', () => {
		it('EV-113: una marca que no supera su esquema se aparta y no cambia nada', async () => {
			const carpeta = join(directorioDatos(), SUBDIRECTORIO_RESTAURACION);
			await mkdir(carpeta, { recursive: true });
			await writeFile(join(carpeta, ARCHIVO_PENDIENTE), JSON.stringify({ clave: '../../etc/passwd' }));

			expect(aplicarRestauracionPendiente(directorioDatos())).toBeNull();

			expect(existsSync(join(carpeta, ARCHIVO_PENDIENTE))).toBe(false);
			expect(existsSync(join(carpeta, `${ARCHIVO_PENDIENTE}.rechazada`))).toBe(true);
			expect(personas()).toBe(1);
		});

		it('sin marca, no hace nada', () => {
			expect(aplicarRestauracionPendiente(directorioDatos())).toBeNull();
			expect(personas()).toBe(1);
		});

		it.skipIf(process.getuid?.() === 0)('EV-113: si un `rename` falla a medias, devuelve los datos de antes', async () => {
			await guardarCopia();
			await sesionDe('miembro', 'Ana');
			await restaurar();
			const preparada = join(directorioDatos(), SUBDIRECTORIO_RESTAURACION, 'preparada');
			// Sin permiso de escritura en `preparada`, no se puede mover su base: el fallo ocurre después de apartar los datos actuales.
			await chmod(preparada, 0o500);
			try {
				expect(aplicarRestauracionPendiente(directorioDatos())).toBeNull();
			} finally {
				await chmod(preparada, 0o700);
			}

			const intacta = abrirBaseDatos(join(directorioDatos(), 'becafe.db'));
			try {
				expect(personas(intacta.db)).toBe(2);
			} finally {
				intacta.cerrar();
			}
		});
	});
});
