# Constitución de beCafé

Palabras normativas: DEBE (MUST), NO DEBE (MUST NOT), DEBERÍA (SHOULD), NO DEBERÍA (SHOULD NOT) y PUEDE (MAY).

## Orden de prioridad

Cuando dos principios entran en conflicto, se aplica este orden. Un nivel superior NO DEBE
sacrificarse por uno inferior:

1. Integridad de los datos económicos.
2. Seguridad y privacidad.
3. Accesibilidad.
4. Rapidez del registro.
5. Simplicidad y mantenibilidad.
6. Estética.

Ejemplos: una caché que acelera una pantalla pero puede mostrar un saldo desfasado se rechaza
(1 sobre 4); un atajo de interfaz sin etiqueta accesible se rechaza (3 sobre 4); una animación
que retrasa la confirmación de un registro se elimina (4 sobre 6).

## Principios fundamentales

### I. Fuente vigente y trazabilidad

- Cada comportamiento implementado DEBE proceder de una regla aprobada en la `spec.md` de su
  funcionalidad o, mientras no se haya traspasado, en `historias.md`.
- Cada regla DEBE tener un único enunciado vigente y un único documento dueño. Los demás documentos
  la citan por su ID (RN, RF, CA, INV, EV, DEC).
- Un agente NO DEBE inventar reglas de negocio, valores por defecto ni umbrales. Si falta una regla,
  DEBE preguntar.
- Una propuesta técnica NO DEBE tratarse como decisión aprobada por el hecho de copiarla a otro
  documento.

Motivo: dos enunciados de la misma regla terminan divergiendo, y una regla inventada por un agente
cambia el reparto de dinero entre personas.

### II. La complejidad necesita justificación

- Cada capa, abstracción, dependencia, tarea programada, caché o mecanismo de comunicación nuevo
  DEBE responder a un problema concreto, escrito en el `plan.md` correspondiente.
- El código DEBERÍA resolver un problema de una sola forma en todo el proyecto.
- Se DEBERÍA preferir una implementación local sencilla hasta que exista reutilización real.

Motivo: la aplicación tiene unos 10 usuarios y una instancia; cada pieza sin problema concreto solo
añade coste de mantenimiento.

### III. Separación de responsabilidades y módulos

- La lógica de gestión (reglas de negocio, permisos, cálculos y acceso a datos) DEBE estar en los
  módulos de servidor (`src/lib/server/<modulo>/`). La presentación (páginas en `src/routes` y
  componentes en `src/lib/ui`) NO DEBE contener reglas de negocio ni acceso a datos.
- Los componentes de `src/lib/ui` DEBEN recibir los datos por propiedades y comunicar acciones por
  funciones recibidas; NO DEBEN llamar al servidor.
- Los cálculos del núcleo económico DEBEN ser funciones puras en `dominio/`, sin acceso a base de
  datos, red, reloj del sistema ni azar.
- El código de servidor DEBE organizarse en módulos por capacidad, con un único punto de entrada
  público, según `ARCHITECTURE.md`.
- Un módulo NO DEBE importar archivos internos ni tablas de otro módulo, ni escribir en ellas.
- El grafo de dependencias entre módulos NO DEBE tener ciclos.
- El código de cliente NO DEBE importar código de servidor.
- Estas reglas DEBEN comprobarse de forma automática en la verificación.

Motivo: la misma regla de negocio debe servir a la página, a la API de la cola sin conexión y a las
tareas programadas; y el riesgo principal a largo plazo es que los agentes acoplen el código poco a
poco.

### IV. Integridad económica (núcleo)

- Los importes DEBEN guardarse y calcularse como enteros (céntimos; coste medio en diezmilésimas
  de euro).
- Los registros económicos y los movimientos NO DEBEN modificarse ni borrarse. Se corrigen con
  anulaciones y movimientos nuevos.
- Los saldos DEBEN derivarse del libro de movimientos.
- Cada registro económico y todos sus efectos DEBEN guardarse en una única transacción.
- Las operaciones que el cliente puede repetir DEBEN ser idempotentes mediante un identificador
  generado en el cliente.
- Cada invariante del dominio DEBE tener una prueba automatizada que intente violarla.

Motivo: el dinero de la hucha común es la base de la confianza entre compañeros (NEC-007); un
error de redondeo o un cargo duplicado la rompe.

