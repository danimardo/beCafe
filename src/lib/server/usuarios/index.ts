// API pública de `usuarios`. Las tablas se exportan para declarar claves externas y para leer la auditoría en las pruebas.
export { usuario, registroAuditoria } from './esquema';
export { ROLES, ESTADOS, esquemaRol, type Rol, type Estado } from './tipos';
export { normalizarCorreo, crearUsuario } from './alta';
export { buscarUsuarioPorId, buscarUsuarioPorCorreo, contarAdministradoresActivos, listarUsuarios, type FilaUsuario } from './consultas';
export { cambiarRol } from './roles';
export { reactivarUsuario } from './reactivar';
export { marcarBaja } from './baja';
export { privacidadPendiente, aceptarPrivacidad, aceptarPrivacidadPersona } from './privacidad';
export { anotarAuditoria, type AccionAuditoria } from './auditoria';
export { leerMarcasCuenta, marcarCuenta, type ClaveCuenta, type MarcasCuenta } from './preferencias-cuenta';
export { cambiarFoto, leerFotoUsuario } from './fotos';
export { entregarFrase, entregarSaludo, leerSaludoDisponible, INTERVALO_SALUDO_MS } from './frases';
