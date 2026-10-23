# Feature Specification: Operación: copias, configuración y despliegue (F7)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F7 — Operación: copias, pantalla de configuración, despliegue, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§4, §7.11, §7.12, §8, §9, §10.7, §13.2 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications.

**Orden**: F7 se puede hacer en cualquier punto, pero es obligatoria antes de producción (§15).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copias de seguridad diarias y restaurables (Priority: P1)

Cada noche el sistema guarda una copia de la base de datos y de las fotos fuera del servidor. Un administrador ve si las copias van bien y anota cuándo se probó una restauración.

**Why this priority**: sin copias, una avería del servidor pierde todo el dinero registrado (HU-16, RNF-009). Es obligatoria antes de producción.

**Independent Test**: a las 03:00 se sube al bucket un archivo con la base de datos y las fotos; restaurado en un entorno aparte, la aplicación arranca con los mismos saldos.

**Acceptance Scenarios**:

1. **A** las 03:00 (hora de Madrid) se sube al bucket un archivo con la copia de la base de datos y las fotos. **Restaurado** en un entorno aparte, la aplicación arranca con los mismos saldos (CA-140; RF-140, EV-070).
2. **Con** credenciales del bucket incorrectas, la copia falla, se registra el error y los administradores reciben la notificación (CA-142; RF-142).
3. **El** administrador ve fecha, tamaño y estado de las últimas copias y puede anotar una prueba de restauración (CA-143; RF-143).
4. **Dada** una última prueba de restauración registrada hace 101 días, **entonces** el panel de administración muestra «Hace más de 100 días que no se prueba una restauración». **Con** una prueba de hace 30 días, el aviso no aparece (CA-144; RF-144).
5. **Si** el servidor estaba parado a las 03:00, **entonces** la copia de ese día se hace al arrancar, una sola vez (Clarifications, punto 1).

---

### User Story 2 - Cambiar los parámetros del sistema (Priority: P2)

Un administrador cambia el plazo de autoanulación, el límite de deuda y el intervalo mínimo entre rellenos. Cada cambio queda registrado con su autor y su fecha.

**Why this priority**: permite adaptar la aplicación al equipo sin tocar el servidor (HU-15). Los valores por defecto ya funcionan desde F1.

**Independent Test**: un administrador cambia el plazo de autoanulación a 30 minutos; el cambio queda en el registro de auditoría y se aplica a las anulaciones posteriores.

**Acceptance Scenarios**:

1. **Cuando** un administrador cambia el plazo de autoanulación a 30 minutos, **entonces** el cambio queda registrado y se aplica a las anulaciones posteriores (CA-150; RF-150).
2. **La** pantalla de configuración muestra los tramos vigentes del recordatorio de deuda, derivados del límite: cada 7, 3 y 1 días (CA-074; RF-150, RN-074).
3. **Cuando** un administrador escribe un valor fuera de rango, **entonces** el sistema lo rechaza e indica el rango admitido (Clarifications, punto 2).
4. **Dado** un administrador que introdujo la contraseña hace 20 minutos, **cuando** intenta guardar un cambio, **entonces** la aplicación le pide la contraseña antes de continuar (CA-138; RF-138, RN-050).

---

### User Story 3 - Desplegar la aplicación en producción (Priority: P1)

El operador despliega la aplicación como imagen Docker en Coolify, con una sola instancia, el volumen de datos persistente y las variables de entorno validadas al arrancar.

**Why this priority**: sin despliegue nadie usa la aplicación (RT-003, RT-010).

**Independent Test**: la imagen construida en la integración continua arranca en un entorno limpio, responde en `/api/salud` y conserva los datos tras reiniciar el contenedor.

**Acceptance Scenarios**:

1. **Cuando** el operador despliega la imagen con las variables de entorno válidas, **entonces** la aplicación arranca, registra su versión y su commit, y `/api/salud` responde (RNF-014; PEND-035).
2. **Cuando** el contenedor se reinicia, **entonces** los datos del volumen se conservan.
3. **La** integración continua verifica la misma imagen que se despliega (`docs/pruebas.md` §21).

---

### Edge Cases

- Una copia que tarda más de lo normal no bloquea la aplicación ni los registros.
- Dos arranques seguidos tras una caída: la copia perdida no se hace dos veces (Clarifications, punto 1).
- Cambiar el intervalo mínimo entre rellenos a 0 desactiva la restricción (Clarifications, punto 2).
- Cambiar el límite de deuda cambia los tramos del recordatorio en el siguiente cálculo (CA-074).
- La prueba de restauración anotada con una fecha futura se rechaza (Clarifications, punto 3).
- Sin conexión, la pantalla de configuración y la de copias no están disponibles (EXC-007).

## Requirements *(mandatory)*

### Functional Requirements

**Copias de seguridad** (§7.11)

- **RF-140**: Cada día a las 03:00 (hora de Madrid), el sistema deberá generar una copia coherente de la base de datos con `VACUUM INTO`, empaquetarla con las fotos y subirla al bucket S3.
- **RF-141**: El bucket deberá conservar las copias de los últimos 30 días mediante una regla de ciclo de vida.
- **RF-142**: Si una copia falla, el sistema deberá registrar el error y notificar a los administradores.
- **RF-143**: Un administrador deberá poder consultar el estado de las últimas copias y registrar el resultado de una prueba de restauración.
- **RF-144**: Si han pasado más de 100 días desde la última prueba de restauración registrada, el panel de administración deberá mostrar un aviso.