### V. Almacenamiento de datos

- SQLite DEBE ser el único almacén de los datos de negocio, en el volumen persistente `/data`. Las
  fotos DEBEN guardarse en `/data/fotos` y servirse a través de la aplicación.
- El esquema de la base de datos DEBE definirse con Drizzle y evolucionar solo mediante migraciones.
- Las fechas y horas DEBEN guardarse en UTC con formato ISO 8601. Los cálculos de calendario (mes
  natural, día 1, horas de las tareas) DEBEN usar la zona `Europe/Madrid`.
- Las claves primarias y los identificadores generados en el cliente DEBEN ser ULID.
- Los datos derivados que se guardan (stock, coste medio, estado de stock bajo) DEBEN coincidir
  siempre con su recálculo desde los registros vigentes.
- El navegador NO DEBE guardar nada salvo la cola de consumos pendientes (IndexedDB), la
  preferencia de tema y la caché del service worker. La sesión DEBE viajar solo en una cookie
  `HttpOnly`; NO DEBEN guardarse tokens ni datos personales en `localStorage`.
- DEBE existir una copia de seguridad diaria fuera del servidor, restaurable y probada
  periódicamente (RT-005, RNF-009).

Motivo: un único almacén transaccional hace posible la integridad económica; lo que se guarda en el
navegador puede perderse o leerse en un dispositivo compartido.

### VI. Seguridad y validación en el servidor

- Toda entrada del cliente DEBE tratarse como no confiable y validarse en el servidor.
- Toda entrada no confiable (formularios, parámetros de ruta y de consulta, cuerpos JSON, archivos
  subidos, datos leídos del navegador o de JSON guardado, variables de entorno) DEBE validarse con
  un esquema Zod en su frontera antes de usarse.
- Los tipos de entrada DEBEN inferirse del esquema. Una aserción de tipo NO DEBE sustituir a una
  validación.
- Superar un esquema NO DEBE considerarse una autorización ni una garantía de que se cumple una
  invariante.
- Las entradas de ruta DEBEN rechazar claves desconocidas.
- Un mensaje de error de validación NO DEBE incluir el valor recibido ni detalles internos.
- Las variables de entorno DEBEN declararse con su esquema en un único archivo y validarse al
  arrancar. Si falta una obligatoria, la aplicación NO DEBE arrancar. Un secreto NO DEBE ser
  público ni incrustarse en el código compilado.
- Cada permiso DEBE comprobarse en el servidor, en el caso de uso, y no solo ocultando elementos de
  la interfaz.
- Los secretos NO DEBEN estar en el repositorio. Solo un módulo de configuración DEBE leer las
  variables de entorno.
- Los registros de log DEBEN cumplir el principio XVI.

Motivo: la aplicación está expuesta a internet y el repositorio es público.

### VII. Tipado estricto sin escapes

- TypeScript DEBE usarse en modo estricto.
- El código y las pruebas NO DEBEN usar aserciones de tipo (salvo `as const`), `any`, la aserción
  de no nulo, ni comentarios que desactiven el compilador o el linter.
- Una regla de una herramienta NO DEBE saltarse excluyendo archivos de su configuración.

Motivo: cada escape de tipos oculta un error que el compilador habría detectado antes que las
pruebas.

### VIII. Pruebas y cobertura

- Cada criterio de aceptación (CA) y escenario de verificación (EV) del alcance de una tarea DEBE
  tener al menos una prueba que lo identifique.
- Las reglas económicas DEBEN probarse con pruebas unitarias y, cuando hay secuencias o redondeos,
  con pruebas basadas en propiedades.
- Las operaciones transaccionales y concurrentes DEBEN probarse contra la base de datos real del
  proyecto.
- El reloj y el azar DEBEN poder sustituirse en las pruebas.
- La cobertura de las pruebas unitarias y de integración, medida con Vitest (proveedor v8) sobre
  líneas y ramas, DEBE ser como mínimo:
  - 80 % en `src/lib/server` y `src/lib/shared` en conjunto;
  - 90 % en el módulo `economia` y en todo directorio `dominio/`.
- La verificación DEBE fallar si no se alcanzan los umbrales. Los umbrales NO DEBEN bajarse ni
  excluirse archivos para alcanzarlos sin una enmienda de esta constitución.
