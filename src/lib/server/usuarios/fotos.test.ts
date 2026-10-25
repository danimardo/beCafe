import { existsSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { cambiarFoto, leerFotoUsuario } from './fotos';
import { registroAuditoria } from './esquema';
import { construirUsuario } from './pruebas/constructores';
import { esquemaSubirFotoPersona, urlFotoUsuario } from '#lib/shared/contratos/fotos-usuario';
import { crearEntornoPrueba, ErrorDeNegocio, RecursoNoEncontrado, type EntornoPrueba } from '#lib/server/plataforma';

// Foto de persona (RF-208, CA-208): la cambia la propia persona o un administrador; el contenido se valida y la anterior se borra.
async function fotoJpeg(): Promise<Uint8Array> {
	const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 90, g: 50, b: 30 } } })
		.jpeg()
		.toBuffer();
	return new Uint8Array(buffer);
}

describe('foto de persona (CA-208)', () => {
	let entorno: EntornoPrueba;
	let miembro: string;
	let otro: string;
	let administrador: string;

	beforeEach(() => {
		entorno = crearEntornoPrueba();
		miembro = construirUsuario(entorno.ambiente.db, { nombre: 'Luis' }).id;
		otro = construirUsuario(entorno.ambiente.db, { nombre: 'Marta' }).id;
		administrador = construirUsuario(entorno.ambiente.db, { nombre: 'Ana', rol: 'administrador' }).id;
	});

	afterEach(() => entorno.cerrar());

	const archivos = () => (existsSync(entorno.ambiente.directorioFotos) ? readdirSync(entorno.ambiente.directorioFotos) : []);

	it('CA-208: una persona sube su foto: se guarda en WebP, se anota la auditoría y la lee cualquier miembro', async () => {
		await cambiarFoto(entorno.ambiente, { usuarioId: miembro, rol: 'miembro' }, miembro, await fotoJpeg());

		const nombre = leerFotoUsuario(entorno.ambiente.db, miembro);
		expect(nombre).toMatch(/\.webp$/);
		expect(archivos()).toEqual([nombre]);
		const auditoria = entorno.ambiente.db.select().from(registroAuditoria).where(eq(registroAuditoria.objetoId, miembro)).all();
		expect(auditoria.map((fila) => [fila.accion, fila.actorId, fila.detalle])).toEqual([
			['usuario.foto_cambiada', miembro, JSON.stringify({ quitada: false })],
		]);
		expect(entorno.eventos().find((evento) => evento.codigo === 'usuario.foto_cambiada')?.campos).toEqual({
			usuarioId: miembro,
			quitada: false,
		});
	});

	it('CA-208: subir otra foto sustituye a la anterior y borra su archivo', async () => {
		const actor = { usuarioId: miembro, rol: 'miembro' as const };
		await cambiarFoto(entorno.ambiente, actor, miembro, await fotoJpeg());
		const primera = leerFotoUsuario(entorno.ambiente.db, miembro);

		await cambiarFoto(entorno.ambiente, actor, miembro, await fotoJpeg());
		const segunda = leerFotoUsuario(entorno.ambiente.db, miembro);

		expect(segunda).not.toBe(primera);
		expect(archivos()).toEqual([segunda]);
	});

	it('CA-208: el administrador sube y quita la foto de otra persona; un miembro no puede cambiar la de otra', async () => {
		const admin = { usuarioId: administrador, rol: 'administrador' as const };
		await cambiarFoto(entorno.ambiente, admin, otro, await fotoJpeg());
		expect(leerFotoUsuario(entorno.ambiente.db, otro)).not.toBeNull();

		await expect(cambiarFoto(entorno.ambiente, { usuarioId: miembro, rol: 'miembro' }, otro, null)).rejects.toMatchObject({
			codigo: 'SIN_PERMISO',
		});
		expect(leerFotoUsuario(entorno.ambiente.db, otro)).not.toBeNull();

		await cambiarFoto(entorno.ambiente, admin, otro, null);
		expect(leerFotoUsuario(entorno.ambiente.db, otro)).toBeNull();
		expect(archivos()).toEqual([]);
		const quitada = entorno.ambiente.db.select().from(registroAuditoria).where(eq(registroAuditoria.objetoId, otro)).all();
		expect(quitada.map((fila) => [fila.actorId, fila.detalle])).toEqual([
			[administrador, JSON.stringify({ quitada: false })],
			[administrador, JSON.stringify({ quitada: true })],
		]);
	});

	it('CA-208: un archivo que no es una imagen se rechaza y no cambia nada', async () => {
		await expect(
			cambiarFoto(entorno.ambiente, { usuarioId: miembro, rol: 'miembro' }, miembro, new TextEncoder().encode('no soy una imagen')),
		).rejects.toBeInstanceOf(ErrorDeNegocio);

		expect(leerFotoUsuario(entorno.ambiente.db, miembro)).toBeNull();
		expect(archivos()).toEqual([]);
	});

	it('CA-208: una persona inexistente no tiene foto que cambiar', async () => {
		await expect(
			cambiarFoto(entorno.ambiente, { usuarioId: administrador, rol: 'administrador' }, '01INEXISTENTE000000000000X', null),
		).rejects.toBeInstanceOf(RecursoNoEncontrado);
		expect(leerFotoUsuario(entorno.ambiente.db, '01INEXISTENTE000000000000X')).toBeNull();
	});
});

describe('contrato de la foto de persona (CA-208)', () => {
	it('CA-208: más de 5 MB se rechaza y un archivo vacío cuenta como ausente', () => {
		const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' });
		const pequena = new File([new Uint8Array(10)], 'foto.jpg', { type: 'image/jpeg' });

		expect(esquemaSubirFotoPersona.safeParse({ foto: grande }).success).toBe(false);
		expect(esquemaSubirFotoPersona.safeParse({ foto: pequena }).success).toBe(true);
		expect(esquemaSubirFotoPersona.safeParse({ foto: new File([], 'vacio.jpg') }).success).toBe(false);
	});

	it('la dirección lleva la versión de la foto para renovar la caché al cambiarla', () => {
		expect(urlFotoUsuario('01ABC', '01XYZ.webp')).toBe('/fotos/usuarios/01ABC?v=01XYZ');
	});
});
