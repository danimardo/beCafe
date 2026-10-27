# Feature Specification: Descargar copias, copia manual, origen y registro de restauración (F17)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-27

**Status**: Aprobada por la persona usuaria el 2026-10-27 y traspasada a `historias.md` v0.29.0 (CAMBIO-029).

**Input**: User description: «En /admin/copias no puedo descargar las copias ni hacer una copia yo de forma proactiva. Quiero ver en qué sistema se hizo cada copia (localhost o un dominio de producción). Y quiero más registros técnicos para seguir las migas de pan cuando una importación falla en otro sistema.»

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-27 (apartado «Clarifications»). La persona usuaria autorizó el cambio en `historias.md` (CAMBIO-029, con respaldo en `.respaldos/`); aplicado el 2026-10-27, con la especificación y el plan aprobados.

**Glosario de esta funcionalidad**:

- **Copia manual**: copia de seguridad que un administrador lanza desde la pantalla de copias. Tiene el mismo contenido que la diaria (RF-140): base de datos y fotos.
- **Origen de una copia**: sistema donde se hizo, identificado por el dominio de su `ORIGIN` (por ejemplo `becafe.mardomingo.com`). `localhost` y `127.0.0.1` se muestran como «Local».
- **Identificador de restauración**: ULID que comparten todos los eventos técnicos de una misma restauración, también los posteriores al reinicio, para seguirlos en el log.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descargar una copia del bucket (Priority: P1)

Un administrador abre «Copias de seguridad», ve la lista del bucket y pulsa «Descargar» en la copia del 25-10-2026. El navegador guarda el archivo `.tar.gz`.

**Why this priority**: es la primera petición. Sin descarga no se puede importar una copia en otro sistema ni guardarla fuera del bucket.

**Independent Test**: con un bucket falso con una copia, pedir la descarga como administrador y como miembro, y comprobar el contenido, las cabeceras y la auditoría.

**Acceptance Scenarios**:

1. **Given** una copia en la lista, **When** un administrador pulsa «Descargar», **Then** recibe el archivo íntegro con su nombre original y la descarga queda en el registro de auditoría.
2. **Given** un miembro o una persona sin sesión, **When** pide la descarga, **Then** recibe 403 o la redirección al acceso y no se descarga nada.
3. **Given** una copia que ya no está en el bucket, **When** se pide su descarga, **Then** la persona lee un error en español y la lista no cambia.
4. **Given** una clave que no es de una copia de la aplicación, **When** se pide su descarga, **Then** el servidor la rechaza sin consultar el bucket.
5. **Given** que no hay S3 configurado, **When** un administrador abre la pantalla, **Then** no ve «Descargar» y se le explica que hace falta configurarlo (RF-253).

---

### User Story 2 - Hacer una copia ahora (Priority: P1)

Antes de una operación delicada, un administrador pulsa «Hacer copia ahora», confirma y, unos segundos después, ve en la lista una copia nueva con la etiqueta «Manual» y su botón «Descargar».

**Why this priority**: es la segunda petición. Hoy solo existe la copia de las 03:00.

**Independent Test**: lanzar la copia manual con un bucket falso, comprobar que aparece en la lista con la etiqueta, y lanzar dos a la vez para comprobar que la segunda se rechaza.

**Acceptance Scenarios**:

1. **Given** S3 configurado, **When** un administrador confirma «Hacer copia ahora», **Then** el servidor hace la copia, la sube al bucket, la registra como manual y la lista la muestra con la etiqueta «Manual».
2. **Given** una copia en curso (manual o diaria), **When** otro administrador lanza una, **Then** la segunda no se ejecuta y se le explica que hay una en curso.
3. **Given** un fallo al hacer o subir la copia, **When** termina el intento, **Then** la persona lee en español qué ha pasado y qué puede hacer, y el servidor sigue aceptando registros.
4. **Given** el botón sin JavaScript, **When** se envía el formulario, **Then** la copia se hace igual y la pantalla muestra el resultado.
5. **Given** un miembro, **When** intenta lanzar la copia, **Then** recibe 403 y no se hace nada.
6. **Given** una copia manual, **When** termina, **Then** el registro de auditoría guarda quién la lanzó y cuándo.

---

### User Story 3 - Saber dónde se hizo cada copia (Priority: P2)

Al restaurar en producción una copia hecha en `localhost`, el administrador lee en la lista «Origen: Local» y, en la confirmación, «Esta copia se hizo en Local; este sistema es becafe.mardomingo.com».

**Why this priority**: evita restaurar por error datos de pruebas sobre producción y explica los fallos al importar entre sistemas.

**Independent Test**: hacer copias con dos valores de `ORIGIN` y comprobar lo que muestran la lista y la confirmación, incluida una copia anterior sin origen.

