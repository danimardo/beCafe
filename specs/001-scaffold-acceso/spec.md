# Feature Specification: Preparación del proyecto y acceso (F1)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-21

**Status**: Aprobada. Revisión 4: añade la aclaración 10, decidida en el análisis de coherencia. El usuario la aprobó el 2026-10-21 (la revisión 3, con las aclaraciones 7 a 9, también el 2026-10-21).

**Input**: User description: "F1 — Acceso, usuarios y privacidad, con la preparación del proyecto (scaffold), según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§6.3, §7.10, §7.12, §7.13, §7.15, §8, §9 y §15). Los IDs se conservan. Las decisiones de esta especificación están recogidas en `historias.md` con CAMBIO-014.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dar de alta y gestionar usuarios (Priority: P1)

Un administrador da de alta a una persona con nombre, correo y rol. La aplicación muestra un enlace de invitación para copiarlo y enviarlo por otro medio, porque la aplicación no envía correos (EXC-003). El administrador también cambia roles, reactiva usuarios dados de baja y genera enlaces de recuperación.

**Why this priority**: sin usuarios nadie usa la aplicación. Todas las demás funcionalidades dependen de esta (§15).

**Independent Test**: un administrador da de alta a una persona, copia el enlace y ve a esa persona activa sin contraseña.

**Acceptance Scenarios**:

1. **Dado** un administrador, **cuando** da de alta a Pedro con nombre, correo y rol, **entonces** Pedro queda activo sin contraseña y la aplicación muestra un enlace de invitación válido 24 horas para copiarlo (CA-130, CA-131; RF-130, RF-131, RN-052).
2. **Dado** un único administrador activo, **cuando** intenta quitarse el rol, **entonces** el sistema lo rechaza (CA-134; RF-134, RN-041, INV-03).
3. **Dados** los dos últimos administradores activos, **cuando** cada uno quita a la vez el rol al otro, **entonces** solo un cambio se aplica y sigue habiendo un administrador activo (EV-040; RN-041, INV-03).
4. **Dado** un único administrador activo, **entonces** la aplicación le recomienda tener al menos dos, sin impedirle continuar (RN-042).
5. **Dado** un usuario dado de baja, **cuando** un administrador lo reactiva, **entonces** vuelve activo con saldo 0 y necesita un enlace nuevo para entrar (CA-136; RF-136, RN-045). Su contraseña anterior deja de valer, y el enlace que genera el administrador es de invitación, válido 24 horas (Clarifications, punto 8).
6. **Dado** un usuario con un enlace pendiente, **cuando** un administrador genera otro enlace para él, **entonces** el anterior deja de ser válido (CA-132; RN-052).
7. **Dado** un miembro sin rol de administrador, **cuando** abre por URL una ruta de administración, **entonces** el servidor le niega el acceso (EV-050; RN-043, RNF-007).
8. **Cuando** un administrador da de alta a un usuario, cambia su rol, lo reactiva o genera un enlace, **entonces** la acción queda en el registro de auditoría con su autor y su fecha (CA-139c; RF-139c).

---

### User Story 2 - Definir la contraseña, entrar y gestionar las sesiones (Priority: P1)

Una persona usa su enlace para definir una contraseña y después entra con su correo y su contraseña. Desde su perfil puede cambiar la contraseña y cerrar la sesión en todos sus dispositivos.

**Why this priority**: es la única forma de entrar en la aplicación.

**Independent Test**: una persona define su contraseña con un enlace válido y entra. Con una contraseña incorrecta recibe el mismo mensaje que con un correo que no existe.

**Acceptance Scenarios**:

