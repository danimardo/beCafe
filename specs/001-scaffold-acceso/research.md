# Research: Preparación del proyecto y acceso (F1)

Decisiones técnicas del plan de F1. Cada decisión indica qué se elige, por qué y qué se descartó. Las reglas de negocio vienen de la spec; aquí solo se decide **cómo** se cumplen. Las APIs de SvelteKit 3 marcadas con «verificar en el scaffold» se comprueban contra el paquete instalado antes de escribir código que dependa de ellas, porque en la preparación no se instalan dependencias.

## R1. Traslado de la plantilla a la raíz (DEC-055)

- **Decisión:** `git mv` de `design-system/` a la raíz, con estos destinos:

  | Origen en `design-system/` | Destino |
  | --- | --- |
  | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json` | Raíz (se fusionan con lo nuevo de F1) |
  | `src/app.*`, `src/routes/+layout.svelte`, `src/routes/+error.svelte` | `src/` (se adaptan) |
  | `src/lib/components/*` | `src/lib/ui/*`, exportado en `src/lib/ui/index.ts` (`ARCHITECTURE.md` §2) |
  | `src/lib/utils.ts` | `formatMoney`, `parseMoney`, `formatDate` e `initials` van a `src/lib/shared/`; `cn` y `buttonClasses`, a `src/lib/ui/utils.ts` |
  | `src/lib/movements.ts` | `src/lib/ui/movimientos.ts` (solo orienta a la interfaz; decide el servidor) |
  | `tokens/`, `static/`, `scripts/generate-tokens.mjs` | Raíz |
  | `docs/` | `docs/diseno/` |
  | `AGENTS.md` («Reglas obligatorias» y mapa) | Se integra en `docs/diseno/README.md` (`docs/agentes.md` §8) |
  | `design/` y `scripts/generate-pwa-assets.py` | `docs/diseno/recursos/` (fuentes de marca; no forman parte del flujo npm) |
  | `README.md` | Se fusiona con un `README.md` nuevo en la raíz |

- **Pantallas de otras funcionalidades** (`/`, `/compras`, `/saldos`, `/historial`, `/estadisticas`, `/ayuda`, `/admin/capsulas`, `/admin/control`, `/admin/configuracion`, `/admin/copias`, `/componentes`, `/errores/[tipo]`, `/offline`) y `src/lib/mock.ts`: **se retiran** de `src/`. Siguen en el historial de Git. `docs/diseno/README.md` anota el commit anterior al traslado para recuperarlas con `git show <commit>:design-system/src/routes/...` cuando las implemente su funcionalidad.
- **Motivo:** una pantalla con datos de ejemplo no puede servirse en producción. Guardar `.svelte` fuera de `src/` obligaría a excluirlos de ESLint y Prettier, y la constitución VII prohíbe saltarse una regla excluyendo archivos.
- **Descartado:**
  - Dejar las pantallas con `mock.ts`: se servirían datos falsos y rutas sin permisos.
  - Copiarlas a `docs/`: archivos sin comprobar y exclusiones de herramientas.
- `src/tokens.css` se genera (`npm run tokens`) y pasa a `.gitignore`. Prettier 3 respeta `.gitignore`, así que no hace falta excluirlo.

## R2. Alias de importación y frontera de los módulos

- **Decisión:** `package.json` → `imports`:
  - `#lib/ui` → `./src/lib/ui/index.ts`
  - `#lib/server/*` → `./src/lib/server/*/index.ts`
  - `#lib/shared/*` y `#lib/client/*` → sus archivos
- **Motivo:** con `#lib/server/*` apuntando solo a `index.ts`, un import profundo (`#lib/server/economia/esquema`) no se resuelve. La frontera del §4 queda impedida por el resolvedor, además de por dependency-cruiser. Dentro de un módulo se usan rutas relativas.
- **Verificar en el scaffold:** la resolución de patrones con extensión `.ts` en Vite, `svelte-check` y Vitest. Si un patrón no resuelve, se ajusta el mapa sin perder la regla.
- **Descartado:** un único `#lib/*` genérico, como en la plantilla, porque permite imports profundos.

## R3. Estado global de la plantilla

