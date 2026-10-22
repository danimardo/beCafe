# Data Model: Preparación del proyecto y acceso (F1)

Convenciones (constitución IV y V, `historias.md` §10.4):
- Las claves primarias son ULID en texto.
- Los instantes se guardan en UTC, en formato ISO 8601 (`InstanteUtc`).
- Las tablas viven en el `esquema.ts` de su módulo dueño.
- El esquema solo cambia con migraciones que añaden (principio XIV).

## Tablas

### `usuario` (módulo `usuarios`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT PK | ULID |
| `nombre` | TEXT NOT NULL | 1 a 80 caracteres, sin espacios al principio ni al final |
| `email` | TEXT NOT NULL UNIQUE | Se guarda en minúsculas y sin espacios. El índice único impide duplicados (`CORREO_DUPLICADO`) |
| `rol` | TEXT NOT NULL | CHECK `IN ('miembro', 'administrador')` (RN-040) |
| `estado` | TEXT NOT NULL | CHECK `IN ('activo', 'baja')` |
| `privacidad_version` | INTEGER NULL | Última versión del texto leída (RF-160) |
| `privacidad_leida_en` | TEXT NULL | Instante de esa lectura |
| `creado_en` | TEXT NOT NULL | — |
| `baja_en` | TEXT NULL | La escribe F4 (RF-135) |

- **Índice:** `(rol, estado)`, para contar los administradores activos (INV-03).
- **Sin columna de saldo:** el saldo se deriva del libro de movimientos (RN-010, F4).

### `registro_auditoria` (módulo `usuarios`, RF-139c)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT PK | ULID |
| `actor_id` | TEXT NULL → `usuario.id` | NULL si actúa el sistema (primer administrador) o el operador (comando de RF-139b) |
| `accion` | TEXT NOT NULL | Valor del catálogo cerrado (abajo) |
| `objeto_tipo` | TEXT NOT NULL | `usuario` en F1 |
| `objeto_id` | TEXT NOT NULL | — |
| `detalle` | TEXT NOT NULL | JSON validado con el esquema de la acción, al escribirlo y al leerlo |
| `creado_en` | TEXT NOT NULL | — |

- **Índice:** `(objeto_tipo, objeto_id)`.
- **Las filas no se modifican ni se borran.**

**Catálogo de acciones de F1:**

| `accion` | `detalle` |
| --- | --- |
| `usuario.alta` | `{ rol }` |
| `usuario.rol_cambiado` | `{ rolAnterior, rolNuevo }` |
| `usuario.reactivado` | `{}` |
| `enlace.generado` | `{ tipo: 'invitacion' \| 'recuperacion', origen: 'aplicacion' \| 'arranque' \| 'comando' }` |

- **F4** añade `usuario.baja` y **F7** añade `configuracion.cambiada`.
- **Sin datos personales en `detalle`:** ni nombres, ni correos, ni tokens. El nombre del autor se obtiene de `actor_id`.

### `credencial` (módulo `auth`, tabla nueva respecto a `historias.md` §10.4; research R11)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `usuario_id` | TEXT PK → `usuario.id` | Una fila por usuario con contraseña. Sin fila, el usuario no tiene contraseña |
| `hash` | TEXT NOT NULL | Argon2id, formato PHC (RNF-004) |
| `intentos_fallidos` | INTEGER NOT NULL DEFAULT 0 | CHECK ≥ 0 (RN-048) |
| `bloqueado_hasta` | TEXT NULL | Fin del bloqueo |
| `actualizada_en` | TEXT NOT NULL | — |

- La reactivación borra la fila (aclaración 8).
- **Relación con la spec:** la entidad Usuario de la spec incluye los intentos fallidos y el bloqueo. En el diseño viven en esta tabla para que `auth` no escriba en la tabla de `usuarios` (research R11).

### `sesion` (módulo `auth`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id_hash` | TEXT PK | SHA-256 del identificador de la cookie, en hexadecimal (RNF-005) |
| `usuario_id` | TEXT NOT NULL → `usuario.id` | Índice |
| `creada_en` | TEXT NOT NULL | — |
| `ultimo_uso_en` | TEXT NOT NULL | Se actualiza como mucho una vez por hora (research R5) |
| `ultima_autenticacion_en` | TEXT NOT NULL | Para RN-050 |

- **Caducidad:** se calcula como `ultimo_uso_en` + 90 días (RN-049). No se guarda, para que no haya dos fuentes.
- **Limpieza:** las sesiones caducadas se ignoran al leer. Su limpieza periódica no entra en F1: no hay planificador hasta F5.