**Configuración** (§7.12)

- **RF-150**: Un administrador deberá poder modificar: plazo de autoanulación, límite de deuda e intervalo mínimo entre rellenos de agua. La frecuencia del recordatorio de deuda no se configura: se deriva del límite (RN-074) y la pantalla la muestra como información. Cada cambio queda registrado con autor y fecha. Los valores admitidos son (Clarifications, punto 2):
  - plazo de autoanulación: de 1 a 1440 minutos;
  - límite de deuda: de −1 € a −100 €;
  - intervalo mínimo entre rellenos: de 0 a 1440 minutos (0 desactiva el intervalo).

**Despliegue** (§10.7, §15)

- La aplicación se despliega como imagen Docker en Coolify, con una sola instancia (RT-003, RT-010).
- La versión y el commit llegan a la imagen al construirla (PEND-035).
- La integración continua construye y verifica la imagen antes de producción (`docs/pruebas.md` §21).

### Non-Functional Requirements

- **RNF-001**: Las pantallas nuevas (configuración y copias) cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro.
- **RNF-007**: Todos los permisos se comprueban en el servidor (EV-050).
- **RNF-009**: RPO ≤ 24 h; retención de 30 días; prueba de restauración trimestral.
- **RNF-014**: Las copias, sus fallos y las tareas programadas quedan en el registro técnico. Los logs no se incluyen en las copias (constitución XVI).
- Las credenciales del bucket se declaran como variables de entorno privadas y no aparecen en el registro técnico ni en el repositorio (constitución VI).

### Out of Scope

- Varias instancias o alta disponibilidad (RT-010, RNF-011).
- Restaurar una copia desde la aplicación: la restauración la hace el operador fuera de ella (EV-070).
- Completar el texto de privacidad (PEND-014): es responsabilidad de la persona responsable del departamento, pero es una condición previa a producción.

### Key Entities

- **Copia de seguridad**: instante, tamaño, estado (correcta o fallida) y error, sin credenciales.
- **Prueba de restauración**: fecha, autor y resultado.
- **Configuración**: parámetro, valor, autor y fecha del último cambio (F1). Cada cambio queda en el registro de auditoría.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-074 (pantalla), CA-140, CA-142 a CA-144 y CA-150**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **EV-070**: hay una demostración de restauración completa en un entorno aparte, anotada en la aplicación.
- **RF-141**: la regla de ciclo de vida del bucket se comprueba por inspección.
- **Puerta de producción**: verificación completa en verde sobre la imagen que se despliega, PEND-014 resuelto y la revisión con lector de pantalla pendiente de F1 hecha (T089 de F1).

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-140, EV-070 (RF-140, RNF-009) | Copia incoherente o no restaurable | Copia a las 03:00; restauración en entorno aparte | Integración con almacenamiento falso + demostración | Prevista |
| CA-142 (RF-142) | Fallo de copia silencioso | Credenciales incorrectas | Integración con almacenamiento falso | Prevista |
| CA-143, CA-144 (RF-143, RF-144) | Restauración sin probar | 30 y 101 días | Integración con reloj simulado | Prevista |
| CA-150, CA-074 (RF-150, RN-074) | Cambio sin rastro o fuera de rango | 30 minutos; límites de cada rango; tramos | Integración + E2E | Prevista |
| CA-138 (RF-138, RN-050) | Cambio desde una sesión olvidada | 15 y 16 minutos | Integración | Prevista |
| Copia perdida | Copia duplicada o perdida | Arranque tras una caída; doble arranque | Integración con reloj simulado | Prevista |
| RF-141 | Retención incorrecta | Regla del bucket | Inspección | Prevista |
| Despliegue | Imagen distinta de la verificada | Construcción y arranque de la imagen en la CI | CI | Prevista |

## Assumptions

- La pantalla de configuración exige reautenticación (§10.5: `/admin/configuracion`). La de copias, no (§10.5: `/admin/copias`).
- El almacenamiento falso de las pruebas se selecciona por inyección en la composición de arranque (`docs/pruebas.md` §24).

## Clarifications

### Session 2026-10-22

1. **Tareas programadas perdidas.** Si el servidor está parado a la hora de la copia, al arrancar se hace la copia de ese día, una sola vez.
2. **Rangos de configuración.** Plazo de autoanulación de 1 a 1440 minutos; límite de deuda de −1 € a −100 €; intervalo mínimo entre rellenos de 0 a 1440 minutos, donde 0 desactiva el intervalo.
3. **Fecha de la prueba de restauración.** Una fecha futura se rechaza.

### Session 2026-10-22 (aprobación del plan, D12)

4. **Copia fallida.** No se reintenta automáticamente: se avisa a los administradores y la siguiente copia es la del día siguiente.
5. **Sin pruebas de restauración.** El panel muestra «Todavía no se ha probado ninguna restauración» desde el primer despliegue.
6. **Imagen.** La CI publica la imagen verificada en GitHub Container Registry y Coolify la despliega por digest.
7. **Prueba que cuenta para los 100 días.** Solo una prueba con resultado «correcta».
8. **Horas de las tareas.** Copia a las 03:00, aguador a las 00:05, resumen y recordatorio de deuda a las 09:00.
