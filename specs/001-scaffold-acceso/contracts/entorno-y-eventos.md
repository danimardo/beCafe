# Contrato: variables de entorno y eventos de registro de F1

## Variables de entorno (`src/env.ts`, `ARCHITECTURE.md` §8)

Todas son dinámicas y privadas. F1 no declara ninguna pública: `VAPID_PUBLIC_KEY` llega en F5.

| Variable | Esquema | Obligatoria | `.env.example` |
| --- | --- | --- | --- |
| `ORIGIN` | `z.url()` con protocolo https, o http solo con el host `localhost` o `127.0.0.1` (aclaración 10) | Sí | `http://localhost:5173` |
| `DIRECTORIO_DATOS` | Texto no vacío | Sí (PEND-036) | `./.local/datos` |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` | No (`info`) | `debug` |
| `ADMIN_INICIAL_EMAIL` | `z.email()` | Solo si no hay usuarios (DEC-104) | `admin@example.com` |
| `ADMIN_INICIAL_NOMBRE` | Texto de 1 a 80 caracteres | Solo si no hay usuarios (aclaración 7) | `Administración` |
| `TZ` | `z.literal('Europe/Madrid')` | Sí | `Europe/Madrid` |

- **Arranque:** una variable obligatoria ausente o no válida impide arrancar y registra `app.entorno_invalido` con los nombres, sin los valores.
- **Pruebas:** no leen `.env`; definen variables efímeras.

## Constantes de compilación (PEND-035)

| Constante | Origen |
| --- | --- |
| `__APP_VERSION__` | `version` de `package.json` |
| `__APP_COMMIT__` | `GIT_COMMIT` al compilar, o `git rev-parse --short HEAD`, o `desconocido` |

## Eventos nuevos o concretados para el catálogo (`ARCHITECTURE.md` §9)

Los campos se limitan a identificadores, códigos, recuentos, duraciones y tamaños (constitución XVI). Ningún evento lleva correos, nombres, contraseñas, tokens ni enlaces.

| Código | Nivel | Campos | Cuándo |
| --- | --- | --- | --- |
| `app.arranque` | info | `version`, `commit`, `node`, `nivelLog` | Al arrancar |
| `app.entorno_invalido` | fatal | `variables` (nombres) | Entorno no válido, o sin usuarios y sin las variables del primer administrador |
| `app.migraciones_aplicadas` | info | `aplicadas` (recuento) | Al arrancar |
| `auth.admin_inicial_creado` | info | `usuarioId` | RF-139. El enlace va solo a la salida estándar, por la instancia aparte |
| `auth.sesion_iniciada` | info | `usuarioId` | Inicio de sesión correcto |
| `auth.sesion_cerrada` | info | `usuarioId`, `alcance` (`actual` \| `todas` \| `otras`) | Cierre de sesión, cierre global o cambio de contraseña |
| `auth.acceso_fallido` | warn | `motivo` (`credenciales` \| `bloqueada` \| `baja` \| `desconocido`), `usuarioId?` | Rechazo de inicio de sesión (R7) |
| `auth.cuenta_bloqueada` | warn | `usuarioId` | Quinto fallo seguido (RN-048) |
| `auth.enlace_generado` | info | `usuarioId`, `tipo`, `origen` | RF-131, RF-139, RF-139b |
| `auth.enlace_usado` | info | `usuarioId`, `tipo` | RF-132 |
| `auth.enlace_rechazado` | info | `motivo` (`usado` \| `caducado` \| `anulado` \| `desconocido`) | CA-132 |
| `auth.contrasena_cambiada` | info | `usuarioId`, `via` (`enlace` \| `perfil`) | RF-132, RF-137 |
| `auth.reautenticacion` | info | `usuarioId`, `resultado` (`ok` \| `fallida`) | RN-050 |
| `auth.permiso_denegado` | warn | `usuarioId`, `rutaId` | SIN_PERMISO |
| `usuario.alta` | info | `usuarioId`, `rol` | RF-130 |
| `usuario.rol_cambiado` | info | `usuarioId`, `rolNuevo` | RF-134 |
| `usuario.reactivado` | info | `usuarioId` | RF-136 |
| `privacidad.aceptada` | info | `usuarioId`, `version` | RF-160 |
| `operacion.rechazada` | info | `codigo` | `ErrorDeNegocio` (en `warn` si el código es `SIN_PERMISO`) |
| `peticion.completada` | info | `metodo`, `rutaId`, `estado`, `duracionMs` | Cada petición |
| `dato.invalido` | error | `origen`, `id?`, `campo`, `incidencia` | Configuración, auditoría o `localStorage` no válidos |
| `cliente.registro_rechazado` | warn | `motivo` (`tamano` \| `frecuencia` \| `esquema`) | `/api/registro-cliente` |

**Pruebas:**
- `crearRegistroFalso()` comprueba el código y los campos de cada evento esperado, y falla si un evento contiene una clave prohibida o un valor con forma de correo.
- Una prueba de integración de CA-139 comprueba que el fichero de log no contiene el enlace y que la salida estándar sí lo contiene.
