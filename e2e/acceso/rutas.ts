// Rutas de F1 (EV-050). Las rutas protegidas exigen sesión; la de administración exige el rol administrador.
// Las listas se usan para generar los casos de acceso y de accesibilidad: añadir una ruta nueva la incluye aquí.
export const RUTAS_PROTEGIDAS = ['/', '/perfil', '/privacidad', '/admin', '/admin/usuarios'] as const;
export const RUTAS_DE_ADMINISTRACION = ['/admin', '/admin/usuarios'] as const;
export const RUTAS_PUBLICAS = ['/login'] as const;
