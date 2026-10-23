# Feature Specification: Registro de consumos, incluido sin conexión (F3)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F3 — Registro de consumos (incluido sin conexión), según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§3, §6.1, §6.2, §6.3, §6.7, §7.2, §7.6, §9 y §15). Los IDs se conservan. Las reglas económicas que aplica son de F4 (`specs/003-economia/spec.md`); aquí se citan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar un café con un toque (Priority: P1)

Un miembro abre la aplicación junto a la cafetera, toca la cápsula que va a usar y el consumo queda registrado a su nombre. El stock baja en 1 y recibe un cargo por el coste medio.

**Why this priority**: es la acción más frecuente de la aplicación y la razón de que exista (HU-01). Si registrar cuesta más que no hacerlo, los datos dejan de reflejar la realidad (constitución X).

**Independent Test**: Ana toca Ristretto, con stock 10 y coste medio 0,3483 €; el stock pasa a 9 y Ana recibe un cargo de 0,35 €.

**Acceptance Scenarios**:

1. **Dado** un tipo activo con coste medio, **entonces** aparece en la pantalla principal con su nombre visible en texto, además de su foto (o su color) y su stock, sus días estimados y su estado de stock bajo (CA-010; RF-010, RF-022).
2. **Dado** un tipo con stock 10 y coste medio 0,3483 €, **cuando** Ana lo toca, **entonces** se crea un consumo, el stock pasa a 9 y Ana recibe un cargo de 0,35 € (CA-011, CA-012; RF-011, RF-012, RN-001, RN-002, RN-021).
3. **Cuando** Ana toca un tipo, **entonces** aparece durante 5 segundos un aviso con «Deshacer» que el lector de pantalla anuncia. Si lo pulsa, el consumo queda anulado como «Deshecho por el autor» y el stock vuelve a 10 (CA-013; RF-013, RN-031). Sin JavaScript, «Deshacer» sigue disponible sin cuenta atrás (constitución X).
4. **Cuando** Ana registra un consumo marcado como invitado, **entonces** el cargo va a Ana y las estadísticas lo cuentan como invitado (CA-014; RF-014).
5. **Dado** un tipo con stock 0 y último coste conocido 0,40 €, **cuando** Luis lo toca, **entonces** se registra el consumo, el stock pasa a −1, Luis recibe un cargo de 0,40 € y un aviso del descuadre, y queda registrado el aviso «stock negativo» para los administradores (CA-017; RF-017, RN-005).
6. **Con** red, el consumo se confirma en pantalla en 1 segundo o menos en el percentil 95 (RNF-002).
7. **Dado** un tipo que nunca se ha comprado, o un tipo retirado, **entonces** no aparece en la pantalla principal (RN-006, RF-004).

---

### User Story 2 - Registrar sin conexión (Priority: P1)

Sin cobertura, el consumo queda en el móvil como «pendiente de enviar» y se envía solo al recuperar la conexión, sin duplicarse.

**Why this priority**: junto a la cafetera la cobertura puede fallar. Un café que no se registra reparte su coste entre todos (§13.3).

**Independent Test**: sin conexión, Ana toca un tipo; el consumo aparece como pendiente. Al volver la conexión se envía una sola vez con la hora del toque.

**Acceptance Scenarios**:

1. **Dado** el móvil sin conexión, **cuando** Ana toca un tipo, **entonces** el consumo aparece como «pendiente de enviar» y un aviso indica el riesgo de borrar los datos del navegador. Al recuperar la conexión, el consumo se envía con la hora del toque y se le aplica el coste medio vigente en ese momento (CA-015; RF-015, RF-018, RF-019, RN-002).
2. **Dado** un consumo ya recibido con identificador X, **cuando** el cliente reenvía X, **entonces** el sistema no crea otro consumo y responde con el original (CA-016; RF-016, EV-010, INV-04).
3. **Dado** un consumo en la cola local, **cuando** Ana pulsa «Deshacer», **entonces** el consumo desaparece de la cola y el servidor nunca lo recibe (CA-063; RF-063).
4. **Dado** Luis dado de baja con consumos en la cola de su móvil, **cuando** llegan al servidor, **entonces** se rechazan, el móvil se lo indica y su saldo sigue en 0 (EV-041; RN-054, INV-06).
5. **La** aplicación distingue en pantalla «pendiente de enviar», «registrado» y «rechazado» (constitución X).