- **Problema:** `theme.svelte.ts`, `toast.svelte.ts` y `notifications.svelte.ts` exportan instancias con `$state` a nivel de módulo. `AGENTS.md` §6 y `ARCHITECTURE.md` §7 lo prohíben: en el servidor ese estado lo comparten todas las peticiones.
- **Decisión:** cada uno pasa a ser una clase que crea el layout raíz y comparte con `setContext`/`getContext`, mediante funciones `crearContexto…()` y `usar…()` en `src/lib/ui/`. `ThemeToggle`, `ToastRegion` y los componentes de avisos leen el contexto.
- `NotificationBell` y `NotificationPanel` se conservan en `lib/ui`, pero F1 no los pinta, porque los avisos son de F5. `AppShell` acepta la campana como propiedad opcional.

## R4. Preferencias de apariencia (RF-180, RF-181)

- **Decisión:**
  - Dos claves en `localStorage`:
    - `becafe-tema`: `auto` | `claro` | `oscuro`;
    - `becafe-transparencia`: `normal` | `reducida`.
  - Un esquema Zod en `lib/shared/contratos/apariencia.ts` valida la lectura. Un valor inválido vuelve al valor por defecto y registra `dato.invalido` en el cliente, sin el valor (`ARCHITECTURE.md` §9).
  - El script en línea de `src/app.html` aplica `data-theme` y `data-transparencia` antes de pintar. Solo acepta la lista cerrada de valores y lleva `nonce="%sveltekit.nonce%"` para la CSP (R15).
  - `app.css` trata `[data-transparencia="reducida"]` igual que `@media (prefers-reduced-transparency: reduce)`. El ajuste solo añade opacidad; nunca quita la del sistema (constitución XVIII).
  - «Automático» escucha `matchMedia('(prefers-color-scheme: dark)')` y cambia sin recargar. Como solo cambia un atributo de `<html>`, no se pierden el texto escrito ni el foco (CA-180).
- **Motivo:** DEC-095 y DEC-099 guardan las preferencias en el dispositivo. La clave `capsulas-tema` de la plantilla se renombra para que coincida con el nombre del producto (RT-011). Como todavía no hay usuarios, no hace falta migrar valores.
- **Descartado:** guardarlas en una cookie, que viajaría al servidor y lo obligaría a depender de ellas en el SSR (`ARCHITECTURE.md` §7).

## R5. Sesiones (RN-049, RN-051, RNF-005)

- **Decisión:**
  - **Identificador:** 32 bytes aleatorios de `crypto.getRandomValues`, en base64url, en la cookie `becafe_sesion`. La tabla `sesion` guarda solo su SHA-256 (`id_hash`).
  - **Cookie:** `HttpOnly`, `SameSite=Lax`, `Path=/` y `Max-Age` de 90 días. Lleva `Secure` cuando `ORIGIN` usa `https` (aclaración 10). El esquema de `ORIGIN` solo admite http con el host `localhost` o `127.0.0.1`; cualquier otro `ORIGIN` http impide arrancar, así que en producción la cookie siempre lleva `Secure`.
  - **Renovación (RN-049):** la caducidad es `ultimo_uso_en` + 90 días. `hooks.server.ts` actualiza `ultimo_uso_en` y la cookie como mucho una vez por hora y por sesión. Así una sesión caduca entre 90 días y 90 días más 1 hora después del último uso, nunca antes, y no se escribe en la base de datos en cada petición.
  - **Inicio de sesión:** crea siempre una sesión nueva, para evitar la fijación de sesión. El cierre de sesión borra la fila.
  - **Invalidación (RN-051):** se borran todas las filas del usuario cuando restablece la contraseña con un enlace, cuando pulsa «Cerrar sesión en todos los dispositivos» o cuando se le da de baja (F4).
  - **Cambio de contraseña desde el perfil (aclaración 9):** borra todas las sesiones salvo la actual.
  - **Usuario no activo:** `hooks.server.ts` descarta la sesión de un usuario que no está activo, como defensa además de RN-051.
- **Motivo:** guardar el hash impide que una copia de la base de datos permita suplantar a nadie (RNF-005). El atributo `Secure` depende de `ORIGIN` porque WebKit, en Linux, no acepta cookies `Secure` en `http://localhost`, y las E2E se ejecutan sobre la build local.
- **Descartado:**
  - Sesiones firmadas sin estado (JWT): no permiten invalidar sesiones (RN-051).
  - Escribir `ultimo_uso_en` en cada petición: una escritura serializada por petición sin ninguna ventaja.

## R6. Contraseñas (RN-047, RN-053, RNF-004)

