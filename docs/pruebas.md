# Estrategia integral de testing para SvelteKit — beCafé

Este documento fija **cómo** se prueba beCafé y **cuándo** se ejecuta cada prueba. Las reglas que no se negocian están en la constitución (principios VIII, IX, XI, XVI y XVII). Las versiones de las herramientas están en `historias.md` §10.3. Las decisiones están en `historias.md` §11 (DEC-088 a DEC-094) y en el ADR-0005.

Estado: preparación. No existen código, `package.json`, pruebas ni CI. Todo lo que sigue es diseño para la funcionalidad F1 (scaffold) y las siguientes. Los nombres de scripts y archivos son propuestas que el scaffold crea.

## 1. Clasificación del proyecto

| Aspecto | Valor | Fuente |
| --- | --- | --- |
| Tipo | Aplicación full-stack SvelteKit con SSR y CSR; PWA instalable | RT-001, principio XVII |
| Prerender | No se usa | Principio XVII |
| Runtime de producción | Node LTS con `adapter-node`, una sola instancia, imagen Docker en Coolify | RT-010, DEC-061 |
| Persistencia | SQLite síncrono (`better-sqlite3`) con Drizzle, en `/data` | Principio V |
| Servicios externos | Web Push (VAPID) y un bucket S3. Ninguno se usa en las pruebas | RF-100 a RF-107, RF-140 |
| Navegador obligatorio | Safari iOS ≥ 16.4 y Chrome Android, dos últimas versiones | RNF-013 |
| Flujos críticos | Registrar un consumo con un toque y sin conexión; compras y coste medio; arqueos, recuentos y repartos; bajas con liquidación; acceso y permisos | DEC-072 (orden de prioridad) |

### Dónde se ejecuta cada código

| Código | Ubicación (`ARCHITECTURE.md` §2) | Entorno de prueba |
| --- | --- | --- |
| Reglas puras | `src/lib/server/*/dominio/`, `src/lib/shared/` | Node, sin E/S |
| Casos de uso, transacciones, tareas | `src/lib/server/<modulo>/` | Node + SQLite real en un archivo temporal |
| Rutas (`load`, *actions*, `+server.ts`) | `src/routes/` | Node, con un evento falso mínimo |
| Hooks | `src/hooks.server.ts` | Node (unidad) + E2E |
| Componentes | `src/lib/ui/` | Navegador real (Vitest Browser Mode) o E2E |
| Cola sin conexión y service worker | `src/lib/client/cola-consumos`, `src/service-worker.ts` | Navegador real (Playwright) |
| Contratos Zod | `src/lib/shared/contratos/` | Node |

## 2. Herramientas

| Herramienta | Uso | Estado |
| --- | --- | --- |
| `svelte-check`, ESLint, Prettier, dependency-cruiser | Nivel 0 | Decidida (DEC-069, DEC-073) |
| Vitest + `@vitest/coverage-v8` | Unidad, integración y rutas (proyecto `servidor`) | Decidida |
| `fast-check` | Pruebas de propiedades | Decidida |
| Vitest Browser Mode con `@vitest/browser-playwright` y `vitest-browser-svelte` | Componentes con estado propio (proyecto `componentes`) | **Nueva** (DEC-089) |
| Playwright + `@axe-core/playwright` | E2E, sin JavaScript, accesibilidad, visual, EV-050 | Decidida (proyectos: DEC-090) |
| StrykerJS (`@stryker-mutator/core` + `@stryker-mutator/vitest-runner`) | Mutación sobre `dominio/` | **Nueva** (DEC-092) |

Descartadas: jsdom o happy-dom (sin layout, foco real, IndexedDB ni service worker), Testing Library sobre jsdom, Firefox (no está en RNF-013), Cucumber (los CA ya están en Given/When/Then y basta con nombrar la prueba con el ID). No se instala ninguna herramienta que no esté en esta tabla sin pasar por `ARCHITECTURE.md` §13.

## 3. Niveles de prueba

| Nivel | Qué demuestra | Herramienta | Requiere | Ubicación | Cuenta para cobertura |
| --- | --- | --- | --- | --- | --- |
| 0 — Estático | Formato, tipos, lint, arquitectura, build. **No sustituye a ninguna prueba** | `svelte-check`, ESLint, Prettier, dependency-cruiser, `vite build` | — | — | — |
| 1 — Unidad | Reglas puras: coste medio, repartos, redondeos, tramos de RN-074, fechas, dinero, esquemas | Vitest (`servidor`) + `fast-check` | Node | `*.test.ts` junto al código | Sí |
| 2 — Componente | Estados e interacción de un componente reutilizable | Vitest Browser Mode (`componentes`) | Chromium | `*.test.ts` junto al componente | No (principio VIII) |
| 3 — Integración | Caso de uso con transacción, invariantes, idempotencia, concurrencia, migraciones; *actions* y `+server.ts` con evento falso | Vitest (`servidor`) | Node + SQLite temporal | `*.test.ts` junto al código o a la ruta | Sí |
| 4 — Aceptación | Un CA o EV con su ID en el nombre, en el nivel más barato que lo demuestra (casi siempre 1 o 3) | Vitest o Playwright | Según el CA | Donde corresponda al nivel | Según el nivel |
| 5 — E2E | Flujo crítico con la aplicación compilada y un navegador real | Playwright | Build + SQLite temporal + navegador | `e2e/` | No |
| 6 — Transversal | Accesibilidad, sin JavaScript, responsive, visual, carga | Playwright + axe; `perf:*` | Build + navegador | `e2e/` y `scripts/perf/` | No |
| Mutación | Que las pruebas de `dominio/` detectan errores. No es un nivel de la pirámide | StrykerJS | Node | `stryker.config.mjs` | — |

