# Feature Specification: Preparación del proyecto y acceso (F1)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-21

**Status**: Draft (propuesta; no aprobada, AGENTS.md §2)

**Input**: User description: "F1 — Acceso, usuarios y privacidad, con su preparación del proyecto (scaffold), según historias.md §15"

**Fuente**: `historias.md` v0.13.0. Los IDs se conservan al traspasar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dar de alta y gestionar usuarios (Priority: P1)

Un administrador da de alta a una persona con nombre, correo y rol, y genera para ella un enlace de invitación que la aplicación muestra para copiarlo. Puede cambiar el rol de un usuario y reactivar a un usuario dado de baja.

**Why this priority**: sin usuarios no hay uso de la aplicación; todo lo demás depende de esta gestión.

**Independent Test**: un administrador da de alta a una persona, copia el enlace y ve a esa persona activa sin contraseña.

**Acceptance Scenarios**:

1. **Given** un administrador, **When** da de alta a una persona con nombre, correo y rol, **Then** la persona queda activa sin contraseña y la aplicación muestra un enlace de invitación válido 24 horas (CA-130, CA-131; RF-130, RF-131, RN-052).
2. **Given** un único administrador activo, **When** intenta quitarse el rol, **Then** el sistema lo rechaza (CA-134; RF-134, RN-041).
3. **Given** un usuario dado de baja, **When** un administrador lo reactiva, **Then** vuelve activo con saldo 0 y necesita un enlace nuevo para entrar (CA-136; RF-136, RN-045).
4. **Given** Luis con saldo −6,00 € que no paga, **When** un administrador lo da de baja registrando deuda incobrable, **Then** Luis queda con saldo 0 y dado de baja, se reparten 6,00 € en cargos entre los demás activos y sus sesiones quedan invalidadas (CA-135; RF-135, RN-017, RN-044, RN-046).
5. Solo un administrador puede dar de alta, dar de baja, reactivar y cambiar el rol de un usuario (RN-043). Un miembro que accede por URL a una ruta de administración no la ve (EV-050).

---

### User Story 2 - Definir la contraseña y entrar (Priority: P1)

Una persona usa su enlace válido para definir una contraseña y, después, entra con correo y contraseña.

**Why this priority**: es la única forma de entrar en la aplicación.

**Independent Test**: una persona define una contraseña con un enlace válido y entra; con otra contraseña incorrecta recibe el mismo mensaje que con un correo inexistente.

**Acceptance Scenarios**:

1. **Given** un enlace válido, **When** la persona define una contraseña de 14 caracteres, **Then** se rechaza; de 15, se acepta (CA-132; RF-132, RN-047, RN-053).
2. **Given** un enlace usado o caducado, **Then** la aplicación muestra «Enlace no válido o caducado». Generar un enlace nuevo invalida el anterior (CA-132; RN-052).
3. **Given** cinco contraseñas incorrectas, **When** se intenta un sexto inicio de sesión, aunque sea correcto, **Then** se rechaza durante 15 minutos con un mensaje que no revela si el correo existe (CA-133; RF-133, RN-048).
4. Una sesión dura 90 días y se renueva con el uso (RN-049). Restablecer la contraseña o dar de baja invalida todas las sesiones del usuario (RN-051).
5. **Given** un administrador que introdujo la contraseña hace 20 minutos, **When** intenta registrar una baja, **Then** la aplicación le pide la contraseña antes de continuar (CA-138; RF-138, RN-050).
6. **Given** Ana pulsa «Cerrar sesión en todos los dispositivos», **Then** sus otras sesiones dejan de ser válidas en la siguiente petición (CA-137; RF-137, RN-051).

---

### User Story 3 - Primer administrador de la instalación (Priority: P1)

Al primer arranque de una instalación sin usuarios, el sistema crea el administrador indicado en configuración y deja un enlace de invitación en el log del servicio, sin guardarlo en el fichero de log.

**Why this priority**: sin este paso nadie puede entrar en una instalación nueva.

**Independent Test**: se arranca una base sin usuarios con el administrador configurado; el log de la plataforma muestra el enlace y el fichero de log no lo contiene.

**Acceptance Scenarios**:

