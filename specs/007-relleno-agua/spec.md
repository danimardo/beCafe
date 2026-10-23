# Feature Specification: Relleno de agua y aguador del mes (F8)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F8 — Relleno de agua y aguador del mes, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (ORIG-003, §3, §6.4, §6.6, §6.7, §6.8, §7.14, §9 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications; resuelven PEND-033.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar que he rellenado el agua (Priority: P1)

Un miembro rellena el depósito de agua de la cafetera y lo registra con un toque. La pantalla principal muestra quién lo rellenó por última vez y hace cuánto.

**Why this priority**: es la petición de ORIG-003: que quede reflejado quién rellena el agua (NEC-008, HU-17).

**Independent Test**: Ana pulsa «He rellenado el agua»; queda un relleno a su nombre y la pantalla principal muestra «Último: Ana, hace un momento».

**Acceptance Scenarios**:

1. **Dado** un último relleno vigente de Jorge hace 3 horas, **cuando** Ana abre la aplicación, **entonces** ve «He rellenado el agua» con «Último: Jorge, hace 3 h» encima de las cápsulas. Sin rellenos, ve «Sin rellenos registrados» (CA-170; RF-170).
2. **Cuando** Ana pulsa «He rellenado el agua», **entonces** se registra un relleno a su nombre y aparece durante 5 segundos un aviso con «Deshacer» que el lector de pantalla anuncia. Si lo pulsa, el relleno queda anulado como «Deshecho por el autor» y no cuenta (CA-171; RF-171, RN-031, RN-083).
3. **Dado** un intervalo mínimo de 60 minutos y un relleno vigente de Ana hace 20 minutos, **cuando** Luis pulsa «He rellenado el agua», **entonces** el sistema lo rechaza y la aplicación muestra «Ana la rellenó hace 20 min». Si el relleno de Ana se anula, Luis sí puede registrar el suyo (CA-172; RF-172, RN-082).
4. **Dado** el móvil sin conexión, **entonces** la acción aparece desactivada con el texto «Necesitas conexión para registrar el relleno» (CA-173; RF-173, RN-081).
5. **Dadas** dos personas que pulsan «He rellenado el agua» a la vez, **entonces** solo uno de los dos rellenos queda vigente (EV-100; RN-082, INV-07).
6. **Un** relleno no genera movimientos ni cambia saldos, stock, coste medio ni la hucha (RN-080).

---

### User Story 2 - Corregir un relleno (Priority: P2)

El autor anula un relleno equivocado dentro del plazo de autoanulación. Un administrador puede anular cualquiera en cualquier momento.

**Why this priority**: evita que un relleno declarado sin hacerse cuente en el ranking (HALL-013).

**Independent Test**: Ana anula con motivo su relleno de hace 10 minutos; uno de hace 20 minutos se le rechaza.

**Acceptance Scenarios**:

1. **Ana** anula con motivo su relleno de hace 10 minutos. Uno de hace 20 minutos se rechaza indicando que lo pida a un administrador. Un administrador anula con motivo un relleno de hace 3 días (CA-174; RF-174, RN-083).
2. **Un** relleno anulado no cuenta en el intervalo, en el ranking ni en el aguador del mes (RN-082, RN-083).

---

### User Story 3 - Ranking de rellenos y aguador del mes (Priority: P2)

Todos ven quién rellena más el agua en el periodo elegido. El día 1 de cada mes se reconoce al aguador del mes anterior, que la pantalla principal muestra durante todo el mes.

**Why this priority**: es el reconocimiento que pide ORIG-003, sin premios económicos (EXC-012).

**Independent Test**: en octubre Ana y Jorge registran 6 rellenos cada uno y Luis 4; el 1 de noviembre Ana y Jorge aparecen como aguadores del mes.

**Acceptance Scenarios**:

1. **Luis** (miembro) ve el ranking de rellenos de todos en el periodo elegido. Ana ve en sus estadísticas cuántos rellenos ha registrado (CA-175; RF-175, RN-063).
2. **En** octubre, Ana y Jorge registran 6 rellenos vigentes cada uno y Luis 4. **El** 1 de noviembre, la pantalla principal muestra a Ana y Jorge como aguadores del mes durante todo noviembre, y el resumen mensual lo incluye. Un mes sin rellenos no tiene título. Una persona dada de baja antes del día 1 no opta al título, aunque sus rellenos siguen en el ranking (CA-176; RF-176, RN-084, RN-085).
3. **Si** después del día 1 un administrador anula un relleno del mes anterior, **entonces** el aguador del mes no cambia (Clarifications, punto 1; PEND-033).
4. **Si** el servidor estaba parado el día 1, **entonces** el aguador se determina al arrancar, una sola vez (Clarifications, punto 2).

---

### Edge Cases

- Un relleno registrado exactamente al cumplirse el intervalo mínimo desde el anterior se acepta; uno un instante antes, no. El plan fija qué límite es inclusivo (RN-082).
- Un administrador cambia el intervalo mínimo: el nuevo valor se aplica al siguiente relleno (INV-07: «vigente al registrar el segundo»).
- Intervalo mínimo 0: no hay restricción entre rellenos (RF-150; rango de F7).
- Un relleno registrado a las 23:59 del último día del mes, hora de Madrid, cuenta en ese mes (RN-084).
- Empate de tres o más personas: todas comparten el título (RN-084).
- Una persona reactivada después del día 1 no recibe el título de ese mes, porque no estaba activa al determinarlo (RN-084).

