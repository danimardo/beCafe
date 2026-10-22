# Contrato: API sin formulario, `/robots.txt` y comandos de F1

Las respuestas de error son JSON `{ codigo, mensaje }`, con el mensaje en español y sin el valor recibido (`ARCHITECTURE.md` §6).

## `GET /api/salud`

| Aspecto | Valor |
| --- | --- |
| Sesión | No; pública. No pasa por la puerta de privacidad |
| 200 | `{ "estado": "ok", "version": "<__APP_VERSION__>" }` si la base de datos responde a una consulta trivial |
| 503 | `{ "estado": "error" }` si la consulta falla |
| Registro | `debug` (`ARCHITECTURE.md` §9) |
| Sin datos sensibles | Ni el commit ni la ruta de datos ni los errores internos |

## `POST /api/registro-cliente`

| Aspecto | Valor |
| --- | --- |
| Sesión | Obligatoria. Sin sesión: 401 `SIN_SESION`. No pasa por la puerta de privacidad, para que se registren los errores de `/aceptar-privacidad` |
| `Content-Type` | `application/json`. Otro tipo: 415 |
| Tamaño | 16 KiB como máximo. Más: 413 `LIMITE_SUPERADO` (research R14) |
| Frecuencia | 30 eventos por minuto y por sesión como máximo. Más: 429 `LIMITE_SUPERADO` |
| 204 | Eventos aceptados y escritos con `origen: 'cliente'` |
| 400 | `VALIDACION`: clave desconocida, código fuera del catálogo o más de 10 eventos |

**Cuerpo** (`lib/shared/contratos/registro-cliente.ts`, versión 1, constitución XIV):

```text
z.strictObject({
  version: z.literal(1),
  eventos: z.array(EventoCliente).min(1).max(10)
})
EventoCliente = unión discriminada por `codigo` sobre el catálogo de cliente de
`ARCHITECTURE.md` §9 (`cliente.*`, `dato.invalido`), cada una con sus campos permitidos
y `instante: InstanteUtc`.
```

Un cuerpo rechazado genera `cliente.registro_rechazado` (warn) como mucho una vez por minuto y por sesión.

## `GET /robots.txt`

| Aspecto | Valor |
| --- | --- |
| Implementación | `handle` de `src/hooks.server.ts`, antes de `resolve` (research R15). No es un `+server.ts` (constitución XVII) |
| Respuesta | `200 text/plain` con `User-agent: *` y `Disallow: /` (RNF-016) |
| Cabecera | `X-Robots-Tag: noindex, nofollow`, como el resto de respuestas de SvelteKit |

## Cabeceras comunes

`hooks.server.ts` las añade a cada respuesta de SvelteKit (research R15):

| Cabecera | Valor |
| --- | --- |
| `X-Robots-Tag` | `noindex, nofollow` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000` cuando `ORIGIN` usa `https` |
| `Content-Security-Policy` | La genera `kit.csp` |

## Comando de recuperación de administrador (RF-139b)

```text
node build-scripts/recuperar-admin.js --correo <correo> [--nombre <nombre>]
```

| Caso | Resultado | Código de salida |
| --- | --- | --- |
| El correo es de un administrador activo | Enlace de recuperación (1 h) en la salida estándar y auditoría `enlace.generado`, con `origen: 'comando'` | 0 |
| El correo no existe y llega `--nombre` | Crea un administrador activo con invitación (24 h), con auditoría `usuario.alta` + `enlace.generado` | 0 |
| El correo no existe y falta `--nombre` | Mensaje de uso | 2 |
| El correo es de un miembro o de una persona dada de baja | Mensaje de error, sin cambios | 3 |
| El entorno no es válido | Nombres de las variables, sin valores | 1 |

- **Entorno:** el comando lee `DIRECTORIO_DATOS` y `ORIGIN` y los valida con los esquemas de `src/env.ts`.
- **Desarrollo:** `npm run admin:recuperar -- --correo …` empaqueta y ejecuta el comando.

## Comando de siembra de E2E

```text
node build-scripts/sembrar-e2e.js --directorio <ruta temporal>
```

- **Solo para pruebas:** no se incluye en la imagen de producción (F7).
- **Qué crea:**
  - Ana, administradora, con contraseña;
  - Luis, miembro, con contraseña;
  - Pedro, activo, sin contraseña y con invitación.
- **Sin usuarios de baja:** en F1 no existe ninguna función pública de baja. RN-055 se prueba en integración con un constructor de prueba (research R17).
- **Cómo:** con las funciones públicas de los módulos (`docs/pruebas.md` §12.1).
- **Salida:** escribe en la salida estándar un JSON con los enlaces de prueba que necesitan los specs.
