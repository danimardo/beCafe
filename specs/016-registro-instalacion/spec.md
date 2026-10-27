# Feature Specification: Registro de quién instala la aplicación (F16)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-27

**Status**: Aprobada por la persona usuaria el 2026-10-27. Traspasada a `historias.md` v0.28.0 (CAMBIO-028).

**Input**: User description: «Saber si el aviso de instalar ha salido, si se ha instalado o no, forzarlo cuando no ha salido y guardar en el servidor quién ha instalado la aplicación.»

**Fuente**: decisiones de la persona usuaria en la sesión del 2026-10-27 (apartado «Clarifications»). La persona usuaria autorizó el 2026-10-27 el cambio en `historias.md` (CAMBIO-028, con respaldo en `.respaldos/`). Aplicado el 2026-10-27, con la especificación aprobada.

**Glosario de esta funcionalidad**:

- **Aviso de instalación**: el evento `beforeinstallprompt` con que Chrome indica que la aplicación se puede instalar. Chrome lo lanza una sola vez por carga de página.
- **Estado de instalación**: dato por persona con dos valores, `instalada` o `rechazada`, y el instante del último cambio.
- **Diagnóstico de instalación**: lista en Ajustes que explica por qué se ofrece o no instalar (conexión segura, servicio de fondo, aviso recibido, instalada, último resultado del diálogo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber quién ha instalado la aplicación (Priority: P1)

El responsable del departamento abre la ficha de Ana en Usuarios y lee «Aplicación instalada desde el 27-10-2026». En la ficha de Luis lee «Rechazó instalarla el 26-10-2026». En la de Pedro lee «Sin datos».

**Why this priority**: es lo que pide la persona usuaria. Sin este dato no puede saber a quién ayudar a instalarla.

**Independent Test**: con dos personas, simular el evento `appinstalled` en una y un diálogo rechazado en otra, y comprobar lo que muestra la ficha de cada una a un administrador.

**Acceptance Scenarios**:

1. **Given** una persona que acepta el diálogo del sistema o instala desde el menú del navegador, **When** el navegador avisa de que se ha instalado, **Then** el servidor guarda `instalada` con el instante y la ficha lo muestra a los administradores.
2. **Given** una persona que cancela el diálogo del sistema, **When** el estado era «sin datos», **Then** el servidor guarda `rechazada` con el instante.
3. **Given** una persona con estado `rechazada`, **When** más tarde instala la aplicación, **Then** el estado pasa a `instalada`.
4. **Given** una persona con estado `instalada`, **When** cancela un diálogo posterior, **Then** el estado sigue en `instalada`.
5. **Given** una persona que abre la aplicación ya instalada (modo `standalone`) y no tiene estado `instalada`, **When** carga cualquier pantalla de la aplicación, **Then** el servidor guarda `instalada`.
6. **Given** un miembro (no administrador), **When** mira cualquier pantalla, **Then** no ve el estado de instalación de otras personas.
7. **Given** el mismo estado enviado dos veces, **When** el servidor lo recibe, **Then** no cambia el instante guardado.

---

### User Story 2 - Saber por qué no sale «Instalar» y poder instalar a mano (Priority: P2)

Una persona abre Ajustes en Chrome para Android y no ve el botón de instalar. Ve el diagnóstico («Conexión segura: Sí. El navegador ha ofrecido instalar: No») y las instrucciones para instalar desde el menú ⋮.

**Why this priority**: sin esto, la persona usuaria no puede saber si el aviso salió ni qué hacer cuando no sale.

**Independent Test**: abrir Ajustes en un navegador sin aviso de instalación y comprobar que aparecen el diagnóstico y las instrucciones; lanzar un aviso simulado y comprobar que aparece el botón «Instalar».

**Acceptance Scenarios**:

1. **Given** que el aviso de instalación llega en una pantalla que no es Inicio ni Ajustes (por ejemplo, el acceso), **When** la persona abre después Ajustes sin recargar, **Then** Ajustes ofrece el botón «Instalar» con ese aviso.
2. **Given** que el navegador no ha ofrecido instalar, **When** la persona abre Ajustes, **Then** ve las instrucciones para instalar a mano y el diagnóstico.
3. **Given** que el diálogo del sistema se ha cerrado, **When** la persona vuelve a Ajustes, **Then** el diagnóstico muestra el último resultado (aceptada, rechazada o falló).
4. **Given** una aplicación ya instalada, **When** la persona abre Ajustes, **Then** lo ve indicado y el diagnóstico lo confirma.

---

### Edge Cases

- Si la persona desinstala la aplicación, el navegador no avisa: el estado `instalada` se conserva. La ficha muestra la fecha del último dato, no que siga instalada.
- Un dispositivo compartido o una persona con varios dispositivos: el estado es por persona. Un solo dispositivo con instalación basta para `instalada`.
- Sin JavaScript no hay aviso de instalación ni se guarda estado (excepción cerrada de la constitución XVII).
- Si el envío al servidor falla (sin conexión), no se reintenta desde una cola: el dato se enviará en la siguiente carga, que repite la detección.
- Persona dada de baja: el estado se conserva con su ficha.

## Requirements *(mandatory)*

### Functional Requirements

- **RF-276**: El navegador deberá guardar en memoria el aviso de instalación desde que arranca el cliente, en cualquier pantalla, para que Inicio y Ajustes puedan ofrecerlo después sin recargar. Precisa RF-206.
- **RF-277**: Ajustes deberá mostrar, en la sección «Instalar la aplicación», el diagnóstico de instalación y, si el navegador no ha ofrecido instalar, las instrucciones para instalar a mano desde el menú del navegador. El diagnóstico no se guarda en el navegador ni en el servidor.
- **RF-278**: El servidor deberá guardar por persona su estado de instalación (`instalada` o `rechazada`) y el instante del último cambio. Cada persona tiene como máximo un estado.
- **RF-279**: El navegador deberá enviar el estado al servidor mediante un formulario con *action*, enviado por código tras: aceptar el diálogo del sistema, el evento `appinstalled`, cancelar el diálogo, o cargar la aplicación en modo `standalone`.
- **RF-280**: El servidor deberá aplicar estas transiciones: de «sin datos» a cualquiera; de `rechazada` a `instalada`; `instalada` no pasa a `rechazada`; repetir el mismo estado no cambia el instante.
- **RF-281**: La ficha de una persona en Usuarios deberá mostrar a los administradores su estado de instalación con la fecha («Aplicación instalada desde…», «Rechazó instalarla el…» o «Sin datos»). Ninguna otra pantalla lo muestra.
- **RF-282**: El texto de privacidad (anexo A, versión 5) deberá incluir entre los datos guardados el estado de instalación y quién puede verlo (los administradores). Es una versión nueva del texto (RF-160): todas las personas la vuelven a aceptar.
- **RF-283**: El servidor deberá registrar cada cambio de estado con el evento técnico `instalacion.registrada`, con el identificador de la persona y el estado, sin otros datos personales (constitución XVI).

### Non-Functional Requirements

- **RNF-F16-1**: El estado de instalación no se guarda en el navegador (constitución V). El diagnóstico vive solo en memoria.
- **RNF-F16-2**: El envío del estado no bloquea ni retrasa ninguna pantalla ni acción de registro (constitución X).
- **RNF-F16-3**: Un fallo al guardar el estado no muestra error a la persona y no bloquea nada (constitución XIII).

### Out of Scope

- Forzar el diálogo del sistema cuando Chrome no ha lanzado el aviso: el navegador no lo permite. Solo se ofrecen las instrucciones a mano.
- Detectar desinstalaciones.
- Estado por dispositivo, resumen agregado («7 de 10 han instalado») y avisos a los administradores.
- Guardar el estado de instalación de iPhone y iPad salvo que se abra en modo `standalone`: Safari no lanza `beforeinstallprompt`; sí aplica la carga en `standalone` (RF-279).

### Key Entities

- **Estado de instalación**: persona, valor (`instalada` o `rechazada`) e instante UTC. Una fila por persona.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador ve en la ficha de cualquier persona su estado de instalación en una sola pantalla.
- **SC-002**: En Chrome para Android, una persona que no ve el botón «Instalar» encuentra en Ajustes la causa o las instrucciones sin salir de la aplicación.
- **SC-003**: Ningún miembro que no sea administrador puede leer el estado de otra persona (prueba de permisos).

### Criterios de aceptación propuestos

- **CA-276**: Con un aviso recibido en el acceso, Ajustes ofrece «Instalar» sin recargar (RF-276).
- **CA-277**: Sin aviso, Ajustes muestra el diagnóstico y las instrucciones a mano (RF-277).
- **CA-278**: Cada persona tiene como máximo un estado (RF-278).
- **CA-279**: Aceptar, `appinstalled`, cancelar y abrir en `standalone` envían el estado que toca (RF-279).
- **CA-280**: Las transiciones de RF-280 se cumplen y repetir un estado no cambia el instante.
- **CA-281**: La ficha muestra el estado a un administrador y un miembro recibe 403 al pedir la ficha (RF-281).
- **CA-282**: Tras subir la versión de privacidad a 5, todas las personas deben aceptarla de nuevo (RF-282).
- **CA-283**: Cada cambio de estado emite `instalacion.registrada` sin datos personales (RF-283).

### Escenarios de verificación propuestos

- **EV-116**: Transiciones de estado con propiedades: para cualquier secuencia de eventos, `instalada` nunca vuelve a `rechazada` y repetir un estado no cambia el instante (RF-280).

## Impacto en las fuentes vigentes

Cambios de `historias.md` (CAMBIO-028), aplicados con respaldo en `.respaldos/historias-v0.27.0-20261027.md`:

- **Nuevos**: RF-276 a RF-283, CA-276 a CA-283, EV-116 y DEC-139 (estado por persona, visible solo a administradores en la ficha).
- **Modificados**:
  - RF-206: la tarjeta de instalación sigue igual; se añaden la captura temprana, el diagnóstico y las instrucciones a mano (RF-276, RF-277). Corrige que «Perfil ofrece siempre la opción»: ahora es Ajustes.
  - RF-224 y anexo A: versión 5 del texto de privacidad con el estado de instalación.
  - Glosario: «Estado de instalación», «Aviso de instalación», «Diagnóstico de instalación».
- `ARCHITECTURE.md`: el plan decide dónde vive el estado (módulo `usuarios`, tabla nueva) y dónde se envía desde el cliente (layout de `(app)`).
- **Constitución**: sin enmienda. La instalación de la PWA ya es una excepción cerrada de XVII y el estado vive en el servidor, no en el navegador (V).
- **Ya implementado** (27-10-2026, sin cambiar reglas de negocio): captura temprana del aviso y diagnóstico en Ajustes (RF-276, RF-277). Se traspasa con el resto.

## Assumptions

- Chrome lanza `appinstalled` también cuando la persona instala desde el menú ⋮.
- «Rechazada» solo se conoce cuando el diálogo del sistema se abre y se cancela. Si Chrome nunca lanza el aviso, el estado sigue en «Sin datos».
- La detección en modo `standalone` usa `display-mode: standalone` y `navigator.standalone` de iOS.
- La ficha de Usuarios ya existe (RF-208, RF-242); se añade una línea, no una pantalla.
- Tabla nueva `instalacion_app` en el módulo `usuarios`; migración de solo avance.

## Clarifications

### Session 2026-10-27

- **Q**: ¿Estado por persona o por dispositivo? → **A**: Por persona.
- **Q**: ¿Quién lo ve? → **A**: Solo los administradores, en la ficha de la persona. Sin resumen agregado.
- **Q**: ¿Se puede cambiar `historias.md`? → **A**: Sí; la persona usuaria autoriza el cambio con su respaldo. Se aplica al aprobar esta especificación.