## Requirements *(mandatory)*

### Functional Requirements

**Relleno de agua** (§7.14)

- **RF-170**: La pantalla principal deberá mostrar, encima de los tipos de cápsula, la acción «He rellenado el agua» con el autor y la antigüedad del último relleno vigente (p. ej., «Último: Jorge, hace 3 h»), o «Sin rellenos registrados».
- **RF-171**: Cuando un miembro pulsa «He rellenado el agua», el sistema deberá registrar un relleno a su nombre sin pasos adicionales, y el cliente deberá mostrar durante 5 segundos una confirmación con «Deshacer», anunciada al lector de pantalla.
- **RF-172**: Si se intenta registrar un relleno dentro del intervalo mínimo (RN-082), el sistema deberá rechazarlo y el cliente deberá indicar quién registró el último y hace cuánto (p. ej., «Ana la rellenó hace 20 min»).
- **RF-173**: Sin conexión, el cliente deberá mostrar la acción desactivada con una explicación (RN-081).
- **RF-174**: El autor y los administradores deberán poder anular un relleno según RN-083.
- **RF-175**: Las estadísticas deberán mostrar a todos los miembros el ranking de rellenos vigentes por persona en el periodo elegido. Las estadísticas personales deberán incluir el número de rellenos propios. Los periodos son los de F6: mes natural, año natural y «desde el principio».
- **RF-176**: El día 1 de cada mes, el sistema deberá determinar el aguador del mes anterior según RN-084. La pantalla principal deberá mostrarlo durante todo el mes en curso y el resumen mensual deberá incluirlo (RF-104). El título queda fijado al determinarlo (Clarifications, punto 1).

**Reglas de negocio** (§6.4, §6.8): RN-063 y RN-080 a RN-085.

### Non-Functional Requirements

- **RNF-001**: La acción de relleno, su confirmación y el ranking cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro.
- **RNF-007**: Todos los permisos se comprueban en el servidor.
- Registrar un relleno requiere conexión; no entra en la cola sin conexión (RN-081, EXC-007).

### Out of Scope

- Premios económicos, insignias y logros (EXC-012).
- Otras tareas de mantenimiento de la cafetera (EXC-013).
- Estimar el nivel de agua y avisar de que toca rellenar (EXC-014).
- La pantalla para cambiar el intervalo mínimo (RF-150): F7.

### Key Entities

- **Relleno de agua**: autor, identificador de cliente, instante, estado (vigente o anulado) y anulación (autor, fecha y motivo).
- **Aguador del mes**: mes, persona o personas con el título y número de rellenos. Se fija el día 1 y no se recalcula (PEND-033).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-170 a CA-176**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **EV-100**: con dos rellenos simultáneos, solo uno queda vigente.
- **INV-07**: tiene una prueba que intenta violarla.

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-170 (RF-170) | Último relleno erróneo o anulado | Último de Jorge; sin rellenos; último anulado | Integración + E2E | Prevista |
| CA-171 (RF-171, RN-083) | «Deshacer» que no anula | Deshacer a los 4 s; sin JavaScript | Componente + E2E + `sin-js` | Prevista |
| CA-172, EV-100 (RF-172, RN-082, INV-07) | Dos rellenos dentro del intervalo | 20 min; anulación del anterior; dos a la vez | Integración con concurrencia | Prevista |
| CA-173 (RF-173, RN-081) | Relleno en cola sin conexión | Red desactivada | E2E | Prevista |
| CA-174 (RF-174, RN-083) | Anulación indebida | 10 y 20 minutos; administrador | Integración | Prevista |
| CA-175 (RF-175, RN-063) | Ranking con anulados o en otro huso | Periodo mes; fin de mes en hora de Madrid | Unidad + integración | Prevista |
| CA-176 (RF-176, RN-084, RN-085) | Título a quien no corresponde; título que cambia | Empate; mes vacío; baja antes del día 1; anulación posterior; arranque tras caída | Integración con reloj simulado | Prevista |

## Assumptions

- La anulación de rellenos se ofrece desde la misma lista de registros recientes que los consumos (F3) y desde `/historial` para los administradores.

## Clarifications

### Session 2026-10-22

1. **Aguador del mes tras una anulación (PEND-033).** No se recalcula: el título queda fijado el día 1.
2. **Tarea perdida.** Si el servidor está parado el día 1, el aguador del mes anterior se determina al arrancar, una sola vez.
3. **Periodos del ranking.** Mes natural, año natural y «desde el principio», en hora de Madrid, como las estadísticas de F6.

### Session 2026-10-22 (aprobación del plan, D11)

4. **Intervalo 0.** Desactiva la comprobación (rango de F7: 0 a 1440 minutos).
5. **Hora del aguador.** Se determina el día 1 a las 00:05 de Madrid, antes del resumen mensual de las 09:00.
6. **Rellenos de personas de baja.** Un administrador los puede anular.
7. **Límite exacto.** Un relleno registrado exactamente al cumplirse el intervalo se acepta.
