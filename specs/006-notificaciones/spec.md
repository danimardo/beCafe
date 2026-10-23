# Feature Specification: Notificaciones (F5)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F5 — Notificaciones, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§6.5, §7.8, §8, §9 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recibir avisos en el móvil y elegir cuáles (Priority: P1)

Cada persona activa las notificaciones en su dispositivo y recibe los avisos que le corresponden: stock bajo, su deuda, el resumen mensual y, si es administradora, los avisos de administración. En su perfil elige cuáles quiere, salvo el de deuda.

**Why this priority**: es la forma de saber a tiempo que hay que comprar y que se debe dinero, sin abrir la aplicación (HU-08, HU-09).

**Independent Test**: Ana activa las notificaciones; un tipo entra en stock bajo y Ana recibe un solo push. Luis, que desactivó «stock bajo», no lo recibe.

**Acceptance Scenarios**:

1. **Dado** un usuario sin permiso de notificaciones en su navegador, **entonces** el sistema no intenta enviarle push y los avisos aparecen solo en la aplicación (CA-100; RF-100, RF-107).
2. **Cada** tipo del catálogo de notificaciones llega solo a sus destinatarios: un miembro no administrador nunca recibe «stock negativo» (CA-101; RF-101).
3. **Dado** un usuario que desactiva «stock bajo», **cuando** un tipo entra en stock bajo, **entonces** no recibe push. En su perfil, el interruptor del aviso de deuda aparece activado y no se puede cambiar (CA-102; RF-102).
4. **Dado** un tipo que entra en stock bajo, **cuando** se registran 3 consumos más, **entonces** solo se ha enviado un aviso de stock bajo. Tras una compra que lo saca de stock bajo, una nueva entrada genera un nuevo aviso (CA-023; RF-023, RF-103, RN-072).
5. **Dada** una compra confirmada que deja la hucha en negativo, o un consumo con stock ≤ 0, **entonces** los administradores reciben el aviso correspondiente (CA-043, CA-017; RF-044, RF-017).
6. **La** pantalla de ayuda explica la instalación en Android y en iPhone o iPad, incluida la condición de añadir la aplicación a la pantalla de inicio (CA-106; RF-106).

---

### User Story 2 - Recordatorio de deuda progresivo (Priority: P1)

Cuando el saldo de una persona baja del límite de deuda, recibe un aviso, y mientras siga por debajo, recordatorios más frecuentes cuanto mayor es la deuda.

**Why this priority**: evita que las deudas crezcan sin que nadie se dé cuenta (NEC-004). No se puede desactivar.

**Independent Test**: con el límite en −5 € y Ana en −12 €, Ana recibe el recordatorio cada 3 días.

**Acceptance Scenarios**:

1. **Con** un límite de deuda de −5 €: con saldo −6 €, Ana recibe el recordatorio cada 7 días; con −12 €, cada 3 días; con −25 €, cada día (CA-074; RN-074, EV-101).
2. **Si** Ana pasa de −6 € a −12 € dos días después de un recordatorio, **entonces** el siguiente le llega al tercer día de ese recordatorio, no en el momento del cambio (CA-074; RN-074).
3. **Si** un administrador cambia el límite a −10 €, **entonces** con −12 € Ana pasa a recibirlo cada 7 días (CA-074; RN-074).
4. **Cuando** el saldo de Ana vuelve a estar en el límite o por encima, **entonces** deja de recibir recordatorios, y una nueva bajada genera un aviso nuevo (RN-074).

---

### User Story 3 - Resumen mensual (Priority: P2)

El día 1 de cada mes, cada persona que lo tiene activado recibe su consumo del mes anterior y su saldo actual.

**Why this priority**: da una visión periódica sin abrir la aplicación, pero no es urgente.

**Independent Test**: el día 1 a las 09:00, Ana recibe su consumo de octubre y su saldo.

**Acceptance Scenarios**:

1. **El** día 1 a las 09:00 (hora de Madrid), **entonces** cada miembro activo con el resumen activado recibe su consumo del mes anterior y su saldo (CA-104; RF-104).
2. **Si** el servidor estaba parado a las 09:00 del día 1, **entonces** el resumen de ese mes se envía al arrancar, una sola vez (Clarifications, punto 2).
3. **Cuando** exista F8, el resumen incluye el aguador del mes anterior (RF-104, RF-176).