- **Decisión:**
  - **Algoritmo:** Argon2id con `@node-rs/argon2`, con m = 19 456 KiB, t = 2 y p = 1, en formato PHC. Lo aísla `auth/contrasenas.ts` (`ARCHITECTURE.md` §11). Su coste por verificación se mide al implementarlo; no se fija antes.
  - **Validación:**
    - longitud mínima de 15 caracteres, contados como puntos de código Unicode tras normalizar a NFC;
    - longitud máxima de 256 caracteres, para limitar el coste de Argon2;
    - sin reglas de composición.
  - **Lista de bloqueo (RN-053, FUENTE-02):** `auth/contrasenas-comunes.txt`. Se genera una vez con un script a partir de la lista pública «10-million-password-list-top-1000000» de SecLists (licencia MIT), con las entradas de 15 caracteres o más. Se compara en minúsculas y en NFC. El script y la fuente se documentan en el propio archivo, para poder regenerarlo.
  - **Correo inexistente (RF-133):** se ejecuta igualmente una verificación con un hash de referencia. Así el tiempo de respuesta no revela si el correo existe.
- **Motivo:** NIST SP 800-63B-4 (FUENTE-02) pide comprobar una lista de contraseñas comunes, sin reglas de composición. Una lista filtrada por longitud es pequeña, se carga una vez y no necesita red.
- **Descartado:**
  - Consultar Have I Been Pwned: dependencia externa y envío de datos derivados de la contraseña.
  - Comprobar la lista en el cliente: la plantilla lo hacía con cinco ejemplos, pero la regla se comprueba en el servidor (constitución VI).

## R7. Bloqueo por intentos fallidos (RN-048, CA-133, RN-055)

- **Decisión:**
  - **Contador:** `intentos_fallidos` y `bloqueado_hasta`, por cuenta, en la tabla `credencial` (R11).
  - **Bloqueo:** el quinto fallo seguido fija `bloqueado_hasta` en el instante del fallo más 15 minutos. Mientras dura, se rechaza cualquier intento, también uno correcto, y no se alarga el bloqueo.
  - **Fin del bloqueo:** un inicio de sesión correcto, o el primer intento después de que termine el bloqueo, pone el contador a 0.
  - **Mensaje único:** el mismo para un correo inexistente, una contraseña incorrecta, una cuenta bloqueada y un usuario dado de baja: «Correo o contraseña incorrectos. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.» Los fallos con un correo inexistente no se cuentan.
  - **Registro técnico:** `auth.acceso_fallido` (warn) lleva el motivo interno (`credenciales`, `bloqueada`, `baja`, `desconocido`), sin el correo.
- **Motivo:** la plantilla proponía un aviso distinto, «Acceso bloqueado temporalmente». Ese aviso solo aparece en cuentas que existen, así que revela el correo con cinco intentos, en contra de CA-133. Con un único mensaje, la persona sigue sabiendo que existe la regla del bloqueo.
- **Descartado:** contar también los intentos de correos inexistentes, porque obliga a guardar datos de correos que no son de nadie.

## R8. Enlaces de acceso (RN-052, RF-131, RF-132)

- **Decisión:**
  - **Token:** 32 bytes aleatorios en base64url. La tabla `enlace_acceso` guarda su SHA-256.
  - **URL:** `ORIGIN` + `/acceso/<token>`. El matcher `src/params/token.ts` acepta solo 43 caracteres base64url; cualquier otro valor responde 404.
  - **Tipo (aclaración 8):** sin contraseña, invitación de 24 horas; con contraseña, recuperación de 1 hora.
  - **Anulación:** generar un enlace marca `anulado_en` en los enlaces sin usar del mismo usuario, en la misma transacción.
  - **Uso:**
    - Al abrir el enlace (`GET`) solo se comprueba que es válido; el enlace no se consume.
    - Al enviar la contraseña (`POST`), en una transacción:
      - se comprueba que el enlace sigue válido;
      - se valida RN-053 y se guarda el hash;
      - se marca el enlace como usado;
      - se borran todas las sesiones del usuario (RN-051);
      - se crea una sesión nueva;
      - se redirige a `/aceptar-privacidad` o a `/`.
  - **Enlace no válido:** un enlace usado, caducado, anulado o inexistente muestra «Enlace no válido o caducado» (CA-132).
  - **Cabeceras:** las respuestas de `/acceso/*` llevan `Cache-Control: no-store`. Toda la aplicación usa `Referrer-Policy: strict-origin`: el `Referer` lleva solo el origen, nunca la ruta, así que el token de `/acceso/*` no sale en la cabecera. Con `no-referrer`, Chromium envía `Origin: null` en los POST sin JavaScript y SvelteKit los rechaza (403, principio XVII).
