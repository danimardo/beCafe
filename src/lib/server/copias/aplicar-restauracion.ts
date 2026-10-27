import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { registrar } from '#lib/server/plataforma';
import { ARCHIVO_PENDIENTE, esquemaPendiente, SUBDIRECTORIO_RESTAURACION, type RestauracionPendiente } from './restauracion';

// Aplica una restauración preparada, al arrancar y ANTES de abrir la base (plan F14 D1, research R1). Los `rename` dentro del
// mismo volumen son atómicos; si uno falla, se devuelve todo a su sitio y la aplicación arranca con los datos de antes.

const ARCHIVOS_BASE = ['becafe.db', 'becafe.db-wal', 'becafe.db-shm'] as const;

function apartarMarca(marca: string, motivo: string): null {
	registrar('copia.restauracion_marca_invalida', { motivo });
	try {
		renameSync(marca, `${marca}.rechazada`);
	} catch {
		rmSync(marca, { force: true });
	}
	return null;
}

/** Sustituye la base y las fotos por las de la restauración preparada. Devuelve su marca, o `null` si no había nada que aplicar. */
export function aplicarRestauracionPendiente(directorioDatos: string): RestauracionPendiente | null {
	const restauracion = join(directorioDatos, SUBDIRECTORIO_RESTAURACION);
	const marca = join(restauracion, ARCHIVO_PENDIENTE);
	if (!existsSync(marca)) return null;
	const inicio = Date.now();

	let pendiente: RestauracionPendiente;
	try {
		pendiente = esquemaPendiente.parse(JSON.parse(readFileSync(marca, 'utf-8')));
	} catch {
		return apartarMarca(marca, 'esquema');
	}
	const preparada = join(restauracion, 'preparada');
	if (!existsSync(join(preparada, 'becafe.db'))) return apartarMarca(marca, 'sin_datos');

	const anterior = join(restauracion, 'anterior');
	rmSync(anterior, { recursive: true, force: true });
	mkdirSync(anterior, { recursive: true });
	const apartados: string[] = [];
	try {
		for (const nombre of [...ARCHIVOS_BASE, 'fotos']) {
			if (!existsSync(join(directorioDatos, nombre))) continue;
			renameSync(join(directorioDatos, nombre), join(anterior, nombre));
			apartados.push(nombre);
		}
		renameSync(join(preparada, 'becafe.db'), join(directorioDatos, 'becafe.db'));
		if (existsSync(join(preparada, 'fotos'))) renameSync(join(preparada, 'fotos'), join(directorioDatos, 'fotos'));
		else mkdirSync(join(directorioDatos, 'fotos'), { recursive: true });
	} catch {
		// Devuelve los datos de antes: lo nuevo que hubiera llegado se quita y lo apartado vuelve a su sitio.
		for (const nombre of [...ARCHIVOS_BASE, 'fotos']) {
			if (apartados.includes(nombre)) rmSync(join(directorioDatos, nombre), { recursive: true, force: true });
		}
		for (const nombre of apartados) renameSync(join(anterior, nombre), join(directorioDatos, nombre));
		registrar('copia.restauracion_fallida', { restauracionId: pendiente.restauracionId, paso: 'aplicar', codigo: 'APLICAR' });
		return apartarMarca(marca, 'aplicar');
	}
	rmSync(restauracion, { recursive: true, force: true });
	registrar('copia.restauracion_aplicada', { restauracionId: pendiente.restauracionId, duracionMs: Date.now() - inicio });
	return pendiente;
}