1. **Dado** un enlace válido, **cuando** la persona define una contraseña de 14 caracteres, **entonces** se rechaza; con una de 15, se acepta (CA-132; RF-132, RN-047, RN-053).
2. **Dado** un enlace válido, **cuando** la persona define una contraseña de 15 caracteres o más que figura en la lista de bloqueo de contraseñas comunes, **entonces** se rechaza. No se exigen reglas de composición (RN-053, FUENTE-02).
3. **Dado** un enlace usado o caducado, **entonces** la aplicación muestra «Enlace no válido o caducado» (CA-132; RN-052). Un enlace de invitación caduca a las 24 horas; uno de recuperación, a la hora (RN-052).
4. **Dadas** cinco contraseñas incorrectas, **cuando** se hace un sexto intento, aunque sea correcto, **entonces** se rechaza durante 15 minutos. El mensaje no revela si el correo existe (CA-133; RF-133, RN-048).
5. **Dado** un administrador que introdujo la contraseña hace 20 minutos, **cuando** intenta una acción de administrador (por ejemplo, cambiar un rol), **entonces** la aplicación le pide la contraseña antes de continuar (CA-138; RF-138, RN-050). CA-138 usa como ejemplo una baja; la baja es de F4 (ver Clarifications, punto 1).
6. **Cuando** Ana pulsa «Cerrar sesión en todos los dispositivos», **entonces** sus otras sesiones dejan de ser válidas en la siguiente petición (CA-137; RF-137, RN-051).
7. **Cuando** una persona restablece su contraseña con un enlace de recuperación, **entonces** todas sus sesiones dejan de ser válidas (RN-051).
8. Una sesión dura 90 días y se renueva con el uso (RN-049).
9. **Cuando** Ana cambia su contraseña desde el perfil, **entonces** se cierran sus demás sesiones y la del dispositivo donde la cambió sigue abierta (RF-137; Clarifications, punto 9).

---

### User Story 3 - Primer administrador de la instalación (Priority: P1)

En el primer arranque de una instalación sin usuarios, el sistema crea el administrador indicado en la configuración del servidor. El enlace de invitación aparece en el log de la plataforma, pero no se guarda en el fichero de log.

**Why this priority**: sin este paso nadie puede entrar en una instalación nueva.

**Independent Test**: se arranca una base de datos sin usuarios con el administrador inicial configurado. El log de la plataforma muestra el enlace y el fichero de log no lo contiene.

**Acceptance Scenarios**:

1. **Dada** una base de datos sin usuarios con `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_NOMBRE` definidos, **cuando** la aplicación arranca, **entonces** crea el administrador con ese correo y ese nombre, la salida estándar muestra un enlace válido 24 horas y el fichero de log contiene el evento sin el enlace (CA-139; RF-139, DEC-081).
2. **Dados** usuarios existentes, **cuando** la aplicación se reinicia, **entonces** no se crea nada (CA-139).
3. **Dada** una base de datos sin usuarios y sin `ADMIN_INICIAL_EMAIL` o sin `ADMIN_INICIAL_NOMBRE`, **cuando** la aplicación arranca, **entonces** no arranca y registra el nombre de la variable que falta, sin valores (CA-139; RF-139, DEC-104; Clarifications, punto 7).
4. **Cuando** el operador ejecuta en el contenedor el comando de recuperación, **entonces** obtiene un enlace de recuperación para un administrador existente, o crea un administrador nuevo con el correo y el nombre indicados (CA-139; RF-139b).

---

### User Story 4 - Texto de privacidad (Priority: P2)

Antes de usar la aplicación, cada persona lee el texto de privacidad vigente, y lo vuelve a leer cuando cambia la versión.

**Why this priority**: es obligatorio antes de usar la aplicación con datos reales. El contenido está aplazado (PEND-014), pero el comportamiento ya está definido.

**Independent Test**: una persona nueva no puede usar la aplicación hasta pulsar «He leído el texto». Quedan registradas la fecha y la versión.

**Acceptance Scenarios**:

1. **Dado** Pedro, que entra por primera vez, **cuando** define su contraseña, **entonces** ve el texto de privacidad y no puede usar la aplicación hasta pulsar «He leído el texto». Quedan registradas la fecha y la versión (CA-160; RF-160).
2. **Dada** una versión nueva del texto, **cuando** Pedro vuelve a entrar, **entonces** se le muestra otra vez (CA-160; RF-160).
3. **Desde** el perfil, Pedro abre el texto vigente en cualquier momento (CA-160; RF-161).

---

### User Story 5 - Tema y transparencia (Priority: P2)

Cada persona elige en su perfil el tema y si quiere superficies opacas. La preferencia se guarda en el dispositivo.

**Why this priority**: accesibilidad y uso de pie, junto a la cafetera (constitución X, XI y XVIII).

**Independent Test**: cambiar de tema no pierde lo escrito ni el foco. Al activar «Reducir transparencia», las superficies pasan a ser opacas y conservan las mismas acciones.

**Acceptance Scenarios**:

