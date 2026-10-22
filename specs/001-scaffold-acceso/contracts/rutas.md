# Contrato: páginas y *actions* de F1

- **Implementación:** cada *action* es un `<form method="post">` con nombre y `use:enhance`, y funciona sin JavaScript (constitución XVII).
- **Validación:** las entradas se validan con `z.strictObject` de `lib/shared/contratos/` (`usuarios.ts`, `auth.ts`).
- **Rechazo esperado:** se devuelve con `fallo(estado, errorZod, datos)` o con `fail(estado, { errores, valores })`. `valores` nunca contiene contraseñas ni tokens.
- **Entra en EV-050:** toda ruta con sesión (suite `acceso`).
- **Puerta de privacidad:** las rutas marcadas con «Puerta» la atraviesan (research R10).

## Grupo `(auth)`: sin sesión

| Ruta | `load` | *Action* | Entrada | Resultado |
| --- | --- | --- | --- | --- |
| `/login` | Con sesión válida, redirige 303 a `/` | `default` | `email`: `z.email()` normalizado; `contrasena`: texto, 1 a 256 caracteres | Éxito: crea una sesión y redirige 303 a `/`. Rechazo: 400 `VALIDACION` o 401 `CREDENCIALES_INCORRECTAS` con el mensaje único (R7); `valores` = `{ email }` |
| `/acceso/[token=token]` | Comprueba el enlace sin consumirlo: devuelve `{ valido, tipo }` | `default` | `contrasena` y `repeticion`, iguales (`VALIDACION`) | Éxito: hash, enlace usado, sesiones borradas, sesión nueva y redirección 303 a `/aceptar-privacidad` o a `/`. Rechazo: 400 `CONTRASENA_NO_VALIDA` (corta, larga o común) o 410 `ENLACE_NO_VALIDO` |

- **`Cache-Control`:** `/acceso/*` responde con `no-store`.

## Grupo `(gate)`: con sesión y privacidad pendiente

| Ruta | `load` | *Action* | Resultado |
| --- | --- | --- | --- |
| `/aceptar-privacidad` | `{ version, primeraVez }`. Si no hay nada pendiente, redirige 303 a `/` | `aceptar` (sin campos) | Guarda la versión y el instante, y redirige 303 a `/?aviso=privacidad-aceptada` (CA-160; confirmación al final de este documento) |

## `/logout`

| Ruta | *Action* | Resultado |
| --- | --- | --- |
| `/logout` | `default` (POST, sin campos) | Borra la sesión actual y la cookie, y redirige 303 a `/login`. No pasa por la puerta de privacidad |

## Grupo `(app)`: con sesión y puerta

| Ruta | `load` | *Actions* | Permiso |
| --- | --- | --- | --- |
| `/` | Usuario actual | — | Miembro. Estado vacío provisional (R16) |
| `/perfil` | `{ nombre, email, rol }` | `cambiarContrasena`, `cerrarSesionesGlobal` | Miembro |
| `/privacidad` | `{ version, leidaEn }` | — | Miembro (RF-161) |
| `/admin` | Secciones disponibles | — | Administrador |
| `/admin/usuarios` | Lista de usuarios: `id`, `nombre`, `email`, `rol`, `estado` y `tieneContrasena`; aviso de RN-042 si hay un solo administrador activo | `alta` | Administrador + reautenticación en la *action* |
| `/admin/usuarios/[usuarioId=ulid]` | Un usuario | `cambiarRol`, `generarEnlace`, `reactivar` | Administrador + reautenticación en cada *action* |

### Entradas de las *actions* de `(app)`

| *Action* | Campos | Errores |
| --- | --- | --- |
| `cambiarContrasena` | `contrasenaActual`, `contrasenaNueva`, `repeticion` | 400 `VALIDACION`; 400 `CONTRASENA_NO_VALIDA`; 401 `CREDENCIALES_INCORRECTAS` (contraseña actual incorrecta) |
| `cerrarSesionesGlobal` | — | Borra todas las sesiones, también la actual, y redirige 303 a `/login` (CA-137) |
| `alta` | `nombre` (1 a 80), `email`, `rol` (`miembro` \| `administrador`), `contrasenaActual?` | 400 `VALIDACION`; 409 `CORREO_DUPLICADO`; 401 `REAUTENTICACION_REQUERIDA`. Éxito: `{ enlace, expiraEn }` en la respuesta de la *action*, para copiarlo (CA-130, CA-131). El enlace no se guarda en claro ni se vuelve a mostrar |
| `cambiarRol` | `rol`, `contrasenaActual?` | 409 `ULTIMO_ADMIN` (CA-134, EV-040); 401 `REAUTENTICACION_REQUERIDA`; 404 si el usuario no existe |
| `generarEnlace` | `contrasenaActual?` | 409 si el usuario está de baja; 401 `REAUTENTICACION_REQUERIDA`. Éxito: `{ enlace, tipo, expiraEn }` (aclaración 8) |
| `reactivar` | `contrasenaActual?` | 409 si ya está activo; 401 `REAUTENTICACION_REQUERIDA` (CA-136) |

- **`contrasenaActual?`:** solo hace falta si han pasado más de 15 minutos desde la última autenticación (research R9). Si llega y es incorrecta, se devuelve 401 con un error en ese campo.
- **Permisos:** sin sesión, el `load` redirige a `/login` y la *action* responde 401. Con rol miembro, `/admin/*` responde 403 con `error(403, mensaje)` y la *action* responde 403 `SIN_PERMISO`. Lo decide el caso de uso, no el layout (`ARCHITECTURE.md` §7).

## Matchers de parámetros

| Matcher | Acepta |
| --- | --- |
| `src/params/token.ts` | 43 caracteres base64url (`^[A-Za-z0-9_-]{43}$`) |
| `src/params/ulid.ts` | ULID de 26 caracteres en Crockford base32 |

Cualquier otro valor responde 404 sin ejecutar el `load`.

## Estados de cada pantalla (constitución X)

| Pantalla | Vacío | Cargando | Error | Sin conexión |
| --- | --- | --- | --- | --- |
| `/admin/usuarios` | No ocurre: siempre hay al menos un administrador | SSR. Con `use:enhance`, el botón indica que está enviando | `fail` con errores por campo; `+error.svelte` con el `operacionId` | Con JavaScript, aviso «Sin conexión. Esta acción necesita red: vuelve a intentarlo cuando tengas conexión.», sin perder lo escrito. Sin JavaScript, página de error del navegador (excepción de XVII). Las acciones de administración no funcionan sin conexión (EXC-007) |
| `/login`, `/acceso/[token]` | — | Ídem | Mensajes de R7 y R8 | Ídem |
| `/perfil`, `/privacidad`, `/aceptar-privacidad` | — | Ídem | Ídem | Ídem |

## Confirmación de las acciones (constitución X)

`alta`, `cambiarRol`, `generarEnlace`, `reactivar`, `cambiarContrasena` y `aceptar` confirman su resultado con un mensaje anunciado al lector de pantalla:

- **Con JavaScript:** aviso en la región `aria-live="polite"` del contexto de avisos.
- **Sin JavaScript:** `Banner` con `role="status"` pintado a partir de la prop `form` de la *action*. `aceptar` redirige a `/?aviso=privacidad-aceptada`; `/` valida el parámetro con `z.strictObject({ aviso: z.literal('privacidad-aceptada').optional() })` y muestra el mensaje, con JavaScript o sin él.
- **Textos:** en `src/lib/shared/textos.ts`.