- **Motivo:** los clientes de correo y mensajería abren los enlaces para generar vistas previas. Si un `GET` consumiera el enlace, llegaría gastado a la persona.

## R9. Reautenticación de administrador (RN-050, RF-138) sin JavaScript

- **Decisión:**
  - **Límite:** `sesion.ultima_autenticacion_en` se fija al iniciar sesión, al definir la contraseña y al reautenticarse. Cada caso de uso de administración recibe `actor.autenticadoEn` y lo compara con el reloj. Con 15 minutos exactos se permite la acción; con más, se rechaza con `REAUTENTICACION_REQUERIDA`.
  - **Formulario:** cada formulario de administración acepta un campo opcional `contrasenaActual`. Si la reautenticación hace falta y el campo no llega, la *action* devuelve `fail(401, { codigo: 'REAUTENTICACION_REQUERIDA', valores })` sin la contraseña.
  - **Con JavaScript:** `ReauthDialog` pide la contraseña y reenvía el mismo formulario con el campo.
  - **Sin JavaScript:** la página vuelve a mostrarse con el campo de contraseña dentro del mismo formulario.
  - **Contraseña correcta:** en la misma petición se actualiza `ultima_autenticacion_en` y se ejecuta la acción.
  - **Contraseña incorrecta:** se devuelve un error de campo. No cuenta para el bloqueo de RN-048, que solo trata del inicio de sesión.
- **Motivo:** la constitución XVII exige que cada *action* funcione sin JavaScript. Un diálogo que verifica la contraseña aparte necesitaría un endpoint JSON, que la constitución prohíbe para formularios.

## R10. Puerta del texto de privacidad (RF-160)

- **Decisión:**
  - **Versión vigente:** la constante `VERSION_PRIVACIDAD = 1` y el texto del anexo A están en `lib/shared/privacidad.ts` y en `PrivacyText`.
  - **Comprobación:** `hooks.server.ts`, después de resolver la sesión, comprueba `usuario.privacidad_version` contra la versión vigente.
  - **Si está pendiente:**
    - un `GET` de página redirige con 303 a `/aceptar-privacidad`;
    - cualquier otro método o un `/api/*` responde 403 con `PRIVACIDAD_PENDIENTE`.
  - **Rutas que no pasan por la puerta:** `/aceptar-privacidad`, `/logout`, `/api/salud`, `/api/registro-cliente` y `/robots.txt`.
  - **Aceptar:** la *action* de `/aceptar-privacidad` guarda la versión y el instante y redirige a `/`.
- **Motivo:** una *action* POST no ejecuta los `load` del layout. Una puerta en `+layout.server.ts` dejaría usar las *actions* sin leer el texto. La puerta no es una autorización: el permiso sigue en cada caso de uso.
- **Cambio de arquitectura:** `ARCHITECTURE.md` §7 dice que `hooks.server.ts` «solo resuelve la sesión». Se amplía con esta puerta y se añade `PRIVACIDAD_PENDIENTE` a los códigos del §6.
- **Rutas:** se mantienen `/aceptar-privacidad`, la pantalla que bloquea (RF-160), y `/privacidad`, la de consulta (RF-161), como en el diseño. Sustituyen a la ruta única `/privacidad` que proponía `historias.md` §10.5, porque la página que bloquea no lleva navegación y la de consulta sí.

## R11. Módulos, tablas y transacciones

- **Decisión:**

  | Módulo | Responsabilidad en F1 | Tablas |
  | --- | --- | --- |
  | `plataforma` | `enTransaccion`, conexión, migraciones, entorno, registro, reloj, ULID, `ErrorDeNegocio`, limitador en memoria | — |
  | `configuracion` | Leer los parámetros con sus valores por defecto | `configuracion` |
  | `usuarios` | Datos de la persona, rol e INV-03, estado, privacidad, auditoría | `usuario`, `registro_auditoria` |
  | `auth` | Credenciales, sesiones, enlaces, bloqueo, reautenticación. Coordina los casos que mezclan identidad y credenciales (alta con invitación, reactivación, primer administrador) | `credencial` (nueva), `sesion`, `enlace_acceso` |