1. **Dado** un móvil en modo oscuro sin preferencia guardada, **entonces** la aplicación se muestra en oscuro con «Automático» seleccionado. Si el sistema pasa a claro durante la sesión, la aplicación cambia sin recargar (CA-180; RF-180).
2. **Dado** un texto a medio escribir, **cuando** Ana elige «Claro», **entonces** el texto y el foco se conservan. Al volver a abrir la aplicación, sigue en claro (CA-180; RF-180).
3. **Cuando** Ana activa «Reducir transparencia», **entonces** todas las superficies pasan a ser opacas y siguen visibles las mismas acciones y datos (CA-181; RF-181).
4. **Dada** la preferencia del sistema de reducir la transparencia, **entonces** las superficies son opacas aunque el ajuste esté desactivado (CA-181; RF-181).
5. **Con** contraste elevado, colores forzados, movimiento reducido, texto al 200 % y 320 px de ancho, la aplicación no pierde texto, límites, foco, contenido ni función (EV-061; RNF-015).

---

### Edge Cases

- Intentos de inicio de sesión fallidos: con 5 el sexto se bloquea; con 4 no. El bloqueo dura 15 minutos: se comprueba justo antes, en el límite y justo después (CA-133; `docs/pruebas.md` §14.2).
- Una contraseña de 14 caracteres se rechaza y una de 15 se acepta (CA-132).
- Un administrador con 15 minutos exactos o con 16 minutos desde su última autenticación (RN-050). El plan fija qué límite es inclusivo.
- Dos cambios de rol simultáneos que dejarían el sistema sin administrador activo (EV-040, INV-03).
- Sin conexión, las acciones de administración no están disponibles. La aplicación dice qué ha pasado y qué puede hacer la persona (EXC-007; constitución X).
- Un usuario dado de baja que intenta entrar con su contraseña anterior se rechaza con el mismo mensaje que un correo inexistente o una contraseña incorrecta (RN-055, RF-133).
- Una persona sin sesión abre una página que requiere sesión: el servidor la envía al inicio de sesión (§10.5: «Todas exigen sesión salvo las de acceso»).

## Requirements *(mandatory)*

### Functional Requirements

**Usuarios y acceso** (§7.10)

- **RF-130**: Un administrador deberá poder dar de alta un usuario con nombre, correo y rol.
- **RF-131**: Un administrador deberá poder generar un enlace de invitación o de recuperación según RN-052, que la aplicación muestra para copiarlo.
- **RF-132**: Mediante un enlace válido, el usuario deberá definir una contraseña que cumpla RN-053.
- **RF-133**: El sistema deberá autenticar con correo y contraseña, aplicar RN-048 y mostrar el mismo mensaje de error si el correo no existe o la contraseña es incorrecta.
- **RF-134**: Un administrador deberá poder cambiar el rol de un usuario, respetando RN-041.
- **RF-136**: Un administrador deberá poder reactivar a un usuario dado de baja.
- **RF-137**: Cada usuario deberá poder cerrar sesión en todos sus dispositivos y cambiar su contraseña desde su perfil.
- **RF-138**: Si una acción de administrador llega sin autenticación en los últimos 15 minutos, el sistema deberá pedir la contraseña antes de ejecutarla.
- **RF-139**: En el primer arranque, y solo si no existe ningún usuario, el sistema deberá crear el administrador indicado en la variable de entorno `ADMIN_INICIAL_EMAIL`, con el nombre de `ADMIN_INICIAL_NOMBRE` (Clarifications, punto 7), y escribir en la salida estándar un enlace de invitación válido 24 horas. El fichero de log guarda el evento sin el enlace (DEC-081). Si no existe ningún usuario y falta alguna de las dos variables, la aplicación no arranca y registra el nombre de la variable (DEC-104).
- **RF-139b**: Un comando ejecutable en el contenedor deberá generar un enlace de recuperación para un administrador existente o crear uno nuevo.
- **RF-139c**: El sistema deberá anotar en el registro de auditoría, con su autor y su fecha, cada alta, cambio de rol, baja, reactivación y enlace generado. La baja se anota con RF-135 (F4).

**Privacidad** (§7.13)

- **RF-160**: Cuando un usuario entra por primera vez, o cuando la versión vigente del texto de privacidad no coincide con la última que leyó, la aplicación deberá mostrarle el texto (anexo A) y registrar la fecha y la versión leídas antes de permitirle continuar.
- **RF-161**: El perfil deberá incluir un enlace permanente al texto de privacidad vigente.