**Regla de elección:** cada comportamiento se prueba en el nivel más barato que lo demuestra, y no se repite en niveles superiores. Por ejemplo, el redondeo de un reparto se prueba en el nivel 1, y el E2E del arqueo solo comprueba que el reparto aparece y se confirma.

## 4. Lotes y momento de escritura

- La unidad de trabajo es un **lote funcional**: un caso de uso con su ruta y su pantalla, un formulario, una API o varias tareas relacionadas de `tasks.md`. Su tamaño depende del riesgo, no de un número de tareas.
- El lote se reduce cuando toca autenticación, permisos, dinero (`economia`), migraciones, concurrencia o la cola sin conexión.
- Flujo normal: analizar los CA y EV del lote → anotar las pruebas previstas (§5) → implementar → estabilizar el contrato público → completar las pruebas → ejecutar solo lo afectado (§13) → corregir → cerrar el checkpoint (§15).
- **La prueba se escribe antes o justo después del código** cuando se trata de: una regla de `dominio/`, un permiso, una invariante (INV-01 a INV-07), la idempotencia, la concurrencia, la cola sin conexión, un error corregido o un contrato ambiguo. TDD es selectivo, no obligatorio.
- La deuda de pruebas solo puede existir dentro del lote activo. Una funcionalidad no se cierra con pruebas obligatorias pendientes.
- No se crea una prueba por archivo, función, componente o *endpoint*. Se prueba el comportamiento observable, los contratos, los permisos y los errores, no los detalles internos, las clases de Tailwind ni el número de actualizaciones reactivas.

## 5. Nota previa de cada lote

El `plan.md` (o una línea del lote en `tasks.md`) anota solo lo que aplica:

`Lote → CA/EV → reglas y riesgos → pruebas previstas por nivel → datos y fakes → selección de cierre → condición para ampliar`

Ejemplo: `F4-L2 → CA-041, CA-045, EV-031 → coste medio con stock negativo; regularización → unidad + propiedades (coste-medio), integración (anular compra) → constructor de compras, reloj fijo → vitest de economia + related; E2E compra en chromium-movil → ampliar si cambia el contrato de compra`.

## 6. Unidad (nivel 1)

- **Qué:** todo `dominio/` (`coste-medio`, `repartos`, liquidación, regularización, tramos de RN-074), `lib/shared/fechas` (`InstanteUtc`, `FechaMadrid`, `Mes`, cambio de hora), dinero (céntimos, diezmilésimas, `formatMoney`), esquemas Zod de `lib/shared/contratos` (válidos, límites, claves desconocidas, mensajes sin el valor recibido) y la función `fallo()`.
- **Datos:** constructores (`construirCompra()`, `construirConsumo()`) en `src/lib/server/<modulo>/pruebas/` con valores por defecto legibles; ids ULID fijos.
- **Reloj y azar:** llegan como parámetro (principio IV). Prohibidos `Date.now()`, `new Date()` y `Math.random()` en `dominio/` y en las pruebas, salvo los fake timers de Vitest.
- **Propiedades (`fast-check`):** EV-020 (la suma del reparto es exacta y la diferencia máxima entre personas es 1 céntimo), EV-030 (stock y coste medio recalculados desde cero coinciden con los guardados tras secuencias aleatorias), redondeos de coste medio, conversión de fechas alrededor del cambio de hora, y que un esquema rechaza cualquier clave extra. La semilla se fija en la configuración y el caso mínimo de un fallo se copia como prueba de ejemplo.

## 7. Integración del servidor (nivel 3)

- **Base de datos:** cada archivo de prueba crea un SQLite en un directorio temporal y aplica las migraciones reales. No se comparte estado entre archivos. Nunca se conecta a `/data` ni a producción.
- **Casos de uso:** se llaman a través del `index.ts` público del módulo, con sesión, reloj y registrador falsos. Se comprueba el resultado, las filas resultantes, los avisos registrados en la transacción (ADR-0003) y los eventos de registro (§11).
- **Invariantes y escenarios:** EV-010 (respuesta perdida y reenvío), EV-011 (anular dos veces), EV-031 y EV-090 (anulación de compras), EV-041 (consumos en cola tras una baja), EV-080 (arqueos y recuentos).
- **Concurrencia** (EV-040, EV-100, EV-011 en paralelo): `better-sqlite3` es síncrono, así que dos llamadas seguidas no son concurrentes. Se usan dos `worker_threads` con conexiones propias al mismo archivo, sincronizados con un `Atomics.wait` para empezar a la vez. Se comprueba que `BEGIN IMMEDIATE` deja una sola operación válida.
- **Migraciones:** una prueba aplica todas las migraciones sobre una base vacía y otra sobre una copia de la base de la versión anterior con datos sembrados, y comprueba que los cargos y movimientos no cambian (principio XIV).
- **Tareas programadas:** el planificador se prueba sin `croner`. Se llama a la función de la tarea con un reloj fijo: día 1 a las 09:00 de Madrid (CA-104), 03:00 (CA-140) y cambio de hora.