---

### User Story 4 - Panel de avisos y envíos fallidos (Priority: P2)

Todas las notificaciones se ven también en el panel de avisos de la aplicación. Un envío que falla se reintenta, nunca bloquea el registro que lo originó, y las suscripciones que ya no existen se eliminan.

**Why this priority**: en iPhone sin instalar la aplicación, el push no es fiable; el panel es la alternativa (§13.3).

**Independent Test**: con el servicio push devolviendo error, un consumo que provoca stock bajo queda registrado y el aviso se reintenta.

**Acceptance Scenarios**:

1. **Dado** el servicio push devolviendo error, **cuando** se registra un consumo que provoca stock bajo, **entonces** el consumo queda registrado y el envío se reintenta. Si el servicio responde que la suscripción no existe, esta se elimina (CA-105; RF-105, RNF-008).
2. **Cada** notificación enviada a una persona aparece en su panel de avisos durante 30 días, sin que tenga que descartarla (CA-021; RF-107; Clarifications, punto 1).

---

### Edge Cases

- Una persona con varios dispositivos suscritos recibe el push en todos (RF-100).
- Una persona que activa las notificaciones en un dispositivo nuevo no recibe avisos pasados (RF-100) (Clarifications, punto 3).
- Un tipo entra y sale de stock bajo varias veces en el mismo día: cada nueva entrada, tras una salida, genera un aviso (RN-072).
- Una persona dada de baja deja de recibir notificaciones y sus suscripciones dejan de usarse (RN-051).
- Un recordatorio de deuda que coincide con el resumen mensual: se envían los dos (Clarifications, punto 4).
- El reloj cambia por el horario de verano: el resumen se envía a las 09:00 de Madrid, una sola vez (constitución V).
- Dos arranques seguidos tras una caída: el resumen perdido no se envía dos veces (Clarifications, punto 2).

## Requirements *(mandatory)*

### Functional Requirements

**Notificaciones** (§7.8)

- **RF-100**: El sistema deberá enviar notificaciones push a las suscripciones de los usuarios que las hayan aceptado y activado.
- **RF-101**: El catálogo de notificaciones será: stock bajo (todos), deuda bajo límite (personal), resumen mensual (personal), stock negativo (administradores), hucha con saldo teórico negativo (administradores), fallo de copia de seguridad (administradores).
- **RF-102**: Cada usuario deberá poder activar o desactivar en su perfil cada tipo de notificación, salvo la de deuda.
- **RF-103**: El sistema deberá registrar cada notificación enviada para aplicar RN-072 y RN-074 sin duplicados.
- **RF-104**: El día 1 de cada mes, el sistema deberá enviar a cada miembro activo con la notificación activada su consumo del mes anterior, su saldo actual y el aguador del mes anterior (RF-176). El aguador se añade cuando exista F8.
- **RF-105**: Si el envío de una notificación falla, el sistema deberá reintentarlo y nunca deberá bloquear ni deshacer el registro que la originó. Si el servicio push indica que la suscripción ya no existe, el sistema la elimina.
- **RF-106**: La aplicación deberá incluir una pantalla de ayuda para instalar la PWA y activar las notificaciones, que explique que en iPhone y iPad hay que añadirla a la pantalla de inicio.
- **RF-107**: Todas las notificaciones deberán estar también disponibles en el panel de avisos de la aplicación, durante 30 días (Clarifications, punto 1).

**Reglas de negocio** (§6.5): RN-072 y RN-074.

**Tareas programadas**: si el servidor está parado a la hora de una tarea, la tarea se ejecuta al arrancar, una sola vez (Clarifications, punto 2).

### Non-Functional Requirements

- **RNF-001**: Las pantallas nuevas (preferencias de notificaciones y ayuda de instalación) cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro.
- **RNF-008**: El fallo de una notificación nunca bloquea un registro (constitución XIII).
- **RNF-014**: Los envíos fallidos y las tareas programadas quedan en el registro técnico, sin datos de las suscripciones (constitución XVI).
- Los datos de las suscripciones push no aparecen en el registro técnico ni en el repositorio (constitución XVI).
- La suscripción push es una de las excepciones cerradas a la regla de funcionar sin JavaScript (constitución XVII).