**Experiencia transversal** (§7.15)

- **RF-180**: El cliente deberá ofrecer en Perfil el tema Automático, Claro u Oscuro, con Automático como valor inicial. Automático deberá seguir la apariencia del dispositivo y actualizarse si cambia durante la sesión. La preferencia se guarda en el dispositivo, y cambiarla no pierde datos escritos ni foco.
- **RF-181**: El cliente deberá ofrecer en Perfil el ajuste «Reducir transparencia», desactivado por defecto, que muestra todas las superficies opacas con las mismas acciones e información. Si el dispositivo pide reducir la transparencia, las superficies son opacas aunque el ajuste esté desactivado. La preferencia se guarda en el dispositivo.

**Configuración** (§15, sin pantalla)

- **Almacén de configuración**: el sistema deberá guardar los parámetros de RF-150 con sus valores por defecto: plazo de autoanulación de 15 minutos (RN-032), límite de deuda de −5 € (RN-074) e intervalo mínimo entre rellenos de 60 minutos (RN-082). La pantalla para modificarlos es de F7.

**Reglas de negocio** (§6.3): RN-040 a RN-053 y RN-055 se aplican en esta funcionalidad, como se indica en los escenarios. Hay tres reglas que se citan aquí pero se comprueban con la funcionalidad que tiene el comportamiento:
- RN-044, la baja con saldo 0: con RF-135, en F4.
- RN-046, la conservación de los datos de las bajas: se cumple porque F1 no borra usuarios.
- RN-054, el rechazo de consumos de un usuario dado de baja: con EV-041, en F3 y F4.

### Non-Functional Requirements

- **RNF-001**: Cada pantalla nueva cumple WCAG 2.2 AA y supera axe en tema claro y oscuro. Las pantallas nuevas son inicio de sesión, definición de contraseña, perfil, privacidad y administración de usuarios.
- **RNF-004**: Las contraseñas se guardan con Argon2id, con m ≥ 19 MiB, t ≥ 2 y p = 1.
- **RNF-005**: La cookie de sesión es `HttpOnly`, `Secure` y `SameSite=Lax`. El identificador de sesión es aleatorio y se guarda como hash (ver Clarifications, punto 10).
- **RNF-006**: Las acciones que modifican datos solo aceptan peticiones del mismo origen.
- **RNF-007**: Todos los permisos se comprueban en el servidor (EV-050).
- **RNF-012**: Toda la interfaz está en español, con los textos centralizados.
- **RNF-013**: Funciona en las dos últimas versiones de Safari (iOS ≥ 16.4) y de Chrome (Android).
- **RNF-014**: Registro técnico de servidor y de cliente, visible en la plataforma y guardado en ficheros diarios durante 30 días. Los errores del móvil llegan al mismo log, y hay un endpoint de salud (DEC-076 a DEC-082; ver Clarifications, punto 2).
- **RNF-015**: Adaptación a contraste elevado, colores forzados, texto al 200 % y 320 px (EV-061).
- **RNF-016**: La aplicación no aparece en buscadores: `/robots.txt` responde `Disallow: /` y todas las respuestas llevan la cabecera `X-Robots-Tag: noindex, nofollow` (DEC-102).
- Todas las acciones con formulario funcionan sin JavaScript cuando hay conexión (constitución XVII).

### Preparación del proyecto (scaffold)

Este bloque no añade comportamiento para la persona usuaria. Deja el proyecto listo para F1 y para las funcionalidades siguientes:

- La plantilla de `design-system/` se mueve a la raíz con `git mv` (DEC-055). Las reglas de `design-system/AGENTS.md` pasan a `docs/diseno/` (`docs/agentes.md` §8).
- Los scripts y las comprobaciones funcionan igual en Windows y en Linux (DEC-056, DEC-101).
- `npm run verify` existe, y la integración continua lo ejecuta en cada pull request y en cada cambio de `main` (DEC-060).
- Se preparan las pruebas T-TEST-001 a T-TEST-006 y T-TEST-008 (`docs/pruebas.md` §23). T-TEST-007 se ejecuta al cerrar F1.
- El registro técnico de servidor y de cliente, `/api/registro-cliente` y `/api/salud` quedan en funcionamiento (RNF-014, constitución XVI, ADR-0004). Su plan resuelve PEND-034 (límites de `/api/registro-cliente`), PEND-035 (versión y commit) y PEND-036 (directorio de datos en desarrollo).
- Al terminar la preparación se actualiza el apartado «Estado del repositorio» de `AGENTS.md`.