**Acceptance Scenarios**:

1. **Given** una copia hecha con `ORIGIN=http://localhost:3000`, **When** se abre la lista, **Then** muestra «Local».
2. **Given** una copia hecha con `ORIGIN=https://becafe.mardomingo.com`, **When** se abre la lista, **Then** muestra `becafe.mardomingo.com`.
3. **Given** una copia anterior a esta funcionalidad, **When** se abre la lista, **Then** muestra «Origen no registrado».
4. **Given** una copia de otro origen que el del sistema actual, **When** el administrador abre la confirmación de restaurar, **Then** ve ambos orígenes antes de confirmar. Restaurar sigue permitido.

---

### User Story 4 - Seguir las migas de pan de una restauración (Priority: P2)

Un administrador restaura en otro sistema una copia que falla. Quien mantiene el servidor abre el log, filtra por el identificador de restauración y lee cada paso con su resultado hasta el que falló, con su código.

**Why this priority**: la persona usuaria tiene problemas al importar y hoy los registros no bastan para encontrar la causa.

**Independent Test**: provocar un fallo en cada paso de la restauración (EV-113) y comprobar que el último evento con el identificador indica el paso y el código, sin datos personales.

**Acceptance Scenarios**:

1. **Given** una restauración completa, **When** se revisa el log, **Then** hay un evento por cada paso, todos con el mismo identificador de restauración, también tras el reinicio.
2. **Given** un fallo en un paso, **When** se revisa el log, **Then** el último evento indica el paso, el código del fallo y la duración, y los pasos posteriores no aparecen.
3. **Given** una copia de otro origen o de una versión de esquema distinta, **When** se verifica, **Then** el log recoge el origen de la copia, el origen del sistema y las versiones de esquema comparadas.
4. **Given** cualquier evento de esta funcionalidad, **When** se inspecciona, **Then** no contiene nombres, correos, importes, claves de S3 ni el contenido de la copia (constitución XVI).

---

### Edge Cases

- Dos administradores pulsan «Hacer copia ahora» a la vez: una sola copia (RF-286).
- La copia manual coincide con las 03:00: la copia diaria no depende de la manual y se hace igual. Solo la manual se rechaza si hay otra copia en curso (RF-286).
- Un archivo muy grande: la descarga se entrega en flujo, sin cargarlo entero en memoria.
- La copia diaria y la manual comparten clave de bucket sin pisarse: cada una lleva su instante.
- Descargar o restaurar una copia de resguardo (RF-255) funciona igual que con las demás.
- La restauración que se interrumpe con el reinicio conserva su identificador en la marca de restauración.

## Requirements *(mandatory)*

### Functional Requirements

- **RF-284**: La lista de copias del bucket deberá ofrecer a un administrador un enlace «Descargar» por cada copia. El servidor deberá comprobar sesión y permiso de administrador en el caso de uso, validar la clave con su esquema, bajarla del bucket y entregarla en flujo con su nombre original y `Cache-Control: no-store`.
- **RF-285**: Cada descarga de una copia deberá quedar en el registro de auditoría con la persona, la copia y el instante, y emitir un evento técnico sin datos personales. La copia contiene toda la base de datos: solo los administradores pueden descargarla.
- **RF-286**: La pantalla deberá ofrecer a un administrador «Hacer copia ahora», con confirmación previa que explique que se sube una copia completa al bucket. El servidor deberá hacer y subir una copia con el mismo contenido y proceso que la diaria (RF-140), registrarla como manual y no ejecutar dos copias manuales a la vez ni una manual con otra copia en curso. La copia diaria no depende de la manual.
- **RF-287**: La lista deberá marcar con la etiqueta «Manual» las copias hechas con RF-286, junto a la etiqueta de resguardo ya existente (RF-253). El registro de auditoría deberá guardar quién la lanzó.
- **RF-288**: Sin S3 configurado, la pantalla deberá explicar que hace falta configurarlo y no ofrecer «Descargar» ni «Hacer copia ahora» (precisa RF-253).
- **RF-289**: Cada copia nueva (diaria, manual o de resguardo) deberá guardar su origen, el dominio de `ORIGIN`. La lista deberá mostrarlo («Local» para `localhost` y `127.0.0.1`) y, en las copias anteriores, mostrar «Origen no registrado».
- **RF-290**: La confirmación de restaurar (RF-254) deberá mostrar el origen de la copia y el del sistema actual. Si difieren, deberá destacarlo con texto y con icono, sin impedir la restauración.
- **RF-291**: Cada paso de una copia manual, una descarga y una restauración (RF-255, RF-256) deberá emitir un evento técnico con su código estable, duración y tamaño cuando proceda. Todos los eventos de una restauración deberán llevar el mismo identificador de restauración, también los posteriores al reinicio. Un fallo deberá emitir el paso y el código del fallo.
- **RF-292**: La verificación de una copia (RF-255 c) deberá registrar el origen de la copia, el origen del sistema y las versiones de esquema comparadas, sin datos personales ni contenido de la copia.

