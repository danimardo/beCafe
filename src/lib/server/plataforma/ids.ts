import { ulid } from 'ulid';

/** Identificador ULID generado en el servidor (constitución V). */
export function nuevoId(): string {
	return ulid();
}