## 8. Rutas, *actions* y endpoints sin el runtime

- **`load`:** no se llama al `load` exportado. Fabricar su evento exige aserciones de tipo, que el principio VII prohíbe. El `load` solo llama a funciones públicas de los módulos, que ya tienen sus pruebas. Si un `load` compone datos de varios módulos, la composición va a una función normal (`<pantalla>.datos.ts`) y se prueba esa función.
- **Actions:** se llaman directamente con un evento falso mínimo (`request` con `FormData`, `locals.sesion`, `params`), construido por `crearEventoAccion()` en `src/lib/shared/pruebas/` sin `as`.
- **Qué se devuelve y qué se lanza.** `fail()` se **devuelve**: se comprueba con `toMatchObject({ status: 400, data: { errores } })` después de estrechar el valor con `desenvolverFallo()`, sin `as`. `error()` y `redirect()` se **lanzan**: se comprueban con `rejects.toSatisfy((e) => isHttpError(e, 403))` o con `isRedirect(e)`.
- **`valores` de `fail`:** una prueba comprueba que nunca contiene contraseñas, tokens ni archivos (principio XVII).
- **Endpoints `/api/v1/*`** (cola de consumos, suscripción push, registro del cliente) y `/api/salud`: método, sesión ausente (401), permiso, cuerpo válido, cuerpo con una clave extra o un código desconocido (400), límites (413 o 429, PEND-034), recurso inexistente, idempotencia (CA-016) y **compatibilidad**: el contrato vigente acepta los cuerpos de la versión anterior guardados como ejemplos (principio XIV).
- **Lint tipado:** se prefieren literales completos con `toMatchObject`. `expect.any` y `expect.objectContaining` devuelven `any`.

## 9. Componentes (nivel 2, condicional)

- **Cuándo:** solo para componentes de `lib/ui` reutilizables con estado o interacción propia. Lista inicial: botón de cápsula (estados normal, stock bajo, sin stock; nombre accesible con el texto), aviso con «Deshacer» (cuenta atrás de 5 s con fake timers, anuncio en una región `aria-live`, foco), campo de importe en céntimos, indicador de «pendiente de enviar» y panel de avisos (vacío, cargando, error, sin conexión).
- **No** se prueban en este nivel las pantallas completas ni los componentes que solo pintan props: los cubren el E2E y axe.
- **Selectores:** rol y nombre accesible, etiqueta, texto estable y estado (`aria-pressed`, `disabled`), en ese orden. `data-testid` solo si lo anterior no basta, con nombres del dominio (`boton-capsula`, `aviso-deshacer`). Nunca clases CSS ni posiciones.
- Los nombres accesibles pueden incluir el indicador de obligatorio. Se busca con una expresión regular (`name: /Importe/`).
- Si un componente usa `use:enhance`, el módulo `$app/forms` se simula en su prueba.

## 10. SSR, hidratación, CSR y sin JavaScript

- **SSR:** el proyecto Playwright `sin-js` (`javaScriptEnabled: false`) demuestra que el HTML del servidor es completo. Cubre acceso, consumo, aportación y compra (DEC-084), y además que cada formulario envía y muestra errores y valores devueltos.
- **Hidratación:** el smoke (§12.2) falla con cualquier error de hidratación o excepción de página en los tres proyectos.
- **CSR:** la navegación entre la pantalla principal, los saldos, el historial y la administración se prueba con enlaces (`resolve()`), comprobando la URL y el encabezado de destino.
- **Código solo de navegador:** IndexedDB, service worker, `navigator.onLine` y la API de notificaciones se prueban solo en Playwright.

## 11. Registro (principio XVI)

- `crearRegistroFalso()` guarda los eventos en memoria y falla si un evento tiene una clave prohibida o un valor con forma de correo.
- Las pruebas de casos de uso comprueban el código y los campos del evento esperado. Una prueba general comprueba que `JSON.stringify(eventos)` no contiene nombres ni correos de los datos sembrados.
- Pruebas propias de `registro.ts`: `redact` (incluido `WebPushError`), correlación por `operacionId`, que el fichero no contiene el enlace de RF-139 (CA-139) y que un `LOG_LEVEL` no válido impide arrancar.

## 12. Playwright (niveles 5 y 6)

### 12.1 Entorno y datos