El plan justifica cada herramienta y cada pieza (constitución II).

### Out of Scope

- La baja con liquidación (RF-135, CA-135, EV-041): es de F4 (§15).
- La pantalla de configuración (pantalla de RF-150, CA-150): es de F7.
- El envío de correos de invitación o de recuperación (EXC-003).
- El inicio de sesión corporativo (SSO) y la autenticación multifactor (EXC-008).
- Las acciones de administración sin conexión (EXC-007).
- El seudonimizado y el borrado de los datos de las personas dadas de baja (EXC-011).

### Key Entities

- **Usuario**: nombre, correo, rol (miembro o administrador), estado (activo o dado de baja), intentos fallidos y bloqueo, versión y fecha del texto de privacidad leído (RN-040, RN-048, RF-160).
- **Sesión**: usuario, instante de creación, de último uso y de última autenticación, y caducidad (RN-049 a RN-051).
- **Enlace de acceso**: usuario, tipo (invitación o recuperación), caducidad, uso y anulación, y autor (RN-052).
- **Configuración**: parámetro, valor, autor y fecha del último cambio (RF-150).
- **Registro de auditoría**: autor, acción, objeto y fecha de cada acción de administración (glosario).
- **Preferencias de apariencia**: tema y «Reducir transparencia». Se guardan solo en el dispositivo (RF-180, RF-181; constitución V).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-130 a CA-134, CA-136 a CA-139 y CA-139c**: cada criterio de aceptación de F1 tiene al menos una prueba que lo nombra y pasa.
- **CA-160, CA-180 y CA-181**: tienen sus pruebas y pasan.
- **EV-040**: con dos cambios de rol simultáneos, nunca queda el sistema sin administrador activo.
- **EV-050**: ninguna ruta de administración responde con su contenido a un miembro.
- **EV-061**: las pantallas de F1 superan las comprobaciones en tema claro, tema oscuro, contraste elevado, colores forzados y movimiento reducido.
- **RNF-001**: cada pantalla nueva supera axe sin infracciones en tema claro y oscuro.
- **RNF-016**: `/robots.txt`, `/login` y una ruta con sesión indican que no deben indexarse.
- **CA-139**: el fichero de log nunca contiene un enlace de acceso.
- **Verificación completa**: pasa en serie al cerrar F1 (constitución IX).

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-130, CA-131 (RF-130, RF-131) | Alta sin enlace o con enlace de otra duración | Alta de Pedro: activo, sin contraseña, enlace de 24 h | Integración + E2E (invitación) | Prevista |
| CA-132 (RF-132, RN-047, RN-052, RN-053) | Contraseña débil aceptada; enlace reutilizado | 14 y 15 caracteres; contraseña de la lista de bloqueo; enlace usado, caducado o sustituido | Integración + E2E (primera contraseña) | Prevista |
| CA-133 (RF-133, RN-048, RN-055) | Ataque por fuerza bruta; descubrir qué correos existen | 4, 5 y 6 intentos; 15 min antes, en el límite y después, con reloj fijo; mismo mensaje, también para un usuario dado de baja | Integración | Prevista |
| CA-134, EV-040 (RF-134, RN-041, INV-03) | Sistema sin administrador | Último administrador se quita el rol; dos cambios simultáneos | Integración con concurrencia | Prevista |
| CA-136 (RF-136, RN-045) | Reactivado con saldo distinto de 0 o con acceso antiguo | Reactivación: activo, saldo 0, sin enlace válido | Integración | Prevista |
| CA-137 (RF-137, RN-051) | Sesión robada que sigue viva | Cerrar sesión en todos los dispositivos; restablecer la contraseña | Integración + E2E (cierre global) | Prevista |
| CA-138 (RF-138, RN-050) | Acción de administrador desde una sesión olvidada | 15 y 16 minutos desde la última autenticación, con reloj fijo | Integración | Prevista |
| CA-139 (RF-139, RF-139b, DEC-081) | Enlace de acceso en un fichero persistente; doble administrador inicial | Arranque sin usuarios, reinicio con usuarios, falta la variable, comando de recuperación | Integración (registrador falso) | Prevista |
| CA-139c (RF-139c) | Acción de administración sin rastro | Alta, rol, reactivación y enlace: cada uno deja una fila con su autor | Integración | Prevista |
| CA-160 (RF-160, RF-161) | Uso sin leer el texto vigente | Primera entrada; versión nueva; enlace desde el perfil | Integración + E2E | Prevista |
| CA-180, CA-181, EV-061 (RF-180, RF-181, RNF-015) | Pérdida de trabajo o de foco; efecto que el sistema pide reducir | Cambio de tema con texto escrito; transparencia del sistema | Unidad (lectura validada) + suite `a11y`; revisión manual de la transparencia del sistema | Prevista |
| EV-050 (RNF-007, RN-043) | Acceso de un miembro a la administración | Cada ruta de `/admin/usuarios` con rol miembro | Suite `acceso` | Prevista |
| RNF-001 | Pantalla no accesible | Inicio de sesión, contraseña, perfil, privacidad, usuarios | Suite `a11y`, claro y oscuro; VoiceOver y TalkBack antes de cerrar | Prevista |
| RNF-016 | Indexación por buscadores | `/robots.txt`, `/login`, ruta con sesión | Suite `api` | Prevista |
| RNF-004, RNF-005, RNF-006 | Contraseña o sesión débiles; CSRF | Parámetros de Argon2id; atributos de la cookie; petición de otro origen | Inspección + integración | Prevista |
| RNF-014 (constitución XVI) | Datos personales o enlaces en el log | Eventos con campos no permitidos | Integración con registrador falso | Prevista |