- Una prueba DEBE comprobar un resultado observable; una prueba que solo ejecuta código sin
  aserciones sobre el resultado NO cuenta como cumplimiento.
- Los componentes de `src/lib/ui` y las rutas se verifican con pruebas E2E y de accesibilidad, que
  no cuentan para los umbrales.

Motivo: la cobertura es exigente donde un fallo cuesta dinero, sin obligar a escribir pruebas de
poco valor en código de apoyo.

### IX. Verificación como condición de terminado

- Una tarea NO DEBE declararse terminada sin que la verificación agregada del proyecto termine sin
  errores.
- La integración continua DEBE ejecutar la misma verificación en cada pull request y en cada cambio
  de la rama principal.
- Las advertencias del compilador, del comprobador de tipos y del linter DEBEN tratarse como
  errores.
- La verificación completa DEBERÍA ejecutarse en minutos. Cuando se vuelva lenta, se DEBE medir
  antes de optimizar.

Motivo: generar código no demuestra que funcione; una verificación lenta deja de ejecutarse.

### X. Usabilidad

- La aplicación DEBE diseñarse primero para móvil (RT-001) y funcionar en las dos últimas versiones
  de Safari para iOS (≥ 16.4) y de Chrome para Android (RNF-013).
- Registrar un consumo DEBE requerir un solo toque, sin pasos adicionales (RF-011), y confirmarse
  en pantalla en 1 s o menos en el percentil 95 con red (RNF-002).
- Toda acción que registra algo DEBE confirmar su resultado con un mensaje anunciado al lector de
  pantalla. Las acciones de un toque DEBEN ofrecer «Deshacer» durante 5 segundos (RF-013, RF-171).
- Una acción con efectos económicos sobre otras personas o difíciles de revertir (reparto de un
  arqueo o un recuento, compra que deja la hucha en negativo, baja con liquidación, anulación) DEBE
  mostrar su efecto y pedir confirmación antes de ejecutarse.
- Cada pantalla DEBE tener como máximo una acción primaria.
- Cada lista y cada pantalla con datos DEBE definir sus estados vacío, cargando, error y sin
  conexión.
- Un mensaje de error DEBE decir en español qué ha pasado y qué puede hacer la persona.
- La interfaz DEBE construirse con los componentes y los tokens del sistema de diseño Latte, en
  tema claro y oscuro. NO DEBE usar colores ni estilos fuera de los tokens.
- La interfaz DEBE estar solo en español (es-ES), con textos centralizados.

Motivo: la aplicación se usa de pie, junto a la cafetera, varias veces al día; si registrar cuesta
más que no hacerlo, los datos dejan de reflejar la realidad.

### XI. Accesibilidad

- La interfaz DEBE cumplir WCAG 2.2 nivel AA (RT-008).
- El texto DEBE tener un contraste de al menos 4,5:1, y los componentes de interfaz y bordes de
  campo, de al menos 3:1, en tema claro y oscuro.
- Los objetivos táctiles DEBEN medir al menos 24 × 24 px CSS; los botones de cápsula, al menos
  44 × 44 px (RNF-001).
- El color NO DEBE ser la única señal de un estado: se acompaña de texto, signo o icono.
- Todo control DEBE tener una etiqueta visible y un nombre accesible, ser operable con teclado y
  mostrar el foco.
- Los mensajes de estado DEBEN anunciarse al lector de pantalla sin mover el foco.
- La interfaz DEBE respetar `prefers-reduced-motion` y `prefers-reduced-transparency`.
- Cada pantalla DEBE superar axe sin infracciones en sus pruebas E2E.
- Una funcionalidad con interfaz nueva DEBE revisarse a mano con VoiceOver (iOS) y TalkBack
  (Android) antes de cerrarse.

### XII. Redacción

- Las especificaciones, los planes, los contratos, los ADR, `ARCHITECTURE.md` y `CLAUDE.md` DEBEN
  redactarse conforme a UNE-ISO 24495-1:2024 y al Español Técnico Simplificado: un término por
  concepto según el glosario, voz activa con sujeto explícito y verbos verificables.

### XIII. Errores, avisos y observabilidad

- Los errores esperados DEBEN expresarse con códigos de un conjunto cerrado y mensajes en español.
- Los errores no previstos DEBEN registrarse con un identificador y NO DEBEN mostrar detalles
  internos al usuario.