- **Contra la build de producción:** `vite build` una vez y después `node build` por cada worker de Playwright, con su propio directorio de datos temporal y su puerto. Una fixture de worker arranca y detiene el servidor. Así cada worker tiene su hucha y su stock, y los tests pueden ir en paralelo sin compartir datos económicos.
- **Siembra:** un script de siembra usa las **funciones públicas de los módulos** (no SQL directo), con datos fijos e identificables (Ana, Luis, Marta, Jorge, Pedro; tipos «Ristretto» y «Decaf»). No existe ningún endpoint de siembra en la aplicación.
- **Variables:** los valores de `.env.test.example` se pasan solo en el proceso de prueba (sin secretos reales). Las claves VAPID son de prueba. S3 apunta a un servidor falso local.
- **Servicios externos:** el envío push se sustituye por un fake en `notificaciones/entrega-push.ts`, seleccionado por configuración de prueba. Registra los envíos para poder comprobarlos (CA-101, CA-105). La subida S3 apunta a un servidor HTTP falso que guarda el archivo recibido (CA-140, CA-142).
- **Sesiones:** un proyecto de preparación inicia sesión una vez por rol (`anonimo`, `miembro`, `administrador`) y guarda su `storageState`. Solo los specs de acceso (CA-132, CA-133, CA-137, CA-138) recorren el login por la interfaz.
- **Reloj del navegador:** `page.clock` para la cuenta atrás de «Deshacer» y los textos relativos. El reloj del servidor no se manipula en E2E; las reglas con fecha se prueban en integración.
- **Sin conexión:** `context.setOffline(true)` para CA-015, CA-063 y CA-173.

### 12.2 Suites

| Suite | Contenido | Proyectos |
| --- | --- | --- |
| `smoke` | La aplicación arranca, la página principal responde y no queda en blanco, aparece el contenido principal, la acción primaria está disponible, no hay excepciones de página, `console.error`, errores de hidratación ni peticiones propias fallidas, y una navegación básica funciona | Los tres |
| `flujos` | E2E derivados de historias (§14.2) | Lote: `chromium-movil`. Puerta: los tres |
| `sin-js` | Formularios críticos sin JavaScript (DEC-084) | `sin-js` (Chromium) |
| `acceso` | EV-050: GET y POST a cada `load`, *action* y `+server.ts` sin sesión y con rol miembro, generado desde la lista de rutas. Usa `request` de Playwright, sin navegador | `api` |
| `a11y` | axe en cada pantalla, en tema claro y oscuro (XI, EV-060), recorrido con teclado de los flujos críticos y preferencias de apariencia (EV-061, §13) | `chromium-movil` |
| `visual` | Capturas de §12.5 | `chromium-movil` |

**Errores de navegador:** una fixture automática recoge `pageerror`, `console.error` y las respuestas ≥ 500 de la propia aplicación, y hace fallar el test. La lista de excepciones es mínima, está documentada en la fixture y empieza vacía.

### 12.3 Proyectos, viewports y navegadores (DEC-090)

| Proyecto | Dispositivo | Cuándo |
| --- | --- | --- |
| `chromium-movil` | Pixel (Chrome Android) | Trabajo diario, lotes y `test:e2e:quick` |
| `webkit-movil` | iPhone (aproxima Safari iOS) | Puerta de funcionalidad y CI |
| `chromium-escritorio` | 1280 px (pantallas de administración) | Puerta de funcionalidad y CI |
| `sin-js` | Chromium sin JavaScript | Lote, si toca un formulario crítico; puerta y CI |
| `api` | Sin navegador | Lote, si añade una ruta; puerta y CI |

WebKit de Playwright no sustituye a Safari en un iPhone real: la revisión manual con VoiceOver del principio XI se hace en un dispositivo. La matriz se amplía en un lote cuando cambia algo sensible al motor: formularios, foco, scroll, subida de fotos, service worker, IndexedDB o notificaciones.

### 12.4 Selectores y esperas

- Prioridad: `getByRole`, `getByLabel`, `getByText` con texto estable y `getByTestId` con nombre de dominio. No se usan CSS profundo, `nth()`, clases de Tailwind ni ids generados.
- Las esperas se hacen con locators y `expect`. **Prohibidos** `waitForTimeout`, `sleep` y los bucles de espera. Un test que necesita más tiempo se investiga; no se sube el timeout.

### 12.5 Responsive y regresión visual (DEC-091)

- **Responsive:** los proyectos móvil y escritorio cubren los dos tamaños significativos. No se prueban más resoluciones salvo que aparezca un punto de ruptura funcional.
- **Tema:** con `getComputedStyle` se comprueba que los tokens críticos existen y que el tema oscuro cambia el fondo y el texto. No se prueban clases de Tailwind.
- **Capturas** con `toHaveScreenshot`, solo en `chromium-movil`: pantalla principal en tema claro y oscuro, aviso con «Deshacer», formulario de compra con error y panel de avisos. Datos, fecha, zona horaria, idioma, fuentes y animaciones quedan fijos. Solo se enmascaran regiones dinámicas legítimas.
- Las referencias se generan en Linux (la misma imagen que la CI). Se actualizan solo con un cambio intencionado, revisado y en el mismo commit.

### 12.6 Artefactos de diagnóstico