---

### User Story 3 - Anular un consumo (Priority: P2)

El autor anula un consumo equivocado dentro del plazo de autoanulación. Un administrador puede anular cualquiera en cualquier momento.

**Why this priority**: corrige errores, pero «Deshacer» cubre la mayoría de los casos (HU-02, HU-14).

**Independent Test**: Ana anula con motivo un consumo de hace 10 minutos; uno de hace 20 minutos se le rechaza.

**Acceptance Scenarios**:

1. **Dado** un consumo de Ana registrado hace 10 minutos, **cuando** Ana lo anula con motivo, **entonces** queda anulado y el cargo deja de contar (CA-060; RF-060, RN-032, RN-013).
2. **Dado** un consumo de Ana de hace 3 días, **cuando** un administrador lo anula con motivo, **entonces** queda anulado con el administrador como autor de la anulación (CA-061; RF-061, RN-033).
3. **Dado** un consumo de Ana de hace 20 minutos, **cuando** Ana intenta anularlo, o Luis intenta anular uno de Ana, **entonces** el sistema lo rechaza indicando que lo pida a un administrador (CA-062; RF-062).
4. **Dado** un consumo ya anulado, **cuando** se intenta anularlo otra vez, también a la vez, **entonces** se rechaza (EV-011; INV-05).
5. **Al** anular un consumo, el stock aumenta en 1 y no se recalcula ningún otro cargo ni el coste medio (RN-013).

---

### Edge Cases

- Dos toques seguidos sobre el mismo tipo registran dos consumos, cada uno con su identificador y su «Deshacer» (RF-011, RF-016).
- La respuesta del servidor se pierde: el cliente reenvía el mismo identificador y recibe el consumo original (EV-010).
- Un consumo en cola de un tipo que se retiró mientras esperaba: el servidor lo acepta si el tipo tiene coste medio, porque el café se hizo cuando el tipo estaba activo (Clarifications, punto 3).
- Un consumo en cola de un tipo cuya única compra se anuló mientras esperaba: el tipo ya no tiene coste medio (RN-006): el servidor lo rechaza y el móvil lo indica (Clarifications, punto 3).
- La sesión caduca con consumos en cola: se envían al volver a iniciar sesión, solo si es la misma persona; si entra otra persona en ese dispositivo, no se envían a su nombre (RN-034) (Clarifications, punto 4).
- El «Deshacer» llega después de los 5 segundos por una red lenta: se acepta si el servidor recibió la orden antes de que venciera el plazo de autoanulación, y entonces se trata como una anulación del autor sin motivo (RN-031) (Clarifications, punto 5).
- Stock que pasa de 0 a −1, y de −1 a −2: cada consumo con stock ≤ 0 avisa al autor y registra el aviso a los administradores (RF-017).
- Consumo que hace entrar el tipo en stock bajo: queda registrada la entrada según RN-072 (F2).
- Sin conexión y sin la aplicación cargada antes: la pantalla no puede abrirse; la aplicación instalada sí funciona (RF-015).

## Requirements *(mandatory)*

### Functional Requirements

**Registro de consumos** (§7.2)