### Non-Functional Requirements

- **RNF-F17-1**: Los eventos técnicos solo llevan identificadores, códigos, recuentos, duraciones y tamaños (constitución XVI). El dominio de origen se trata como identificador; ninguna clave de S3 ni dato de la copia se escribe.
- **RNF-F17-2**: La descarga y la copia manual no bloquean los registros de consumo ni otras pantallas. La copia manual no se hace dentro de una transacción de negocio.
- **RNF-F17-3**: La descarga se entrega en flujo y no mantiene el archivo entero en memoria.

### Out of Scope

- Descargar o hacer copias sin S3 (decisión de la persona usuaria).
- Subir un archivo de copia desde el navegador para restaurarlo: la restauración sigue partiendo de una copia del bucket (RF-254).
- Borrar copias del bucket y cambiar su retención (RF-141).
- Tope de copias manuales por día.
- Cifrar las copias descargadas.

### Key Entities

- **Copia de seguridad**: ya existe (`copia_seguridad`). Se añaden su tipo (diaria, manual o resguardo) y su origen. El plan decide si el origen y el tipo viven en la fila, en el bucket o en ambos.
- **Identificador de restauración**: ULID generado al iniciar una restauración y guardado en la marca que sobrevive al reinicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador descarga cualquier copia de la lista con un solo toque.
- **SC-002**: Un administrador obtiene una copia nueva en la lista con dos toques (botón y confirmación).
- **SC-003**: Desde el identificador de restauración, quien mantiene el servidor localiza el paso que falló en una sola búsqueda en el log.
- **SC-004**: Ningún miembro que no sea administrador puede descargar ni lanzar copias (prueba de permisos).

### Criterios de aceptación propuestos

- **CA-284**: Un administrador descarga una copia íntegra; un miembro y una persona sin sesión no pueden; una clave no válida se rechaza (RF-284).
- **CA-285**: Cada descarga deja auditoría y evento técnico sin datos personales (RF-285).
- **CA-286**: «Hacer copia ahora» sube una copia completa; dos a la vez no se ejecutan; un fallo se explica y el servidor sigue aceptando registros; funciona sin JavaScript (RF-286).
- **CA-287**: La copia manual aparece con la etiqueta «Manual» y su auditoría guarda quién la lanzó (RF-287).
- **CA-288**: Sin S3 no hay «Descargar» ni «Hacer copia ahora» y se explica por qué (RF-288).
- **CA-289**: La lista muestra el origen de cada copia, «Local» en localhost y «Origen no registrado» en las antiguas (RF-289).
- **CA-290**: La confirmación de restaurar muestra ambos orígenes y destaca la diferencia sin bloquear (RF-290).
- **CA-291**: Cada paso emite su evento con el mismo identificador de restauración, también tras el reinicio, y un fallo indica el paso y el código (RF-291).
- **CA-292**: La verificación registra origen de la copia, origen del sistema y versiones de esquema (RF-292).

### Escenarios de verificación propuestos

- **EV-117**: Fallo inyectado en cada paso de una restauración (ampliando EV-113): el último evento con el identificador de restauración nombra el paso y el código, y ningún evento contiene un campo no permitido (RF-291, RF-292).

## Impacto en las fuentes vigentes

Cambios de `historias.md` (CAMBIO-029), que se aplican con respaldo en `.respaldos/` al aprobar esta especificación:

- **Nuevos**: RF-284 a RF-292, CA-284 a CA-292, EV-117 y DEC-140 (descarga por `+server.ts` solo para administradores, con auditoría).
- **Modificados**:
  - RF-143 y RF-253: la lista incluye «Descargar», las etiquetas y el origen.
  - RF-254 y RF-255: la confirmación muestra los orígenes y cada paso emite eventos.
  - Glosario: «Copia manual», «Origen de una copia», «Identificador de restauración».
- `ARCHITECTURE.md`: el plan fija el módulo (`copias`), la ruta de descarga y los eventos nuevos del catálogo (§9).
- **Constitución**: sin enmienda. Se propone un ADR en `docs/adr/` que justifique el `+server.ts` de descarga. Hay precedente en las rutas de fotos (V).
- **Catálogo de eventos** (`plataforma/registro.ts`): eventos nuevos para los pasos de copia manual, descarga y restauración. Su significado no cambia una vez publicado (XVI).

## Assumptions

