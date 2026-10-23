// Rutas de F1, F2 y F4 (EV-050). Las rutas protegidas exigen sesión; la de administración exige el rol administrador.
// Las listas se usan para generar los casos de acceso y de accesibilidad: añadir una ruta nueva la incluye aquí.
// Identificador con formato ULID válido: comprueba la ruta de detalle sin depender de datos sembrados.
export const CAPSULA_DE_PRUEBA = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
export const RUTAS_PROTEGIDAS = [
	'/',
	'/perfil',
	'/privacidad',
	'/admin',
	'/admin/usuarios',
	'/admin/capsulas',
	'/admin/capsulas/nueva',
	`/admin/capsulas/${CAPSULA_DE_PRUEBA}`,
	'/saldos',
	`/saldos/aportaciones/${CAPSULA_DE_PRUEBA}`,
	'/compras',
	`/compras/${CAPSULA_DE_PRUEBA}`,
	'/admin/control',
	`/admin/usuarios/${CAPSULA_DE_PRUEBA}/baja`,
] as const;
export const RUTAS_DE_ADMINISTRACION = [
	'/admin',
	'/admin/usuarios',
	'/admin/capsulas',
	'/admin/capsulas/nueva',
	`/admin/capsulas/${CAPSULA_DE_PRUEBA}`,
	'/admin/control',
	`/admin/usuarios/${CAPSULA_DE_PRUEBA}/baja`,
] as const;
export const RUTAS_PUBLICAS = ['/login'] as const;