- **RF-010**: La pantalla principal deberá mostrar los tipos activos con coste medio, con foto, color, nombre, marca, intensidad, stock y estado de stock bajo.
- **RF-011**: Cuando un miembro toca un tipo, el sistema deberá registrar un consumo de una cápsula a su nombre sin pasos adicionales.
- **RF-012**: Cuando se registra un consumo, el sistema deberá reducir en 1 el stock del tipo y generar un cargo al autor según RN-002 y RN-021.
- **RF-013**: Tras registrar un consumo, el cliente deberá mostrar durante 5 segundos una confirmación con el botón «Deshacer», anunciada al lector de pantalla.
- **RF-014**: El miembro deberá poder marcar un consumo como «para un invitado» mediante una opción secundaria. El cargo va al autor.
- **RF-015**: Si no hay conexión al registrar un consumo, el cliente deberá guardarlo en una cola local, mostrarlo como «pendiente de enviar» y enviarlo al recuperar la conexión.
- **RF-016**: Cada consumo deberá llevar un identificador único generado en el cliente. El sistema deberá ignorar un consumo cuyo identificador ya exista y devolver el registro original.
- **RF-017**: Si el stock del tipo es ≤ 0, el sistema deberá registrar el consumo, avisar al autor del descuadre y notificar a los administradores. En F3 el aviso a los administradores queda registrado y visible en el panel; el envío push es de F5.
- **RF-018**: El sistema deberá guardar en cada consumo la hora del toque en el cliente y la hora de recepción en el servidor.
- **RF-019**: Mientras haya consumos pendientes de enviar, el cliente deberá mostrar un aviso visible de que se perderán si se borran los datos del navegador.

**Anulaciones de consumos** (§7.6)

- **RF-060**: Un miembro deberá poder anular sus propios consumos dentro del plazo de autoanulación, indicando un motivo.
- **RF-061**: Un administrador deberá poder anular cualquier consumo, indicando un motivo.
- **RF-062**: Si un miembro intenta anular un consumo ajeno o fuera de plazo, el sistema deberá rechazarlo con un mensaje que indique que debe pedirlo a un administrador.
- **RF-063**: Si se pulsa «Deshacer» sobre un consumo aún en la cola local, el cliente deberá eliminarlo de la cola sin enviarlo.

F4 ya aplica RF-060 a RF-062 a las aportaciones y las compras.

**Reglas de negocio**: aplica RN-001, RN-002, RN-005, RN-006, RN-013, RN-021 y RN-030 a RN-035, cuyo dueño es F4, y RN-054 (§6.3), que F1 dejó para esta funcionalidad.

### Non-Functional Requirements

- **RNF-001**: La pantalla principal cumple WCAG 2.2 AA y supera axe en tema claro y oscuro. Los botones de cápsula miden al menos 44 × 44 px, y la confirmación se anuncia sin mover el foco.
- **RNF-002**: Con red, el consumo se confirma en pantalla en 1 segundo o menos en el percentil 95, con 30 usuarios registrados.
- **RNF-010**: Cada consumo y sus efectos (cargo y stock) se guardan en una única transacción.
- **RNF-011**: Los consumos se conservan en la cola local durante despliegues y caídas del servidor.
- **RNF-013**: Funciona en las dos últimas versiones de Safari (iOS ≥ 16.4) y de Chrome (Android), también instalada como PWA.
- El navegador solo guarda la cola de consumos pendientes, sin datos personales más allá de lo necesario para enviarlos (constitución V).
- Un cambio en el contrato de envío de consumos acepta el formato anterior mientras puedan existir consumos en cola con él (constitución XIV).

### Out of Scope

- Registrar aportaciones, compras, rellenos o acciones de administración sin conexión (EXC-007).
- Registrar consumos a nombre de otro miembro (EXC-006).
- El historial económico completo con filtros (RF-111 a RF-113): F6.
- El envío push de los avisos: F5.

### Key Entities