- El fallo de un aviso o de una notificación NO DEBE bloquear ni deshacer el registro que lo
  originó.
- Los registros de log DEBEN cumplir el principio XVI.

### XIV. Datos, migraciones y compatibilidad

- Las migraciones de base de datos DEBEN ser solo de avance y NO DEBEN modificarse después de
  aplicarse en un entorno compartido.
- Una migración NO DEBE recalcular cargos ni movimientos ya generados.
- Un cambio en un contrato que reciben clientes con datos en cola DEBE seguir aceptando el formato
  anterior mientras puedan existir esos datos.

Motivo: un móvil puede conservar consumos en su cola sin conexión durante un despliegue.

### XV. Agentes de IA

- Un agente DEBE seguir `CLAUDE.md` y `ARCHITECTURE.md`.
- Un agente NO DEBE romper una regla de esta constitución ni de `ARCHITECTURE.md` en silencio.
  DEBE describir el conflicto y proponer un cambio de diseño o un ADR.
- Un agente NO DEBE modificar esta constitución fuera del comando `/speckit-constitution`.

### XVI. Registro técnico

- El servidor DEBE registrar con `pino` a través de un único archivo (`plataforma/registro.ts`) y el
  cliente con `loglevel` a través de un único archivo (`lib/client/registro.ts`). Ningún otro
  código DEBE escribir en la consola ni importar esas librerías.
- Cada registro DEBE ser un evento JSON con un código estable de un catálogo tipado, un nivel, el
  instante en UTC y el identificador de operación. El significado de un código publicado NO DEBE
  cambiar; un significado nuevo necesita un código nuevo.
- Los campos de un evento DEBEN limitarse a identificadores, códigos, recuentos, duraciones y
  tamaños. Un evento NO DEBE contener nombres, correos, importes, contraseñas, tokens, cookies,
  enlaces de acceso, datos de suscripciones push ni el contenido de un dato recibido o guardado.
  La configuración `redact` DEBE ocultar esas rutas como protección adicional. Única excepción:
  el enlace de RF-139, que se escribe solo en la salida estándar.
- Las peticiones y las ejecuciones de tareas programadas DEBEN correlacionarse con un
  identificador de operación (ULID) generado en el servidor. NO DEBE usarse el token de sesión ni
  un valor derivado de él.
- Un rechazo de negocio esperado DEBE registrarse con su código del conjunto cerrado, sin traza,
  en nivel `info` (o `warn` si es un permiso denegado o un acceso fallido). Un fallo técnico DEBE
  registrarse en nivel `error` con el error serializado; la persona ve el identificador de
  operación como código de incidencia.
- Un dato que no supera su esquema al leerse DEBE generar un evento con su origen, su
  identificador si se puede leer y la ruta del campo, sin copiar su contenido.
- Al arrancar, la aplicación DEBE registrar su versión, el commit, la versión de Node y el nivel de
  registro. Un entorno no válido DEBE registrarse con los nombres de las variables, sin sus
  valores, antes de detenerse.
- Los destinos DEBEN ser la salida estándar y un fichero diario rotado en el volumen, con la
  retención de `historias.md` §10.7. Los logs NO DEBEN incluirse en las copias de seguridad ni
  mostrarse en la aplicación. El nivel DEBE fijarse con `LOG_LEVEL`.
- El cliente DEBE enviar al servidor solo eventos `warn` y `error` del catálogo, mediante un
  endpoint autenticado y validado. NO DEBE guardar eventos ni el nivel en el navegador.
- Las pruebas DEBEN usar un registrador falso que permite comprobar los eventos emitidos y que
  falla si un evento contiene un campo no permitido.
- El log técnico NO DEBE usarse como auditoría de negocio ni para reconstruir datos. La auditoría
  está en `registro_auditoria` y los hechos económicos, en el libro de movimientos.

Motivo: un agente o una persona debe poder entender un fallo desde el fichero de log sin que ese
fichero se convierta en una copia de los datos personales; el repositorio es público y el volumen
comparte disco con la base de datos.

## Tecnologías obligatorias

Estas tecnologías DEBEN usarse en la línea de versión indicada. Una versión de parche o menor
dentro de la línea PUEDE adoptarse sin enmienda. Cambiar de línea, sustituir una tecnología o
añadir otra para el mismo fin DEBE registrarse en un ADR y enmendar esta constitución. Para los
paquetes en `0.x`, la línea es la versión menor (por ejemplo, `0.45.x`). Las versiones exactas las
fija `package-lock.json`; la referencia vigente está en la sección 10.3 de `historias.md`.