Trace y captura **solo al fallar** (`trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`) y sin vídeo. La CI sube `test-results/` y el informe HTML como artefactos cuando falla.

## 13. Accesibilidad (principio XI)

- axe sin infracciones en cada pantalla y estado relevante (vacío, error, aviso abierto), en tema claro y oscuro.
- Teclado: recorrido de los flujos críticos con Tab y Enter, foco visible y foco en el primer campo con error tras un `fail`.
- Mensajes de estado: la confirmación y «Deshacer» se anuncian en una región `aria-live` sin mover el foco (CA-013, CA-171).
- Objetivos táctiles de 44 × 44 px en los botones de cápsula (RNF-001), medidos con `boundingBox()`.
- Preferencias de apariencia (EV-061, RNF-015, constitución XI y XVIII). Se emulan con `page.emulateMedia()` de Playwright:
  - `colorScheme: 'dark' | 'light'` con «Automático»: la aplicación sigue el cambio sin recargar y conserva el valor escrito y el foco (CA-180). Al elegir «Claro» y recargar, la preferencia se mantiene.
  - `contrast: 'more'`: axe sin infracciones y foco visible.
  - `forcedColors: 'active'`: controles, límites y foco siguen visibles (captura de la pantalla principal y comprobación de que el anillo de foco tiene dimensiones).
  - `reducedMotion: 'reduce'`: sin transiciones (duración computada 0).
  - Texto al 200 % (tamaño de fuente raíz duplicado) y viewport de 320 px: sin desbordamiento horizontal (`scrollWidth <= clientWidth`) y la acción primaria sigue visible.
  - «Reducir transparencia» activado (CA-181): ninguna superficie tiene `backdrop-filter` y el fondo computado es opaco.
  - Playwright no emula `prefers-reduced-transparency`: la rama del sistema de CA-181 se revisa a mano en un dispositivo, junto con VoiceOver y TalkBack.
- axe no es una auditoría completa. Cada funcionalidad con interfaz nueva se revisa a mano con VoiceOver (iOS) y TalkBack (Android) antes de cerrarse, y la revisión se anota en su `tasks.md`.

## 14. Aceptación

### 14.1 Nivel más barato por grupo de CA

Cada `spec.md`, al recibir el traspaso, copia la fila de sus CA y la concreta en su matriz (§19). Esta tabla es la propuesta por defecto. Al traspasar, la fuente vigente pasa a ser la de cada spec.

| CA / EV | Nivel principal | E2E |
| --- | --- | --- |
| CA-001 a CA-006 (catálogo, fotos) | Integración (`catalogo`, `plataforma/imagenes` con `sharp` real y ficheros de ejemplo) | Alta de tipo con foto (`chromium-escritorio`) |
| CA-010 a CA-017 (consumo) | Unidad (cargo, coste) + integración (idempotencia CA-016, stock negativo CA-017) | Consumo con un toque y «Deshacer» (CA-011, CA-013); sin conexión (CA-015, CA-063) |
| CA-020 a CA-023 (stock bajo) | Unidad (estimación CA-022) + integración (aviso una sola vez CA-023) | Panel de avisos (CA-021) |
| CA-030, CA-031 (aportaciones) | Integración + esquema | Aportación (también `sin-js`) |
| CA-040 a CA-045 (compras) | Unidad y propiedades (coste medio CA-041) + integración (CA-045, EV-031, EV-090) | Compra con dos líneas y confirmación de hucha negativa (CA-040, CA-043; también `sin-js`) |
| CA-060 a CA-064 (anulaciones) | Integración (plazos con reloj fijo; EV-011, EV-080) | Anulación propia con motivo |
| CA-080 a CA-093 (arqueos, recuentos) | Unidad y propiedades (repartos, EV-020) + integración | Pantalla de control: arqueo con reparto previsto y confirmación (CA-081) |
| CA-100 a CA-106, CA-074 (notificaciones) | Unidad (tramos de RN-074 con reloj, EV-101) + integración con el fake de push (CA-101, CA-102, CA-105) | Ayuda de instalación (CA-106); permiso de notificaciones denegado (CA-100) |
| CA-110 a CA-122 (saldos, estadísticas) | Integración | Saldos e historial con «Mostrar anulados»; CA-122 entra en EV-050 |
| CA-130 a CA-139, CA-160 (usuarios, acceso, privacidad) | Integración (bloqueo CA-133 con reloj fijo, último administrador CA-134 y EV-040, baja CA-135, reautenticación CA-138, arranque CA-139) | Invitación y primera contraseña con texto de privacidad (CA-130, CA-132, CA-160); cierre de sesión global (CA-137) |
| CA-140 a CA-144 (copias) | Integración con S3 falso y `VACUUM INTO` real | Panel de copias (CA-143, CA-144) |
| CA-150 (configuración) | Integración | — |
| CA-170 a CA-176 (rellenos, aguador) | Integración (intervalo CA-172, EV-100, aguador CA-176 con reloj fijo) | Relleno con «Deshacer» (CA-171); sin conexión (CA-173) |
| EV-050 | Suite `acceso` | — |
| EV-060 | Suite `a11y` + revisión manual | — |
| CA-180, CA-181, EV-061 (apariencia) | Unidad (lectura validada de la preferencia guardada) | Suite `a11y` con emulación (§13); la transparencia del sistema, revisión manual |
| EV-070 | Demostración manual trimestral (fuera de la suite) | — |