1. **Given** una base sin usuarios y el administrador configurado, **When** la aplicación arranca, **Then** crea el administrador y la salida estándar muestra un enlace válido 24 horas (CA-139; RF-139).
2. **Given** un reinicio con usuarios existentes, **Then** no se crea otro administrador ni se genera enlace (CA-139; RF-139).
3. Un comando ejecutable en el contenedor genera un enlace de recuperación para un administrador existente o crea uno nuevo (RF-139b; CA-139).

---

### User Story 4 - Texto de privacidad (Priority: P2)

Antes de usar la aplicación, cada persona lee el texto de privacidad vigente. Vuelve a leerlo cuando cambia la versión.

**Why this priority**: obligatorio antes del uso con datos reales; su contenido está aplazado (PEND-014).

**Independent Test**: una persona nueva no puede usar la aplicación hasta pulsar «He leído el texto»; se registran fecha y versión.

**Acceptance Scenarios**:

1. **Given** una persona que entra por primera vez, **When** define su contraseña, **Then** ve el texto de privacidad y no puede usar la aplicación hasta confirmarlo; se registran la fecha y la versión (CA-160; RF-160).
2. **Given** una versión nueva publicada, **Then** la persona debe leerla de nuevo (CA-160; RF-160).
3. El perfil tiene un enlace permanente al texto vigente (RF-161).

---

### User Story 5 - Tema y transparencia (Priority: P2)

Cada persona elige en su perfil el tema y si quiere superficies opacas. La preferencia se guarda en el dispositivo.

**Why this priority**: accesibilidad y uso de pie, junto a la cafetera (constitución X y XI).

**Independent Test**: cambiar el tema no pierde lo escrito ni el foco; activar «Reducir transparencia» hace opacas las superficies con las mismas acciones.

**Acceptance Scenarios**:

1. **Given** un móvil en modo oscuro sin preferencia guardada, **Then** la aplicación se muestra en oscuro con «Automático» seleccionado. Si el sistema cambia a claro durante la sesión, la aplicación cambia sin recargar (CA-180; RF-180).
2. **Given** un importe a medio escribir, **When** la persona elige «Claro», **Then** el importe y el foco se conservan (CA-180; RF-180).
3. **Given** «Reducir transparencia» activado, **Then** todas las superficies son opacas y siguen visibles las mismas acciones y datos (CA-181; RF-181).
4. Con `prefers-contrast: more`, `forced-colors`, texto al 200 % y 320 px de ancho, la aplicación conserva texto, límites, foco y contenido (RNF-015; EV-061).

---

### Edge Cases

- Un enlace de invitación o de recuperación ya usado o caducado muestra el mismo mensaje que un enlace inexistente (CA-132).
- Un usuario con sesión abierta y contraseña restablecida por un administrador pierde la sesión en la siguiente petición (RN-051).
- Un bloqueo de 15 minutos no se levanta antes de su plazo, aunque la contraseña sea correcta (CA-133).

## Requirements *(mandatory)*

### Functional Requirements