## Assumptions

- PEND-014 es una dependencia previa a producción. F1 muestra el anexo A como versión 1 del texto, con sus marcadores entre corchetes, y no se usa con datos reales hasta cerrar PEND-014.
- El saldo de un usuario reactivado es 0 porque F1 todavía no tiene movimientos. La comprobación de RN-045 con movimientos reales se hace en F4.
- Los textos de la interfaz que no fijan `historias.md` ni el sistema de diseño los propone el plan, en español y centralizados (RNF-012).

## Clarifications

### Session 2026-10-21

1. **RF-135 (baja con liquidación).** Se queda en F4, como dice §15. Una respuesta anterior lo había llevado a F1 porque la pregunta afirmaba, por error, que no estaba asignado a ninguna funcionalidad.
2. **RNF-014 (registro técnico y salud).** Entra en F1 como parte de la preparación. PEND-034 a PEND-036 ya se resolvían en el plan de F1 (DEC-103).
3. **Auditoría de administración.** Entra en F1 como RF-139c, con CA-139c (DEC-103).
4. **`ADMIN_INICIAL_EMAIL` sin usuarios.** Si falta, la aplicación no arranca y registra el nombre de la variable (constitución VI). Con usuarios existentes, la variable no se usa (DEC-104).
5. **RF-137 y RF-138.** Entran en F1 (DEC-103). HU-13 los cubría, pero §15 no los asignaba a ninguna funcionalidad (HALL-016).
6. **Inicio de sesión de un usuario dado de baja.** Se rechaza con el mensaje genérico de RF-133, sin revelar que la cuenta existe ni que está de baja (RN-055).
7. **Nombre del primer administrador.** Sale de la variable `ADMIN_INICIAL_NOMBRE`, que, como `ADMIN_INICIAL_EMAIL`, solo es obligatoria si no hay usuarios. El comando de RF-139b recibe el nombre como argumento al crear un administrador. Motivo: ningún requisito permite cambiar un nombre desde la aplicación.
8. **Enlace al reactivar.** La reactivación borra la contraseña anterior. Un usuario sin contraseña recibe un enlace de invitación (24 horas), y uno con contraseña, de recuperación (1 hora), según RN-052.
9. **Cambio de contraseña desde el perfil.** Cierra las demás sesiones de la persona y mantiene la sesión actual.
10. **Atributo `Secure` de la cookie (RNF-005).** La cookie lleva `Secure` siempre que `ORIGIN` usa https. Solo un `ORIGIN` `http://localhost` o `http://127.0.0.1`, para desarrollo y E2E locales, la emite sin `Secure`, porque WebKit no acepta cookies `Secure` en http. Con cualquier otro `ORIGIN` http, la aplicación no arranca.

Los puntos 1 a 6 están recogidos en `historias.md` 0.14.0 (CAMBIO-014: DEC-103, DEC-104, RF-139c, CA-139c, RN-055 y HALL-016).