### 14.2 Reglas

- El nombre de la prueba empieza por el ID: `it('CA-041: recalcula el coste medio con stock negativo', …)`. Una prueba puede cubrir varios CA relacionados; un CA no se divide en una prueba por frase.
- Cada CA cubre, cuando aplica: camino correcto, validación, vacío, error recuperable, sesión inexistente, usuario sin permiso y límites (justo antes, en y después del límite: 14 y 15 caracteres en CA-132, 15 y 16 minutos de plazo, 5 y 6 intentos en CA-133).
- Un E2E existe solo si el CA necesita un navegador real: interacción táctil, `aria-live`, cola sin conexión, service worker, navegación o permisos del navegador. Antes de crearlo se comprueba si una prueba más barata basta.

## 15. Cobertura y mutación

- **Cobertura:** los umbrales están en el principio VIII (80 % en `src/lib/server` + `src/lib/shared`; 90 % en `economia` y `dominio/`, por líneas y ramas). Los aplica `npm run test` en el proyecto `servidor`. Las ramas de validación, errores, permisos y límites se revisan en el informe aunque se supere el umbral. La cobertura es una señal: no se escriben pruebas sin aserciones para subirla.
- **Mutación (DEC-092):** StrykerJS sobre `src/lib/server/economia/dominio/` y los tramos de RN-074. El primer piloto se hace al cerrar F4: se registran mutantes eliminados, supervivientes, sin cobertura, timeouts y tiempo total, y se fija la **línea base**. Después se ejecuta en la puerta de cada funcionalidad que toque `dominio/` y cada semana en la CI programada. Cada superviviente se analiza: aserción insuficiente, caso límite ausente, mutación equivalente o código muerto. **No hay umbral** hasta tener la línea base; fijarlo después necesita una decisión con datos.

## 16. Determinismo

- Reloj, azar e ids se inyectan. En las pruebas se usan relojes fijos, fake timers y ULID conocidos.
- Zona horaria `Europe/Madrid` e idioma `es-ES` fijos en Vitest y en Playwright (`timezoneId`, `locale`).
- Casos de fecha obligatorios: cambio de día a medianoche de Madrid, cambio de hora de marzo y octubre, día 1 del mes y caducidades (enlace de 24 h, bloqueo de 15 min, plazo de autoanulación).
- Sin red: ninguna prueba accede a internet. Web Push y S3 siempre son fakes.

## 17. Ejecución por impacto y puertas (DEC-088)

### 17.1 Qué se ejecuta y cuándo

| Momento | Selección | Ampliación |
| --- | --- | --- |
| Edición | El test concreto o `npm run check` del archivo | — |
| Cierre de tarea o lote | Pruebas nuevas y modificadas + consumidores (`npm run test:changed`), `npm run lint:changed`, `npm run check`; si afecta a la interfaz, los specs afectados en `chromium-movil` (`npm run test:e2e:quick -- <spec>`); `sin-js` o `acceso` si toca un formulario crítico o una ruta | Cambio de contrato público, esquema, migración, `hooks.server.ts`, `plataforma/` o configuración de herramientas → `npm run verify` |
| **Puerta de funcionalidad** (cierre de F1…F8) | `scripts/benchmark.sh` / `.ps1` completo en serie: verify (con cobertura y build) + E2E en todos los proyectos + visual; StrykerJS si se tocó `dominio/` | — |
| CI (cada push a `main` y PR) | verify + E2E de los cinco proyectos + visual (§21) | — |

- Cerrar una tarea no dispara por sí solo la suite completa, el build ni el lint global.
- `main` nunca queda sin verificación completa, porque la CI la ejecuta en cada push.
- Una comprobación fallida, interrumpida o con cero pruebas seleccionadas **nunca** cuenta como superada.
- No se ejecutan lint y pruebas a la vez (`CLAUDE.md` §6).

### 17.2 Selección y reutilización de evidencia

1. Se localiza el cambio respecto a la última evidencia válida, incluidos los archivos sin commit, los nuevos sin seguimiento y la configuración.
2. Se calcula el impacto: consumidores del `index.ts` del módulo, rutas que lo llaman, contratos de `lib/shared`, migraciones, tokens de estilo y fixtures. `vitest related` es una ayuda y no ve las rutas ni las migraciones; se completa a mano.
3. Se comprueba que el filtro selecciona al menos una prueba. Una lista vacía nunca se pasa a una CLI que la interprete como «todo».
4. Se ejecuta una vez. Ante un fallo se diagnostica con el subconjunto mínimo y, tras corregir, se repite solo lo invalidado.
5. Se reutiliza un éxito solo si las entradas relevantes son iguales: código, pruebas, `package-lock.json`, configuración y versión de Node. La reutilización local no sustituye a la CI.

### 17.3 Registro local y benchmark