- **RF-130**: Un administrador deberá poder dar de alta un usuario con nombre, correo y rol (RF-130).
- **RF-131**: Un administrador deberá poder generar un enlace de invitación o de recuperación según RN-052 y mostrarlo para copiarlo (RF-131).
- **RF-132**: Con un enlace válido, el usuario deberá definir una contraseña que cumpla RN-053 (RF-132).
- **RF-133**: El sistema deberá autenticar con correo y contraseña, aplicar RN-048 y mostrar el mismo mensaje de error si el correo no existe o la contraseña es incorrecta (RF-133).
- **RF-134**: Un administrador deberá poder cambiar el rol de un usuario, respetando RN-041 (RF-134).
- **RF-135**: Un administrador deberá poder dar de baja a un usuario mediante un asistente que muestre su saldo y exija liquidarlo (pago, devolución o deuda incobrable) antes de confirmar (RF-135, RN-017, RN-018, RN-044).
- **RF-136**: Un administrador deberá poder reactivar a un usuario dado de baja (RF-136).
- **RF-137**: Cada usuario deberá poder cerrar sesión en todos sus dispositivos y cambiar su contraseña desde su perfil (RF-137, RN-051).
- **RF-138**: Si una acción de administrador llega sin autenticación en los últimos 15 minutos, el sistema deberá pedir la contraseña antes de ejecutarla (RF-138, RN-050).
- **RF-139**: Al primer arranque, y solo si no existe ningún usuario, el sistema deberá crear el administrador indicado en `ADMIN_INICIAL_EMAIL` y escribir en la salida estándar un enlace de invitación válido 24 horas. El fichero de log guarda el evento sin el enlace (RF-139, DEC-081).
- **RF-139b**: Un comando ejecutable en el contenedor deberá generar un enlace de recuperación para un administrador existente o crear uno nuevo (RF-139b).
- **RF-160**: La aplicación deberá mostrar el texto de privacidad vigente y registrar fecha y versión antes de permitir continuar (RF-160).
- **RF-161**: El perfil deberá incluir un enlace permanente al texto de privacidad vigente (RF-161).
- **RF-180**: El cliente deberá ofrecer en Perfil el tema Automático, Claro u Oscuro, con Automático como valor inicial (RF-180).
- **RF-181**: El cliente deberá ofrecer en Perfil el ajuste «Reducir transparencia», desactivado por defecto (RF-181).
- **RNF-016**: La aplicación no se publica en buscadores: `/robots.txt` responde `Disallow: /` y las respuestas llevan `X-Robots-Tag: noindex, nofollow` (RNF-016, DEC-102).

Reglas de negocio que aplican a estos requisitos: RN-040 a RN-054, citadas en las historias de usuario.

### Key Entities

- **Usuario**: nombre, correo, rol (miembro o administrador), estado (activo o dado de baja), saldo derivado del libro de movimientos (RN-010).
- **Enlace de acceso**: tipo (invitación o recuperación), caducidad, uso único, usuario al que pertenece (RN-052).
- **Sesión**: usuario, instante de inicio y de última renovación (RN-049, RN-051).
- **Aceptación de privacidad**: usuario, versión leída, instante (RF-160).
- **Preferencias de apariencia**: tema y «Reducir transparencia». Se guardan en el dispositivo (RF-180, RF-181).

### Preparación del proyecto (scaffold)

- El proyecto se mueve a la raíz con `git mv` desde `design-system/` (DEC-055).
- Las comprobaciones se ejecutan en Windows y en Linux con scripts npm portables (DEC-056).
- Un flujo de integración continua ejecuta `npm run verify` en cada PR y en cada cambio de `main` (DEC-060).

Este bloque no añade comportamiento para la persona usuaria. Su plan debe justificar cada herramienta (constitución II).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- Un administrador da de alta a una persona y obtiene su enlace de invitación en la misma pantalla (CA-130, CA-131).
- Las contraseñas de 14 caracteres se rechazan y las de 15 se aceptan (CA-132).
- Tras cinco contraseñas incorrectas, el sexto intento, aunque sea correcto, se rechaza (CA-133).
- Un miembro que accede por URL a una ruta de administración no ve el contenido (EV-050).
- Al primer arranque, el enlace aparece en la salida estándar y no en el fichero de log (CA-139).
- Ninguna persona usa la aplicación antes de confirmar el texto de privacidad vigente (CA-160).
- Cambiar de tema no pierde texto escrito ni el foco (CA-180).
- `/robots.txt` y las respuestas indican que la aplicación no debe indexarse (RNF-016).

## Assumptions

- El contenido del texto de privacidad sigue aplazado (PEND-014, antes del uso con datos reales).
- `ADMIN_INICIAL_EMAIL` se define antes del primer arranque (RF-139).
- No hay rama de funcionalidad: el trabajo se hace en `main` (AGENTS.md §9).

## Clarifications

### Session 2026-10-21

- Q: RF-135, RF-137 y RF-138 no figuran en el alcance de F1 de `historias.md` §15. ¿Dónde van?
  - A: en F1 (respuesta del usuario, 21-10-2026).
  - Pendiente: `historias.md` §15 sigue sin estos IDs. Cambiarlo exige un CAMBIO con autorización (AGENTS.md §2).
  - Dependencia: RF-135 aplica RN-017 y RN-018 (cargos, devoluciones y saldo de la hucha). Su plan debe decidir dónde viven esas reglas.