### `enlace_acceso` (módulo `auth`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | TEXT PK | ULID |
| `usuario_id` | TEXT NOT NULL → `usuario.id` | — |
| `tipo` | TEXT NOT NULL | CHECK `IN ('invitacion', 'recuperacion')` |
| `token_hash` | TEXT NOT NULL UNIQUE | SHA-256 del token |
| `expira_en` | TEXT NOT NULL | Invitación: creación + 24 h. Recuperación: creación + 1 h (RN-052) |
| `usado_en` | TEXT NULL | — |
| `anulado_en` | TEXT NULL | Se rellena al generar otro enlace para el mismo usuario |
| `creado_por` | TEXT NULL → `usuario.id` | NULL si lo genera el arranque o el comando |
| `creado_en` | TEXT NOT NULL | — |

- **Índice:** `(usuario_id)`.
- **Enlace válido:** `usado_en IS NULL`, `anulado_en IS NULL` y `expira_en` posterior al instante actual.

### `configuracion` (módulo `configuracion`)

| Columna | Tipo | Regla |
| --- | --- | --- |
| `clave` | TEXT PK | `plazo_autoanulacion_min`, `limite_deuda_centimos` o `intervalo_rellenos_min` |
| `valor` | TEXT NOT NULL | JSON validado con el esquema de la clave |
| `modificado_por` | TEXT NOT NULL → `usuario.id` | — |
| `modificado_en` | TEXT NOT NULL | — |

**Sin fila, se usa el valor por defecto.** F1 no escribe filas; la pantalla y la escritura son de F7.

| Parámetro | Valor por defecto | Fuente |
| --- | --- | --- |
| Plazo de autoanulación | 15 minutos | RN-032 |
| Límite de deuda | −500 céntimos (−5 €) | RN-074 |
| Intervalo mínimo entre rellenos | 60 minutos | RN-082 |

- **Valor inválido:** si un valor guardado no supera su esquema, se registra `dato.invalido` y se usa el valor por defecto.

## Transiciones de estado

**Usuario** (`historias.md` §6.6):

| Estado previo | Acción | Condición | Estado resultante | Efectos en F1 |
| --- | --- | --- | --- | --- |
| — | Alta | Administrador reautenticado (RN-043, RN-050) | `activo`, sin `credencial` | Enlace de invitación y auditoría `usuario.alta` + `enlace.generado` |
| `activo` | Cambiar rol | Administrador reautenticado. No deja el sistema sin administrador activo (RN-041) | `activo` | Auditoría `usuario.rol_cambiado` |
| `baja` | Reactivar | Administrador reautenticado | `activo` | Borra `credencial`, anula enlaces y sesiones, y anota `usuario.reactivado`. Después, el administrador genera una invitación |
| `activo` | Baja | F4 (RF-135) | `baja` | — |

**Credencial:**

| Estado | Evento | Resultado |
| --- | --- | --- |
| Sin fila | Contraseña definida con un enlace válido | Fila con `intentos_fallidos = 0` |
| Normal | Fallo n.º 1 a 4 | `intentos_fallidos + 1` |
| Normal | Fallo n.º 5 | `bloqueado_hasta` = instante del fallo + 15 min |
| Bloqueada | Cualquier intento antes de `bloqueado_hasta` | Rechazo. Nada cambia |
| Bloqueada | Primer intento después de `bloqueado_hasta` | El contador vuelve a 0 y se evalúa el intento |
| Cualquiera | Inicio de sesión correcto | `intentos_fallidos = 0`, `bloqueado_hasta = NULL` |
| Cualquiera | Contraseña restablecida (enlace) o cambiada (perfil) | Hash nuevo y contador a 0 |

**Enlace:** `válido` → `usado` (al definir la contraseña), `anulado` (al generar otro) o `caducado` (por el tiempo). Ningún enlace vuelve a ser válido.

## Invariantes y su mecanismo

| Regla | Mecanismo | Prueba |
| --- | --- | --- |
| INV-03 / RN-041 | Cuenta dentro de `BEGIN IMMEDIATE` en `usuarios.cambiarRol` y en `usuarios.marcarBaja` (F4) | CA-134, EV-040 |
| Correo único | Índice `UNIQUE` sobre el correo normalizado | Integración |
| Un solo enlace válido por usuario (RN-052) | Anulación de los anteriores en la misma transacción | CA-132 |
| Sesión válida solo para un usuario activo | `hooks.server.ts` comprueba `usuario.estado`; RN-051 borra las sesiones | CA-137, RN-055 |
| Sin secretos en claro | Solo se guardan hashes del identificador de sesión, del token y de la contraseña | Inspección + integración |

## Datos del navegador

| Clave de `localStorage` | Valores | Por defecto | Esquema |
| --- | --- | --- | --- |
| `becafe-tema` | `auto` \| `claro` \| `oscuro` | `auto` | `lib/shared/contratos/apariencia.ts` |
| `becafe-transparencia` | `normal` \| `reducida` | `normal` | Ídem |
