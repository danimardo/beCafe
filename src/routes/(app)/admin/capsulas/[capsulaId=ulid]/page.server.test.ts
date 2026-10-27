import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { actions } from './+page.server';
import { crearEventoAccion, desenvolverFallo } from '#lib/shared/pruebas/acciones';
import { crearActor, crearSesion, resolverSesion, type Actor } from '#lib/server/auth';
import { crearEntornoPrueba, enTransaccion, nuevoId, type EntornoPrueba } from '#lib/server/plataforma';
import { crearUsuario, type Rol } from '#lib/server/usuarios';
import { darDeAltaCapsula } from '#lib/server/economia';

// Acción «Quitar foto» de una cápsula (RF-272, CA-272): permisos, esquema y confirmación.
const INSTANTE = '2026-10-27T09:00:00.000Z';

describe('acción quitarFoto de una cápsula', () => {
	let entorno: EntornoPrueba;

	beforeEach(() => {
		entorno = crearEntornoPrueba(INSTANTE);
	});

	afterEach(() => entorno.cerrar());

	function actorCon(rol: Rol, correo: string): Actor {
		const usuarioId = nuevoId();
		enTransaccion(entorno.ambiente.db, (tx) => crearUsuario(tx, { id: usuarioId, nombre: 'Persona', correo, rol, instante: INSTANTE }));
		const token = enTransaccion(entorno.ambiente.db, (tx) => crearSesion(tx, { usuarioId, instante: INSTANTE }));
		const sesion = resolverSesion(entorno.ambiente.db, token, INSTANTE);
		if (!sesion) throw new Error('La sesión de prueba debe resolverse');
		return crearActor(sesion);
	}

	async function capsulaConFoto(admin: Actor): Promise<string> {
		const foto = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 70, b: 40 } } })
			.jpeg()
			.toBuffer();
		const { id } = await darDeAltaCapsula(entorno.ambiente, admin, {
			nombre: 'Ristretto',
			marca: 'Marca',
			intensidad: undefined,
			color: 'cap-ristretto',
			umbralMinimo: 3,
			foto,
		});
		return id;
	}

	function quitar(actor: Actor | undefined, id: string, datos: Record<string, string>) {
		const cuerpo = new FormData();
		for (const [clave, valor] of Object.entries(datos)) cuerpo.append(clave, valor);
		return actions.quitarFoto(
			crearEventoAccion({ locals: { ambiente: entorno.ambiente, actor }, ruta: '/(app)/admin/capsulas/[capsulaId=ulid]', params: { capsulaId: id }, cuerpo }),
		);
	}

	it('CA-272: un administrador quita la foto y recibe la confirmación', async () => {
		const admin = actorCon('administrador', 'ana@ejemplo.es');
		const id = await capsulaConFoto(admin);

		const resultado = await quitar(admin, id, { quitar: 'si' });

		expect(resultado).toMatchObject({ confirmacion: 'Foto quitada.' });
		expect(entorno.eventos()).toContainEqual(expect.objectContaining({ codigo: 'capsula.foto_quitada' }));
	});

	it('CA-272: un miembro recibe 403 y la foto se conserva', async () => {
		const admin = actorCon('administrador', 'ana@ejemplo.es');
		const id = await capsulaConFoto(admin);
		const miembro = actorCon('miembro', 'luis@ejemplo.es');

		const { estado } = desenvolverFallo(await quitar(miembro, id, { quitar: 'si' }));

		expect(estado).toBe(403);
		expect(entorno.eventos()).not.toContainEqual(expect.objectContaining({ codigo: 'capsula.foto_quitada' }));
	});

	it('CA-272: una entrada sin el campo «quitar» se rechaza con 400', async () => {
		const admin = actorCon('administrador', 'ana@ejemplo.es');
		const id = await capsulaConFoto(admin);

		const { estado } = desenvolverFallo(await quitar(admin, id, { otro: 'x' }));

		expect(estado).toBe(400);
	});
});
