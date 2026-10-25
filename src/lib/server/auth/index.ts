// API pública de `auth`. Las tablas se exportan solo para la integración de pruebas y del arranque.
export { credencial, sesion, enlaceAcceso, sesionCerradaPorBaja } from './esquema';
export { iniciarSesion } from './iniciar-sesion';
export { definirContrasenaConEnlace, validarEnlace, generarEnlace, type ValidezEnlace } from './enlaces';
export { cambiarContrasena } from './cambiar-contrasena';
export {
	cerrarSesionActual,
	cerrarSesionesGlobal,
	cerrarSesionesPorBaja,
	limpiarSesionesCerradasPorBaja,
	motivoSesionInvalida,
} from './sesiones';
export { reautenticar, exigirReautenticacion } from './reautenticacion';
export { crearActor, exigirSesion, exigirAdministrador, type Actor } from './actor';
export {
	NOMBRE_COOKIE,
	crearSesion,
	resolverSesion,
	cerrarSesion,
	cerrarSesionesDeUsuario,
	opcionesCookie,
	type SesionResuelta,
} from './sesiones';
export { listarPersonas, obtenerPersona, type PersonaAdmin, type ListadoPersonas } from './personas';
export { darDeAltaConInvitacion, generarEnlaceParaPersona, reactivarPersona, cambiarRolPersona } from './invitar';
export { crearPrimerAdministrador, hayUsuarios, recuperarAcceso, type ResultadoRecuperacion } from './admin-inicial';
export { contrasenaAceptable } from './contrasenas';
export {
	NOMBRE_COOKIE_VISITA,
	VIGENCIA_ENLACE_VISITANTE_MS,
	crearEnlaceVisitante,
	revocarEnlaceVisitante,
	listarEnlacesVisitante,
	validarEnlaceVisitante,
	abrirVisita,
	resolverVisita,
	eliminarNombreVisita,
	leerVisitas,
	opcionesCookieVisita,
	type EnlaceVisitante,
	type EstadoEnlaceVisitante,
	type VisitaResuelta,
} from './visitantes';