- `.local/` está en `.gitignore`.
- **`.local/verification/runs.jsonl`:** una línea por ejecución selectiva con id, fecha, lote, comando saneado, selección, huella de entradas (commit + hash de `git diff` + lockfile), estado (`EN_CURSO`, `PASA`, `FALLA`, `INTERRUMPIDO`, `DESCONOCIDO`), duración, número de pruebas y la referencia reutilizada con su motivo. Sin secretos, datos personales ni volcados de consola. Se conservan los últimos 90 días.
- **Benchmark:** `scripts/benchmark.ps1` (Windows) y `scripts/benchmark.sh` (Linux) se adaptan de `docs/Prompts/plantillas/benchmark/`.
  - Pasos: Prettier, ESLint, `svelte-check`, dependency-cruiser (`HAS_ARCH_CHECK=true`), build, Vitest `servidor` con cobertura, Vitest `componentes` y Playwright.
  - Se retiran los pasos de Rust y Tauri.
  - `QUICK_E2E_PROJECT=chromium-movil`.
  - Se valida con `-DryRun` / `--dry-run` en el scaffold de F1.
  - Se ejecuta completo por primera vez al cerrar F1 y después en cada puerta. Genera `.local/benchmark/<fecha>-<equipo>.json` y `.txt` con la duración por paso y las 10 pruebas más lentas.
  - Al empezar una sesión se lee el último informe para planificar la selección; no se reejecuta.
- **Avisos de duración:** no se fija ningún umbral antes de la primera medición. Tras el cierre de F1 se propone uno con los datos del benchmark.

### 17.4 Lentitud, bloqueos y tests inestables

- Un test inestable es un defecto. Se investigan el estado compartido, las esperas, el orden, los timers, las animaciones, el servidor por worker y la paralelización. No se resuelve subiendo `retries`, timeouts ni `waitForTimeout`. En la CI, `retries: 1` solo sirve para diagnosticar: un test que pasa en el reintento se marca como inestable y se corrige en el siguiente lote.
- Un proceso propio solo se detiene con indicios claros de bloqueo, y solo ese proceso y sus hijos. El resultado se registra como `INTERRUMPIDO`.
- Los cambios persistentes en scripts, configuración, puertas o CI se proponen con números del benchmark y esperan aprobación.

## 18. Comandos (propuestos; los crea el scaffold de F1)

| Necesidad | Comando |
| --- | --- |
| Verificación completa | `npm run verify`: format:check → lint → check → arch → test → test:componentes → build, en serie |
| Formato | `npm run format`, `npm run format:check` |
| Lint | `npm run lint`, `npm run lint:changed` (archivos cambiados respecto a `HEAD` y sin seguimiento) |
| Tipos | `npm run check` (`svelte-check --fail-on-warnings`) |
| Arquitectura | `npm run arch` (dependency-cruiser + pruebas de arquitectura) |
| Unidad e integración con cobertura | `npm run test` (proyecto `servidor`) |
| Afectadas | `npm run test:changed` (`vitest related --run`) |
| Un archivo o una prueba | `npx vitest run <archivo> -t "CA-041"` |
| Componentes | `npm run test:componentes` (proyecto `componentes`) |
| E2E completo | `npm run test:e2e` (todos los proyectos) |
| E2E rápido | `npm run test:e2e:quick` (`--project=chromium-movil`) |
| Smoke | `npm run test:e2e:smoke` |
| Visual | `npm run test:e2e:visual` (actualizar: `-- --update-snapshots`, solo con un cambio revisado) |
| Depuración | `npx playwright test --ui`, `--headed`, `--debug` |
| Mutación | `npm run test:mutacion` |
| Carga | `npm run perf:seed`, `npm run perf:load` |
| Build | `npm run build` |
| Benchmark de puerta | `scripts/benchmark.sh` o `scripts/benchmark.ps1` (`-DryRun`, `-SkipInstall`, `-QuickE2E`) |

## 19. Integración con Spec Kit

- **`spec.md`:** cada funcionalidad incluye una matriz de trazabilidad. La matriz no repite las reglas: enlaza sus IDs.

  | Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
  | --- | --- | --- | --- | --- |
  | RN/RF/CA/EV con su ID | Qué resultado no válido se impide | Condición, acción y resultado observable, incluidos los intentos de violación (dos peticiones a la vez, repetición tras una respuesta perdida, transición prohibida, límite temporal antes, en y después) | Unidad, integración, componente, E2E o revisión manual | Prevista, ejecutada con resultado, o no aplicable con motivo |

- **`plan.md`:** decide para su alcance los niveles, los datos y fakes, los E2E y sus proyectos, si toca `dominio/` (y por tanto la mutación), los eventos de registro (`ARCHITECTURE.md` §9) y la nota de cada lote (§5). Remite a este documento y no lo copia.
- **`tasks.md`:** las tareas agrupan la implementación y su verificación por resultado funcional. Cada lote lleva una línea compacta: tareas → impacto → selección → evidencia → condición para ampliar. No hay una tarea por prueba ni «ejecutar todo» al final de cada lote. La puerta de funcionalidad es la última tarea.
- Al aceptar un traspaso se comprueba que cada CA conserva su significado y tiene un nivel previsto, y que ninguna prueba o tarea implementa una regla sin respaldo.