- **Tabla nueva `credencial`:** guarda el hash, los intentos y el bloqueo, fuera de `usuario`. `historias.md` §10.4 los ponía en `usuario`, pero esa tabla es de `usuarios` y `auth` tendría que escribir en una tabla ajena en cada inicio de sesión (`AGENTS.md` §5).
- **Grafo:** sin aristas nuevas. Solo `auth → usuarios`, que ya existe en el §4.
- **Coordinación:** el alta con invitación, la reactivación y el primer administrador necesitan las dos partes. Los coordina `auth`, que llama a `usuarios.*(tx, …)` dentro de su transacción (`ARCHITECTURE.md` §5).
- **INV-03 y EV-040:** `usuarios.cambiarRol` cuenta los administradores activos dentro de `BEGIN IMMEDIATE` y rechaza con `ULTIMO_ADMIN`. Las transacciones `IMMEDIATE` se ejecutan en serie, así que de dos cambios simultáneos solo uno puede ver un segundo administrador.
- **RF-139c:** `usuarios.anotarAuditoria(tx, …)` se llama en la misma transacción que la acción. `detalle` es un JSON validado con un esquema por acción, que solo contiene identificadores, roles y el tipo de enlace.
- **Cambios en `ARCHITECTURE.md`** (en el lote correspondiente):
  - §3: se añade `credencial` a `auth` y la coordinación anterior;
  - §6: se añaden los códigos nuevos (R12);
  - §9: se añaden los eventos nuevos (`contracts/entorno-y-eventos.md`).

## R12. Errores esperados nuevos

Se añaden al conjunto cerrado del §6:

| Código | Para qué |
| --- | --- |
| `CREDENCIALES_INCORRECTAS` | Inicio de sesión rechazado (mensaje único de R7) |
| `ENLACE_NO_VALIDO` | Enlace usado, caducado, anulado o inexistente |
| `CONTRASENA_NO_VALIDA` | RN-053: corta, larga o en la lista de bloqueo |
| `CORREO_DUPLICADO` | Alta con un correo que ya existe |
| `PRIVACIDAD_PENDIENTE` | Puerta de RF-160 (R10) |
| `LIMITE_SUPERADO` | Límites de `/api/registro-cliente` (R14) |

Se reutilizan `SIN_SESION`, `SIN_PERMISO`, `VALIDACION`, `REAUTENTICACION_REQUERIDA` y `ULTIMO_ADMIN`.

## R13. Primer administrador y comando de recuperación (RF-139, RF-139b)

- **Decisión:**
  - **`arranque.ts`:** aplica las migraciones. Si no hay usuarios, valida `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_NOMBRE`. Si falta alguna, registra `app.entorno_invalido` (fatal) con los nombres y termina el proceso con código 1 (DEC-104). Si están las dos, crea el administrador y su invitación en una transacción. Después escribe `auth.admin_inicial_creado` en el registro normal, sin el enlace, y el enlace con la instancia de pino que solo va a la salida estándar (`ARCHITECTURE.md` §9).
  - **Esquema de las variables:** las dos son `z.email().optional()` y `z.string().trim().min(1).max(80).optional()` en `src/env.ts`. La obligación condicionada la comprueba `arranque.ts`, porque depende de la base de datos.
  - **Comando de RF-139b:** `scripts/servidor/recuperar-admin.ts`. Vite lo empaqueta (`vite build --ssr`) en `build-scripts/recuperar-admin.js` con el mismo código de los módulos, dejando `better-sqlite3` y `@node-rs/argon2` como externos.
    - Uso: `node build-scripts/recuperar-admin.js --correo <correo> [--nombre <nombre>]`.
    - Con un administrador existente, genera un enlace de recuperación. Con un correo nuevo y `--nombre`, crea un administrador con invitación.
    - Escribe el enlace en la salida estándar de la terminal. Anota la acción en la auditoría con autor nulo («operador»).
    - Lee `process.env` y lo valida con los esquemas que exporta `src/env.ts` (`ARCHITECTURE.md` §8).
- **Motivo:** el comando necesita la misma lógica que la aplicación. Vite ya es una dependencia, así que empaquetarlo no añade herramientas. Los módulos no importan `$app/*`: reciben la configuración como parámetros desde `arranque.ts` o desde el comando.
- **Descartado:**
  - `tsx` o `ts-node`: dependencia nueva solo para esto.
  - Un endpoint de recuperación: una superficie de ataque expuesta a internet.
- **Verificar en el scaffold:** `defineEnvVars`, `$app/env/private` y la importación de los esquemas desde fuera de SvelteKit.

## R14. Registro técnico (RNF-014, PEND-034 a PEND-036)