| Ámbito | Tecnología | Línea obligatoria |
| --- | --- | --- |
| Entorno de ejecución | Node.js LTS | 24.x |
| Gestor de paquetes | npm, con `package-lock.json` | 11.x |
| Lenguaje | TypeScript en modo estricto | 6.x |
| Framework | SvelteKit con `@sveltejs/adapter-node` | 3.x / 6.x |
| Componentes | Svelte en modo runes | 5.x |
| Empaquetador | Vite | 8.x |
| Estilos | Tailwind CSS | 4.x |
| Primitivas de interfaz | Bits UI | 2.x |
| Iconos | `@lucide/svelte`, importados por ruta | 1.x |
| Base de datos | SQLite mediante `better-sqlite3` | 13.x |
| Acceso a datos y migraciones | Drizzle ORM y drizzle-kit | 0.45.x / 0.31.x |
| Validación | Zod | 4.x |
| Contraseñas | Argon2id con `@node-rs/argon2` | 2.x |
| Notificaciones push | `web-push` (VAPID) | 3.x |
| Imágenes | `sharp` | 0.35.x |
| Copias | `aws4fetch` y `tar` | 1.x / 7.x |
| Tareas programadas | `croner` | 10.x |
| Cola sin conexión | Service worker de SvelteKit e IndexedDB con `idb` | 8.x |
| Identificadores | ULID con `ulid` | 3.x |
| Registro en el servidor | `pino`, `pino-roll` y `pino-pretty` (solo desarrollo) | 10.x / 4.x / 13.x |
| Registro en el cliente | `loglevel` | 1.x |
| Pruebas unitarias y de integración | Vitest con `@vitest/coverage-v8` y `fast-check` | 5.x / 5.x / 4.x |
| Pruebas E2E y accesibilidad | Playwright y `@axe-core/playwright` | 1.x / 4.x |
| Calidad | ESLint, typescript-eslint, eslint-plugin-svelte, Prettier, dependency-cruiser | 10.x / 8.x / 3.x / 3.x / 18.x |
| Despliegue | Imagen Docker en Coolify, una sola instancia | — |

NO DEBE añadirse otro framework, ORM, librería de componentes, librería de estado global, motor de
CSS ni librería de validación. NO DEBEN usarse APIs obsoletas ni funciones experimentales del
framework.

## Restricciones del proyecto

Las restricciones RT-001 a RT-011 de `historias.md` (PWA mobile first, SvelteKit y Tailwind CSS,
Docker y Coolify, SQLite, una sola instancia, contraseñas de 15 caracteres, WCAG 2.2 AA, español,
nombre «beCafé») son obligatorias. Esta constitución las referencia y no las repite.

## Flujo de desarrollo

- Cada funcionalidad sigue el ciclo de SpecKit: specify, clarify, plan, tasks, analyze, implement y
  converge.
- `spec.md` describe QUÉ y POR QUÉ. `plan.md` describe CÓMO, dentro de la arquitectura global.
  `tasks.md` contiene trabajo implementable y aislable.
- Todo `plan.md` DEBE superar la revisión de arquitectura (Architecture Check) de
  `ARCHITECTURE.md` antes de generar tareas.
- Antes de aceptar un traspaso desde `historias.md`, se DEBEN cotejar requisitos y diseño en los dos
  sentidos y conservar los IDs.
- Una dependencia nueva DEBE justificarse en el `plan.md` según `ARCHITECTURE.md`.

## Gobierno

- Esta constitución prevalece sobre cualquier otra práctica del proyecto.
- Una enmienda DEBE hacerse con `/speckit-constitution`, indicar su motivo y versionarse: MAYOR si
  elimina o redefine un principio, MENOR si añade un principio o amplía uno, PARCHE si solo aclara
  la redacción.
- Un cambio de arquitectura que contradiga esta constitución DEBE registrarse en un ADR antes de la
  enmienda.
- Cada revisión de un plan o de un pull request DEBE comprobar el cumplimiento de esta
  constitución.

**Versión**: 1.3.0 | **Ratificada**: 2026-10-21 | **Última enmienda**: 2026-10-21