## 20. Criterios de cierre

### 20.1 Checkpoint de lote

- La implementación del lote está completa y sus pruebas obligatorias existen y pasan con la selección del §17.1.
- Las fixtures necesarias existen y no queda ningún fallo pendiente.
- Se anota un resumen breve: qué se ejecutó y su resultado, qué se reutilizó (id y motivo), qué no aplica y por qué, y qué queda para la puerta.

### 20.2 Puerta de funcionalidad (Definition of Done)

- Todos los lotes están cerrados.
- Cada CA y EV del alcance tiene su prueba, con el ID en el nombre, y pasa.
- El benchmark completo pasa en serie: verify con cobertura y cero advertencias, E2E en todos los proyectos, `sin-js`, `acceso`, `a11y` y `visual`.
- StrykerJS se ha ejecutado si la funcionalidad tocó `dominio/`, y sus supervivientes están analizados.
- No hay errores inesperados de consola ni de página, ni `waitForTimeout`, ni tests omitidos sin justificar, ni deuda de pruebas.
- La revisión manual con VoiceOver y TalkBack está anotada si hay interfaz nueva.
- Las fixtures, los fakes y los comandos nuevos están documentados aquí o en el `plan.md`.
- La CI pasa tras el push.

### 20.3 Específico de Playwright

- El smoke y los E2E de la funcionalidad pasan en los proyectos requeridos.
- Los datos son reproducibles y cada test se puede ejecutar solo y en cualquier orden.
- Las capturas coinciden o se actualizaron de forma intencionada.
- Los artefactos de fallo están configurados.

## 21. CI (GitHub Actions, DEC-093)

- **Cada push a `main` y cada PR:** `npm ci` con caché de npm y de los navegadores de Playwright; `npm run verify`; `npx playwright test` con los cinco proyectos contra la build; `npm audit`. Los artefactos se suben solo si algo falla.
- **Programada semanal:** `npm run test:mutacion` sobre `dominio/` (desde que exista la línea base de F4) y `npm audit`.
- **Antes de producción (F7):** la misma verificación sobre la imagen Docker que se despliega.
- Si el benchmark muestra que la matriz E2E alarga demasiado la CI, se propone con datos moverla a la ejecución programada.

## 22. Carga

`ARCHITECTURE.md` §14 ya prevé `perf:seed` y `perf:load` en la primera pantalla de lectura (F6):

- La siembra usa los servicios de los módulos con semilla fija y una base nueva.
- La medición se hace contra la build de producción, con ritmo de persona (pausas de unos 5 s con *jitter*) y también en saturación, y con una sola sesión para separar el tiempo de servicio del de espera.
- Se mide el registro: eventos y bytes por petición, extrapolados a un día.
- Las peticiones usan `Accept: text/html` en los formularios.
- El objetivo es el p95 ≤ 1 s de RNF-002.
- Comprobación obligatoria: una página con cadena de consulta no devuelve 400 por el `load` del layout (`ARCHITECTURE.md` §6.1).

## 23. Tareas previstas para F1 (scaffold)

```text
T-TEST-001 Configurar Vitest con los proyectos servidor (cobertura y umbrales del principio VIII) y componentes (Browser Mode).
T-TEST-002 Crear los ayudantes de prueba: crearEventoAccion, desenvolverFallo, reloj fijo, constructores, base SQLite temporal con migraciones y crearRegistroFalso.
T-TEST-003 Configurar Playwright: proyectos del §12.3, servidor por worker sobre la build, siembra por servicios, storageState por rol, fixture de errores de navegador, artefactos de fallo, zona horaria e idioma.
T-TEST-004 Crear las suites smoke, acceso (EV-050) y a11y con las primeras pantallas.
T-TEST-005 Crear los scripts npm del §18 y adaptar scripts/benchmark.ps1 y benchmark.sh (validar con -DryRun); añadir .local/ a .gitignore.
T-TEST-006 Crear la CI del §21.
T-TEST-007 Ejecutar el benchmark completo al cerrar F1 y proponer avisos de duración con sus datos.
```

T-MUT-001 (piloto de StrykerJS) se planifica en F4.

## 24. Preguntas abiertas

| Pregunta | Hipótesis de trabajo | Se resuelve en |
| --- | --- | --- |
| ¿El fake de push y el de S3 se seleccionan con una variable de entorno de prueba o inyectando la dependencia en `arranque.ts`? | Inyección en `arranque.ts`, sin variable que pueda activarse en producción | Plan de F1 |
| ¿Cuánto tarda cada suite? | Sin datos; no hay umbral | Benchmark al cerrar F1 |
| ¿Cómo se prueba la entrega push real en un navegador? | No se prueba en automático (exige un servicio push real); se revisa a mano en Android e iOS | Plan de F5 |
| ¿Se ejecuta una tarea programada perdida al arrancar? | Duda de comportamiento ya registrada en `historias.md` §15 | `/speckit-clarify` en F5, F7 y F8 |
