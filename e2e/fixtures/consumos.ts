import type { Page } from '@playwright/test';
import type { ServidorDePrueba } from './servidor';
import { aportar, registrarCompra, tiposDeCompra } from './economia';
import { entrarComo } from './sesiones';

// Datos de prueba de consumos (F3). La base se comparte entre las pruebas de un mismo worker: cada una crea su tipo.

/** Da de alta un tipo, lo compra con coste y deja la sesión de una persona miembro lista para tocar (RF-011). */
export async function tipoConCoste(page: Page, servidor: ServidorDePrueba): Promise<string> {
	const [tipo] = await tiposDeCompra(page, servidor);
	await entrarComo(page, servidor, 'miembro');
	await aportar(page, servidor, '50,00');
	await registrarCompra(page, servidor, tipo, '3,48');
	return tipo;
}

/** Botón de la fila de un tipo: el toque de la persona (RF-011) y el de invitado (RF-014). */
export function botonDeToque(page: Page, tipo: string) {
	return page.getByRole('button', { name: new RegExp(`^Registrar ${tipo}(?! para un invitado)`) });
}

export function botonDeInvitado(page: Page, tipo: string) {
	return page.getByRole('button', { name: `Registrar ${tipo} para un invitado`, exact: true });
}