- **PEND-034, límites de `/api/registro-cliente`:**
  - cuerpo de 16 KiB como máximo; si lo supera, 413;
  - 10 eventos por cuerpo como máximo;
  - 30 eventos por minuto y por sesión como máximo; si se superan, 429 `LIMITE_SUPERADO`.
  - El contador está en `plataforma/limitador.ts`, un recurso de proceso (excepción de `ARCHITECTURE.md` §7), con ventana fija de 60 s. Es válido porque hay una sola instancia (RT-010).
  - Un rechazo registra `cliente.registro_rechazado` como mucho una vez por minuto y por sesión, para que el registro no se inunde.
  - Son valores técnicos de partida: se revisan con los datos del benchmark (`docs/pruebas.md` §17.3).
- **PEND-035, versión y commit:**
  - `vite.config.ts` define `__APP_VERSION__` (de `package.json`) y `__APP_COMMIT__`. El commit sale de la variable de compilación `GIT_COMMIT`; si no existe, de `git rev-parse --short HEAD`; y si falla, vale `desconocido`.
  - Se declaran en `src/app.d.ts`. No son secretos.
  - La imagen de F7 pasa `GIT_COMMIT` como argumento de compilación.
- **PEND-036, directorio de datos:**
  - La variable `DIRECTORIO_DATOS` es obligatoria y no tiene valor por defecto: `/data` en producción y `./.local/datos` en `.env.example`, que ya está en `.gitignore`.
  - La base de datos va en `<DIRECTORIO_DATOS>/becafe.db` y los logs en `<DIRECTORIO_DATOS>/logs/`. Las pruebas usan un directorio temporal.
  - Al ser obligatoria, nunca se escribe por error en una ruta inesperada.
- **Correlación:** `AsyncLocalStorage` con un ULID por petición (`ARCHITECTURE.md` §9).
- **Cliente:** `lib/client/registro.ts` usa `loglevel` con `setDefaultLevel` y envía los `warn` y `error` en lotes con `fetch` a `/api/registro-cliente`. Es una excepción permitida: no es un formulario, sino un cliente sin formulario (constitución XVII).

## R15. Cabeceras, CSP e indexación (RNF-006, RNF-016)

- **CSP:** `kit.csp` en modo `auto`, con nonce para los scripts de SvelteKit y para el script de tema de `app.html` (`%sveltekit.nonce%`). Directivas:

  | Directiva | Valor |
  | --- | --- |
  | `default-src` | `'self'` |
  | `script-src` | `'self'` y el nonce |
  | `style-src` | `'self' 'unsafe-inline'` |
  | `img-src` | `'self' data: blob:` |
  | `font-src`, `connect-src`, `manifest-src`, `worker-src`, `base-uri`, `form-action` | `'self'` |
  | `object-src` | `'none'` |
  | `frame-ancestors` | `'none'` |

  `style-src` necesita `'unsafe-inline'` porque Svelte y Bits UI escriben atributos `style`. Se revisa si el riesgo cambia.