### Out of Scope

- Correos electrónicos (EXC-003).
- Avisos de «toca rellenar el agua» (EXC-014).
- La pantalla para cambiar el límite de deuda (RF-150): F7. F5 lee el valor del almacén de configuración.
- El aviso de fallo de copia lo genera F7; F5 lo entrega cuando exista.

### Key Entities

- **Suscripción push**: usuario, dispositivo y datos de la suscripción, que solo usa el envío (constitución XVI).
- **Preferencia de notificación**: usuario, tipo de notificación y si está activada; la de deuda siempre lo está.
- **Notificación**: destinatario, tipo, contenido, instante, estado del envío y reintentos. Se muestra en el panel durante 30 días (RF-103, RF-107).
- **Ejecución de tarea programada**: tarea, periodo al que corresponde e instante. Impide que una tarea se ejecute dos veces para el mismo periodo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-074, CA-100 a CA-102 y CA-104 a CA-106**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **CA-017, CA-023 y CA-043**: la parte de envío push tiene su prueba con un servicio push falso y pasa.
- **EV-101**: el recordatorio progresivo tiene su prueba con reloj simulado y pasa.
- **RNF-008**: con el servicio push caído, ningún registro falla.

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-100, CA-101 (RF-100, RF-101) | Push a quien no corresponde | Sin permiso; miembro y «stock negativo» | Integración con push falso | Prevista |
| CA-102 (RF-102) | Deuda desactivable | Desactivar «stock bajo»; interruptor de deuda | Integración + E2E | Prevista |
| CA-023 (RF-103, RN-072) | Avisos repetidos | Entrada, tres consumos, salida y nueva entrada | Integración | Prevista |
| CA-074, EV-101 (RN-074) | Recordatorio a destiempo | −6, −12 y −25 €; cambio de tramo; cambio de límite | Unidad con reloj simulado | Prevista |
| CA-104 (RF-104) | Resumen perdido o duplicado | Día 1 a las 09:00; arranque tras una caída; doble arranque | Integración con reloj simulado | Prevista |
| CA-105, RNF-008 (RF-105) | Registro bloqueado por el push | Servicio push con error; suscripción inexistente | Integración con push falso | Prevista |
| CA-106 (RF-106) | Instrucciones ausentes | Pantalla de ayuda | E2E + `a11y` | Prevista |
| RF-107 | Aviso no visible sin push | Panel con avisos de 29 y 31 días | Integración | Prevista |

## Assumptions

- El número de reintentos y el intervalo entre ellos los fija el plan. No cambian el comportamiento visible para la persona.
- La selección del servicio push falso en las pruebas se hace por inyección en la composición de arranque (`docs/pruebas.md` §24).

## Clarifications

### Session 2026-10-22

1. **Panel de avisos.** Muestra el estado actual y las notificaciones de los últimos 30 días. Nadie tiene que descartarlas.
2. **Tareas programadas perdidas.** Si el servidor está parado a la hora de una tarea, al arrancar la tarea comprueba si le tocaba y no se hizo, y entonces se ejecuta una vez. Nunca se duplica un resumen del mismo mes.
3. **Dispositivo nuevo.** No recibe avisos pasados por push; los ve en el panel de avisos.
4. **Recordatorio de deuda y resumen mensual el mismo día.** Se envían los dos.

### Session 2026-10-22 (aprobación del plan, D14)

5. **Preferencias por defecto.** Todos los tipos desactivables empiezan activados.
6. **Preferencia desactivada.** Afecta solo al push; el aviso aparece en el panel.
7. **Recordatorio de deuda.** El aviso al cruzar el límite es inmediato; los recordatorios se envían una vez al día a las 09:00 de Madrid.
8. **Intervalos de deuda.** Se cuentan en días naturales de Madrid desde el día del último aviso.
9. **Reintentos.** 5 intentos con esperas de 1, 5, 30, 120 y 720 minutos; un aviso con más de 24 h ya no se envía por push.
10. **Recuperación de tareas.** Solo se recupera el último periodo perdido.
11. **Avisos vistos.** Se marcan como vistos al abrir el panel y siguen visibles 30 días.