- «Sistema» se identifica por el dominio de `ORIGIN`, que ya es obligatorio y está validado (`src/env.ts`). Un cambio de dominio de producción aparecerá como otro origen.
- Las copias anteriores no se reescriben: no se pueden etiquetar con certeza (XIV).
- La copia manual comparte el empaquetado, la subida y el límite de 30 días del bucket con la diaria (RF-141).
- El nombre del archivo descargado es el de la copia en el bucket.
- Los eventos técnicos nuevos usan niveles `info` (pasos) y `error` (fallos), según la constitución XVI.

## Clarifications

### Session 2026-10-27

- **Q**: ¿De dónde se descarga y qué se ofrece? → **A**: Cada copia de la lista del bucket, con «Descargar». Necesita S3.
- **Q**: ¿Qué hace «Hacer copia ahora»? → **A**: Sube al bucket y ofrece descargarla. Requiere S3.
- **Q**: ¿Cómo se marcan las manuales y cuántas se permiten? → **A**: Etiqueta «Manual» y una a la vez, sin tope diario.
- **Q**: ¿Se puede cambiar `historias.md`? → **A**: Sí, con su respaldo (CAMBIO-029).
- **Q**: ¿Endpoint de descarga como `+server.ts` con ADR? → **A**: Sí.
- **Q**: ¿Solo administradores, con auditoría y `Cache-Control: no-store`? → **A**: Sí.
- **Q**: ¿Ver en qué sistema se hizo cada copia? → **A**: Sí: localhost o el dominio de producción.
- **Q**: ¿Más registros técnicos para seguir una importación fallida? → **A**: Sí.

## Modificación 2026-10-27: listado único y retirada de las pruebas de restauración (CAMBIO-030)

**Origen.** La persona usuaria ve la pantalla `/admin/copias` como un «batiburrillo»: las mismas copias salen tres veces (estado, lista del bucket y lista de «Restaurar») y hay una sección para anotar pruebas de restauración que no quiere. Aprobó el cambio en la sesión del 2026-10-27, incluida la enmienda 1.10.0 de la constitución (principio V) y el CAMBIO-030 en `historias.md` v0.30.0. Se tramita aquí y no como funcionalidad nueva.

### Requisitos modificados (sin IDs nuevos)

- **RF-143**: las copias se consultan en un único listado, con descarga, restauración y «Hacer copia ahora».
- **RF-253**: un único listado, de la más reciente a la más antigua, con un máximo de 30 copias y paginación de 8 en 8 (`<form method="get">`, funciona sin JavaScript). Cada fila muestra fecha y hora de Madrid, tamaño, etiqueta (Diaria, Manual, Resguardo o Fallida), origen y los botones «Descargar» y «Restaurar» juntos. Una copia fallida (solo existe en local) sale en el mismo listado con la etiqueta «Fallida» y sin botones. Sin S3, la pantalla lo explica y no ofrece botones. El enlace de vuelta dice «Volver a Administración».
- **RF-275**: «Hacer copia ahora» con fondo de acento suave y el listado sobre superficie elevada con borde, cada uno con su icono. Desde 1024 px hay dos columnas: acciones a la izquierda y listado a la derecha (`DosColumnas`, RF-261). La zona de advertencia de restaurar pasa a la pantalla de confirmación.
- **RNF-009**: «RPO ≤ 24 h; retención 30 días». Sin prueba trimestral.

### Requisitos retirados

RF-144 (aviso de 100 días), RF-257 («Anotar una prueba de restauración»), CA-144, CA-257 y EV-070. Se elimina también la tabla `prueba_restauracion` con una migración de solo avance.

### Criterios de aceptación modificados

- **CA-143**: el administrador ve un único listado con «Descargar» y «Restaurar» en cada fila y ninguna sección de pruebas ni aviso de 100 días.
- **CA-253**: con 20 copias, la primera página muestra 8, la tercera 4 y no hay más de 30 en total. Una copia fallida aparece con «Fallida» y sin botones. Sin S3, no hay botones.
- **CA-275**: «Hacer copia ahora» y el listado tienen su fondo y su icono, desde 1024 px hay dos columnas y la pantalla pasa axe en claro y oscuro.

### Fuera de alcance de esta modificación

La confirmación de restaurar (RF-254), la descarga (RF-284) y la copia manual (RF-286) no cambian de comportamiento. Las auditorías y los eventos técnicos existentes se conservan.

### Decisiones de la persona usuaria (2026-10-27)

- La tabla `prueba_restauracion` se borra con una migración.
- Las copias fallidas van en el mismo listado, con la etiqueta «Fallida».
- Se muestra solo la lista del bucket (lo restaurable) más las fallidas locales, sin duplicados.
- Máximo de 30 copias, paginadas de 8 en 8.
