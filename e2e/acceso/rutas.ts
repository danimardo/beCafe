// Rutas de F1, F2 y F4 (EV-050). Las rutas protegidas exigen sesión; la de administración exige el rol administrador.
// Las listas se usan para generar los casos de acceso y de accesibilidad: añadir una ruta nueva la incluye aquí.
// Identificador con formato ULID válido: comprueba la ruta de detalle sin depender de datos sembrados.
export const CAPSULA_DE_PRUEBA = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
export const RUTAS_PROTEGIDAS = [
	'/',
	'/perfil',
	'/privacidad',
	'/ayuda',
	'/ayuda/capsulito',
	'/avisos',
	'/admin',
	'/admin/usuarios',
	'/admin/capsulas',
	'/admin/capsulas/nueva',
	`/admin/capsulas/${CAPSULA_DE_PRUEBA}`,
	'/saldos',
	`/saldos/aportaciones/${CAPSULA_DE_PRUEBA}`,
	'/compras',
	`/compras/${CAPSULA_DE_PRUEBA}`,
	`/consumos/${CAPSULA_DE_PRUEBA}`,
	`/rellenos/${CAPSULA_DE_PRUEBA}`,
	'/historial',
	`/historial/control/${CAPSULA_DE_PRUEBA}`,
	'/estadisticas',
	`/estadisticas/${CAPSULA_DE_PRUEBA}`,
	'/admin/control',
	'/admin/copias',
	'/admin/configuracion',
	`/admin/usuarios/${CAPSULA_DE_PRUEBA}/baja`,
	'/visitantes',
	'/admin/visitantes',
	// Sin visita ni sesión, la pantalla del visitante también lleva a la entrada (F10, CA-194).
	'/visita',
] as const;
export const RUTAS_DE_ADMINISTRACION = [
	'/admin',
	'/admin/usuarios',
	'/admin/capsulas',
	'/admin/capsulas/nueva',
	`/admin/capsulas/${CAPSULA_DE_PRUEBA}`,
	'/admin/control',
	'/admin/copias',
	'/admin/configuracion',
	`/admin/usuarios/${CAPSULA_DE_PRUEBA}/baja`,
	'/admin/visitantes',
] as const;
// Rutas de API que exigen sesión (F3). Un POST sin sesión responde 401 y no registra nada.
export const RUTAS_API_PROTEGIDAS = ['/api/consumos', '/api/push/suscripcion'] as const;
export const RUTAS_PUBLICAS = ['/login'] as const;