- **Consumo**: autor, tipo de cápsula, marca de invitado, identificador de cliente, hora del toque, hora de recepción, precio aplicado, estado (vigente o anulado) y anulación (autor, fecha y motivo; «Deshecho por el autor» sin motivo).
- **Cargo de consumo**: movimiento negativo al autor por el precio aplicado (RN-001, RN-021).
- **Cola local de consumos**: consumos pendientes de enviar, guardados solo en el dispositivo (constitución V).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-010 a CA-017 y CA-060 a CA-063**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **CA-020 y CA-023**: las pruebas de F2 se repiten con consumos reales y pasan.
- **CA-045**: la prueba de F4 se repite con consumos registrados y pasa.
- **EV-010, EV-011 y EV-041**: cada escenario tiene su prueba y pasa.
- **INV-04 e INV-06**: cada invariante tiene una prueba que intenta violarla.
- **RNF-002**: el registro de un consumo con red se confirma en 1 segundo o menos en el percentil 95 en la prueba de carga de la pantalla principal.

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-010 (RF-010, RN-006) | Tipo sin precio registrable; cápsula sin nombre en texto | Tipo nunca comprado; tipo retirado | Integración + E2E | Prevista |
| CA-011, CA-012 (RF-011, RF-012, RN-002, RN-021) | Cargo mal redondeado | 0,3483 € → 0,35 €; 0,345 € → 0,35 € | Unidad con propiedades + integración | Prevista |
| CA-013 (RF-013, RN-031) | «Deshacer» que no anula o que pide motivo | Deshacer a los 4 s; sin JavaScript | Componente + E2E + `sin-js` | Prevista |
| CA-014 (RF-014) | Invitado cargado a otra persona | Consumo de invitado | Integración | Prevista |
| CA-015 (RF-015, RF-018, RF-019, RN-002) | Consumo perdido o con precio de la hora del toque | Sin conexión y vuelta de la conexión | E2E con red emulada | Prevista |
| CA-016, EV-010 (RF-016, INV-04) | Consumo duplicado | Reenvío con el mismo identificador, también en paralelo | Integración con concurrencia | Prevista |
| CA-017 (RF-017, RN-005) | Stock negativo sin aviso | Stock 0 y −1 | Integración | Prevista |
| CA-060 a CA-062, EV-011 (RF-060 a RF-062, INV-05) | Anulación indebida o doble | 10 y 20 minutos; ajena; dos anulaciones simultáneas | Integración con concurrencia | Prevista |
| CA-063 (RF-063) | Consumo deshecho que llega al servidor | Deshacer en la cola | Componente + E2E | Prevista |
| EV-041 (RN-054, INV-06) | Saldo distinto de 0 tras la baja | Consumos en cola de una persona dada de baja | Integración | Prevista |
| RNF-002 | Registro lento | 30 usuarios; p95 | Carga ligera | Prevista |
| RNF-001, EV-060 | Pantalla principal no accesible | Pantalla principal y confirmación | Suite `a11y`, claro y oscuro | Prevista |

## Assumptions

- La anulación de consumos se ofrece desde una lista de los registros recientes de la persona y desde `/historial` para los administradores. F6 completa `/historial` con el resto de registros y los filtros (§10.5) (Clarifications, punto 6).
- El plazo de autoanulación se lee del almacén de configuración de F1 (15 minutos por defecto, RF-150).
- La cola sin conexión y la cuenta atrás de «Deshacer» son excepciones cerradas a la regla de funcionar sin JavaScript (constitución XVII).

## Clarifications

### Session 2026-10-22

1. **Avisos antes de F5.** El aviso de stock negativo a los administradores queda registrado y visible en el panel de avisos. El envío push es de F5.
2. **Anulaciones.** F4 implementa RF-060 a RF-062 para aportaciones y compras; F3 los aplica a los consumos y añade «Deshacer» y RF-063.
3. **Consumo en cola de un tipo retirado.** El servidor lo acepta si el tipo tiene coste medio. Si el tipo ya no tiene coste medio (su única compra se anuló), lo rechaza y el móvil lo indica.
4. **Cola con la sesión caducada.** Los consumos en cola se envían al volver a iniciar sesión solo si entra la misma persona.
5. **«Deshacer» tardío.** Se acepta si llega dentro del plazo de autoanulación y se trata como una anulación del autor sin motivo.
6. **Dónde se anula.** Desde la lista de registros recientes de la persona y, para los administradores, desde `/historial`.

### Session 2026-10-22 (aprobación del plan, D14)

7. **Baja indicada al móvil.** Quien envía consumos con una sesión cerrada por su baja recibe «Tu cuenta está dada de baja» (`USUARIO_DE_BAJA`).
8. **Consumo con precio 0.** Si el precio redondeado es 0, se registra el consumo sin movimiento.
9. **Hora del toque adelantada.** Se sustituye por la hora de recepción.
10. **Consumos en cola de otra persona.** Se conservan en el dispositivo sin mostrarse a quien tiene la sesión, hasta que la persona dueña vuelve a entrar.