- **Otras cabeceras** (en `handle` de `hooks.server.ts`):
  - `X-Robots-Tag: noindex, nofollow`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin`
  - `Permissions-Policy` vacía para cámara, micrófono y geolocalización
  - `Strict-Transport-Security` cuando `ORIGIN` usa `https`
- **CSRF (RNF-006):** la comprobación de origen de SvelteKit queda activa, sin orígenes de confianza adicionales. Una prueba envía un POST desde otro origen y espera 403.
- **`/robots.txt`:** lo responde `handle` de `hooks.server.ts` antes de llamar a `resolve`, con `200 text/plain`, `User-agent: *` y `Disallow: /`, y las mismas cabeceras que el resto de respuestas. Se borra el `static/robots.txt` de la plantilla, que permitía indexar todo.
  - **Descartado:** un `src/routes/robots.txt/+server.ts`, porque la constitución XVII solo permite `+server.ts` para la cola sin conexión, la suscripción push, el registro del cliente y la salud; y un archivo estático, porque no llevaría `X-Robots-Tag`.
- **Límite conocido de RNF-016:** `adapter-node` sirve los recursos estáticos (iconos y JS/CSS compilados) antes de `hooks.server.ts`. Esas respuestas no llevan `X-Robots-Tag`. Las páginas, `/robots.txt`, las fotos (F2, servidas por una ruta) y la API sí la llevan. `/robots.txt` ya pide a los buscadores que no indexen nada.
  - **Alternativa:** un servidor propio que envuelva `build/handler.js` con `node:http` y añada la cabecera a todas las respuestas. No necesita dependencias, pero obliga a repetir lo que ya hace `adapter-node` (`PORT`, `HOST`, parada ordenada).
  - **Decisión (usuario, 2026-10-21, al aprobar el plan):** se acepta el límite en F1. El plan de F7 añade la cabecera en el proxy de Coolify para todas las respuestas.

## R16. Pantallas que funcionan sin JavaScript

- **Decisión:** la administración de usuarios usa páginas en lugar de hojas:
  - `/admin/usuarios` muestra la lista y el formulario de alta;
  - `/admin/usuarios/[usuarioId]` permite cambiar el rol, generar un enlace y reactivar.

  Las hojas (`Sheet`) y los diálogos de la plantilla necesitan JavaScript.
- **Formularios simples:** «Cerrar sesión en todos los dispositivos» y «Cerrar sesión» son formularios POST. Con JavaScript, `ConfirmDialog` intercepta el envío; sin JavaScript, se envían directamente.
- **Cambiar contraseña:** es un formulario dentro de `/perfil`.
- **Confirmación anunciada (constitución X):** el alta, el cambio de rol, la reactivación, la generación de un enlace, el cambio de contraseña y la aceptación del texto de privacidad confirman su resultado. Con JavaScript, con un aviso en la región `aria-live="polite"` del contexto de avisos. Sin JavaScript, con un `Banner` con `role="status"` que se pinta a partir de la prop `form`. Los textos están en `src/lib/shared/textos.ts`.
- **Sin conexión (EXC-007, constitución X):** con `use:enhance`, un fallo de red muestra «Sin conexión. Esta acción necesita red: vuelve a intentarlo cuando tengas conexión.» y conserva lo escrito. Sin JavaScript se acepta la página de error del navegador (excepción de la constitución XVII).
- **Superficie de los formularios:** van sobre una superficie estable, no sobre cristal (constitución XVIII, `design-principles.md`). Esto corrige la tarjeta de cristal de `/login` y de `/acceso/[token]`.
- **Saldo en la lista de usuarios:** la columna de saldo no se muestra en F1, porque los movimientos son de F4. Así no aparece un 0 que no viene del libro de movimientos.
- **Pantalla de inicio:** `/` muestra un estado vacío provisional. Las pestañas de Saldos, Compras y Estadísticas no aparecen hasta su funcionalidad.

## R17. Pruebas

- **Herramientas** (`docs/pruebas.md` §2): Vitest con los proyectos `servidor` y `componentes`, Playwright con los cinco proyectos y axe. StrykerJS no se instala hasta F4 (constitución II).
- **Siembra de las E2E:** `scripts/servidor/sembrar-e2e.ts`, empaquetado igual que el comando de R13. Usa las funciones públicas de los módulos (`docs/pruebas.md` §12.1). La fixture de worker lo ejecuta sobre su directorio de datos temporal antes de arrancar `node build`. No siembra usuarios de baja: en F1 no existe ninguna función pública de baja (es de F4).
- **Constructores de prueba:** `src/lib/server/<modulo>/pruebas/constructores.ts` (`docs/pruebas.md` §6). Las pruebas de RN-055 en `auth` crean el usuario de baja con `construirUsuario({ estado: 'baja' })` de `usuarios`. dependency-cruiser permite que **solo** un `*.test.ts` importe `src/lib/server/<otro>/pruebas/`; el código de producción, nunca (`ARCHITECTURE.md` §4 y §12).
- **Reloj:** `plataforma/reloj.ts` exporta `Reloj` con `ahora(): InstanteUtc`. Las pruebas de integración usan un reloj fijo. En E2E no se manipula el reloj del servidor (`docs/pruebas.md` §12.1).
- **Concurrencia (EV-040):** dos `worker_threads` con conexiones propias y `Atomics.wait` (`docs/pruebas.md` §7).
- **Falsos de push y S3:** no se usan en F1. `arranque.ts` recibe ya un objeto `Dependencias`, como raíz de composición. El mecanismo para elegir los falsos en E2E (`docs/pruebas.md` §24) se decide en el plan de F5.
- **Revisión manual:** VoiceOver y TalkBack en las pantallas de F1 antes de cerrar (constitución XI).

## R18. Dependencias de F1 (`ARCHITECTURE.md` §13)

**Base aceptada** (`historias.md` §10.3). Se confirman al instalar:
- **Ejecución:** `@sveltejs/kit` 3.x, `svelte` 5.x, `@sveltejs/adapter-node` 6.x, `vite` 8.x, `typescript` 6.x, `tailwindcss` 4.x, `bits-ui` 2.x, `@lucide/svelte` 1.x, `@fontsource-variable/*`, `drizzle-orm` 0.45.x, `better-sqlite3` 13.x, `zod` 4.x, `@node-rs/argon2` 2.x, `ulid` 3.x, `pino` 10.x, `pino-roll` 4.x y `pino-pretty` 13.x (los dos en `dependencies`, por el transporte de pino), `loglevel` 1.x.
- **Desarrollo:** `drizzle-kit` 0.31.x, Vitest 5.x con `@vitest/coverage-v8`, `fast-check` 4.x, `@vitest/browser-playwright` 5.x, `vitest-browser-svelte` 3.x, Playwright 1.x, `@axe-core/playwright` 4.x, ESLint 10.x, typescript-eslint 8.x, eslint-plugin-svelte 3.x, Prettier 3.x, dependency-cruiser 18.x, `svelte-check`.

**No se instalan en F1** porque ninguna regla de F1 las usa (constitución II): `web-push`, `sharp`, `aws4fetch`, `tar`, `croner`, `idb` y StrykerJS.

**Herramientas nuevas** fuera de la base, todas de desarrollo y sin efecto en el cliente:

| Paquete | Necesidad | Alternativa presente |
| --- | --- | --- |
| `prettier-plugin-svelte` | Prettier no formatea `.svelte` sin él | Ninguna |
| `@eslint-community/eslint-plugin-eslint-comments` | Prohibir `eslint-disable` (`ARCHITECTURE.md` §12) | Ninguna |
| `@types/better-sqlite3`, `@types/node` | Tipos | Ninguna |
| `globals`, `@eslint/js` | Configuración plana de ESLint | Ninguna |

Antes de instalar cada una se comprueban su licencia, su actividad y `npm audit`, y se anota el número de archivos de TypeScript (`docs/pruebas.md` §17.3).

**Lista de bloqueo:** son datos, no una dependencia (R6).

## R19. Entorno, CI y Windows

- `.nvmrc` con `24` y `engines` con `node >=24 <25` y `npm >=11 <12` (DEC-061, DEC-069).
- `.github/workflows/ci.yml` según `docs/pruebas.md` §21. Es un archivo protegido: la confirmación nativa lo aprueba.
- `scripts/benchmark.sh` y `scripts/benchmark.ps1` se adaptan de `docs/Prompts/plantillas/benchmark/` y se validan con `--dry-run` / `-DryRun` (T-TEST-005).
- `scripts/dev-windows-defender-exclusions.ps1`, con `-Remove`: lo ejecuta una persona administradora, no el agente (T-TEST-008).
- Todos los scripts npm son portables. Los scripts auxiliares son de Node.

## Verificación en el scaffold (T014 y T021)

- **Umbrales por patrón (T014):** Vitest 5 aplica los umbrales `src/lib/server/economia/**` y `src/lib/server/**/dominio/**` cuando existen archivos que casan con ellos. Con un `dominio/provisional.ts` sin pruebas, la verificación falló con «Coverage for lines (0%) does not meet … threshold (90%)». Con cero archivos, como en F1, la verificación pasa (`npm run verify`). Por tanto, el umbral del 90 % queda vigente desde el primer archivo de `economia` o de `dominio/`, sin ninguna configuración adicional.
- **Archivos de TypeScript (T021):** `npx tsc -p tsconfig.json --listFilesOnly` lista 459 archivos en el estado del lote L1 (medido el 2026-10-21).

## Verificación del scaffold (T008)

Las APIs marcadas «verificar en el scaffold» se comprobaron con el paquete instalado:

- **Importaciones con `.ts` (R2):** `imports` de `package.json` resuelve `#lib/ui`, `#lib/server/*`, `#lib/shared/*` y `#lib/client/*` hacia archivos `.ts`. `npm run check` (`svelte-check --fail-on-warnings`) y el build pasan sin advertencias.
- **`defineEnvVars` y `$app/env/private` (R13):** `src/env.ts` declara las variables con `defineEnvVars` y solo `src/lib/server/plataforma/entorno.ts` importa `$app/env/private`.
- **CSP con nonce (R15):** `kit.csp` en `vite.config.ts` usa `mode: 'nonce'`; el script en línea de `src/app.html` lleva `nonce="%sveltekit.nonce%"`. Las pruebas E2E de cabeceras (`e2e/api/cabeceras.spec.ts`) pasan.

Sin desviaciones respecto al diseño. Evidencia: `npm run verify` y el registro de `.local/verification/runs.jsonl`.
