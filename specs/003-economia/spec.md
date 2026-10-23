# Feature Specification: Economía: aportaciones, compras, arqueos, recuentos y bajas (F4)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F4 — Economía: aportaciones, compras, coste medio, regularización, arqueos, recuentos, repartos, bajas, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§3, §6.1, §6.2, §6.3, §6.6, §6.7, §7.4 a §7.7, §7.10, §9 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications.

**Orden**: F4 se implementa antes que F3 (§15). Esta especificación es la dueña de las reglas económicas RN-001 a RN-021, también de las que afectan a los consumos. F3 las aplica y las cita.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aportar dinero a la hucha (Priority: P1)

Un miembro mete dinero en la hucha y lo registra. Su saldo sube y el saldo teórico de la hucha también.

**Why this priority**: es la única forma de pagar lo que se consume. Sin aportaciones no hay economía (NEC-004).

**Independent Test**: Luis, con −4,00 €, aporta 5,00 € y queda con +1,00 €; la hucha teórica sube 5,00 €.

**Acceptance Scenarios**:

1. **Dado** Luis con saldo −4,00 € y una hucha teórica de 10,00 €, **cuando** registra una aportación de 5,00 €, **entonces** su saldo es +1,00 € y la hucha teórica 15,00 € (CA-030; RF-030, RF-031, RN-008).
2. **Cuando** se envía una aportación de 0 €, de −3 € o de más de 500 €, **entonces** el sistema la rechaza (CA-031; RF-032).
3. **Dada** una aportación ya recibida con un identificador de cliente, **cuando** el cliente la reenvía, **entonces** no se crea otra (RF-046).
4. **Nadie** puede registrar una aportación a nombre de otra persona (RN-034).

---

### User Story 2 - Registrar una compra de cápsulas (Priority: P1)

Un miembro compra cápsulas con dinero de la hucha y lo registra con una o varias líneas. El stock y el coste medio de cada tipo se actualizan, y la hucha teórica baja.

**Why this priority**: las compras fijan el coste medio, que es el precio de cada café (RN-002). Sin compras no se puede registrar ningún consumo (RN-006).

**Independent Test**: Marta registra 50 Ristretto por 17,00 € con un stock previo de 10 a 0,4000 €; el stock pasa a 60 y el coste medio a 0,3500 €.

**Acceptance Scenarios**:

1. **Cuando** Marta registra una compra con dos líneas (50 Ristretto por 17,00 € y 20 Decaf por 7,00 €), **entonces** el formulario muestra un total calculado de 24,00 € y la compra se guarda con ese total. Con una sola línea, el formulario pide un único importe (CA-040; RF-040, RN-037).
2. **Dado** Ristretto con stock 10 y coste medio 0,4000 €, **cuando** se registra una línea de 50 por 17,00 €, **entonces** el stock pasa a 60 y el coste medio a 0,3500 €. **Dado** stock −2, la misma línea deja el coste medio en 0,3400 € y el stock en 48 (CA-041; RF-041, RN-003, RN-004).
3. **Entonces** la compra muestra a Marta como autora, y su saldo personal no cambia (CA-042; RF-042, RN-009). Puede adjuntar una foto opcional del ticket, con las validaciones de RF-005.
4. **Dada** una hucha teórica de 12,00 €, **cuando** Marta introduce una compra de 20,00 €, **entonces** la aplicación muestra «La hucha debería tener 12,00 €» y pide confirmación. Si confirma, la hucha teórica queda en −8,00 € y queda registrado el aviso a los administradores (CA-043; RF-043, RF-044, RN-019).
5. **Dada** una compra ya recibida con un identificador de cliente, **cuando** el cliente la reenvía, **entonces** no se crea otra (RF-046).
6. **Una** compra no tiene importe máximo (Clarifications, punto 3).

---

### User Story 3 - Corregir aportaciones y compras con anulaciones (Priority: P1)

El autor anula su aportación o su compra dentro del plazo de autoanulación. Un administrador puede anular cualquiera en cualquier momento. Anular una compra reconstruye el coste medio y regulariza a quienes consumieron con el precio equivocado.

**Why this priority**: los registros económicos nunca se borran ni se modifican (constitución IV). Sin anulación, un error no se puede corregir.

**Independent Test**: un administrador anula una compra errónea con consumos posteriores, y cada persona afectada recibe una regularización por la diferencia.

**Acceptance Scenarios**:

1. **Dada** una aportación de Ana de hace 10 minutos, **cuando** Ana la anula con motivo, **entonces** queda anulada y deja de contar en su saldo y en la hucha (CA-060 aplicado a aportaciones; RF-060, RN-032, RN-035).
2. **Dada** una aportación de Ana de hace 3 días, **cuando** un administrador la anula con motivo, **entonces** queda anulada con el administrador como autor de la anulación (CA-061 aplicado a aportaciones; RF-061, RN-033).
3. **Dada** una compra de Ana de hace 20 minutos, **cuando** Ana intenta anularla, o Luis intenta anular una de Ana, **entonces** el sistema lo rechaza indicando que lo pida a un administrador (CA-062 aplicado a compras; RF-062).
4. **Dada** una compra errónea de 50 cápsulas por 200,00 € que elevó el coste medio a 3,6000 €, y tres consumos posteriores de Ana, Luis y Marta a 3,60 €, **cuando** un administrador anula la compra, **entonces** el coste medio vuelve al valor reconstruido (por ejemplo, 0,4000 €), y Ana, Luis y Marta reciben cada uno una regularización de +3,20 €. Los cargos originales no cambian. La aplicación muestra el resumen de regularizaciones (CA-045; RF-045, RN-012).
5. **Dada** una compra con dos líneas y consumos posteriores de los dos tipos, **cuando** se anula, **entonces** se anulan las dos líneas y cada tipo se regulariza por separado (EV-090; RN-037, RN-012).
6. **Dado** un registro ya anulado, **cuando** se intenta anularlo otra vez, también a la vez desde dos dispositivos, **entonces** el sistema lo rechaza y el registro no vuelve a estar vigente (EV-011; RN-030, INV-05).

---

### User Story 4 - Arqueo de la hucha y recuento de stock (Priority: P1)

Un administrador cuenta el dinero real de la hucha y las cápsulas que quedan. Si no cuadran, la diferencia se reparte a partes iguales entre los miembros activos.

**Why this priority**: es el mecanismo que corrige los cafés no registrados y las aportaciones declaradas que no se hicieron (§13.3).

**Independent Test**: con 6 miembros activos y una diferencia de −7,00 €, se generan 6 cargos que suman exactamente 7,00 €.

**Acceptance Scenarios**:

1. **Dada** una hucha teórica de 42,00 €, **cuando** un administrador registra un arqueo con 35,00 € contados, **entonces** el arqueo guarda saldo teórico 42,00 €, contado 35,00 € y diferencia −7,00 € (CA-080; RF-080).
2. **Con** 6 miembros activos y diferencia −7,00 €, **entonces** el cliente muestra el reparto previsto, y al confirmar se generan 6 cargos que suman exactamente 7,00 € (cuatro de 1,17 € y dos de 1,16 €, con los céntimos sobrantes asignados al azar y registrados). La hucha teórica pasa a 35,00 € (CA-081; RF-081, RF-082, RN-014, RN-015).
3. **Dado** Ristretto con stock registrado 30 y coste medio 0,4000 €, **cuando** un administrador cuenta 24, **entonces** el stock pasa a 24 y se reparten 2,40 € en cargos entre los miembros activos (CA-090, CA-091; RF-090, RF-091, RN-016).
4. **Dado** stock registrado 20, **cuando** se cuentan 23, **entonces** el stock pasa a 23 sin movimientos económicos y con el mismo coste medio (CA-092; RF-092).
5. **El** administrador abre la pantalla de control y puede registrar un arqueo, un recuento o los dos, cada uno con su propia confirmación y su propio registro (CA-093; RF-093).
6. **Dado** un arqueo A1 seguido de un arqueo A2, **cuando** un administrador intenta anular A1, **entonces** el sistema lo rechaza. **Cuando** anula A2 con motivo, se revierten su ajuste y sus cargos, y la hucha teórica vuelve al valor previo a A2. **Dado** un recuento R2 de Ristretto posterior a R1, R1 no se puede anular para Ristretto (CA-064; RF-064, RN-036, EV-080).
7. **Dado** un administrador que introdujo la contraseña hace 20 minutos, **cuando** intenta registrar un arqueo o un recuento, **entonces** la aplicación le pide la contraseña antes de continuar (CA-138; RF-138, RN-050).

---

### User Story 5 - Dar de baja a una persona con liquidación (Priority: P2)

Un administrador da de baja a una persona que deja el departamento. Un asistente muestra su saldo y exige dejarlo en 0 antes de confirmar: con un pago, con una devolución desde la hucha o registrando la deuda como incobrable.

**Why this priority**: es necesario cuando alguien se va, pero no es diario.

**Independent Test**: Luis, con −6,00 € y sin pagar, se da de baja con deuda incobrable: queda con saldo 0 y se reparten 6,00 € entre los demás activos.

**Acceptance Scenarios**:

1. **Dado** Luis con saldo −6,00 € que no paga, **cuando** un administrador lo da de baja registrando deuda incobrable, **entonces** Luis queda con saldo 0 y dado de baja, se reparten 6,00 € en cargos entre los demás activos y sus sesiones quedan invalidadas (CA-135; RF-135, RN-017, RN-044, RN-051).
2. **Dada** Ana con +10,00 €, **cuando** un administrador la da de baja, **entonces** se registra una devolución de 10,00 € y la hucha teórica baja 10,00 € (CA-135; RN-018).
3. **Dada** Ana con +10,00 € y una hucha teórica de 6,00 €, **cuando** un administrador prepara la baja, **entonces** la aplicación muestra el saldo teórico y pide confirmación. Si confirma, la hucha queda en −4,00 € y queda registrado el aviso a los administradores (Clarifications, punto 4; RN-019).
4. **Dado** Luis con −6,00 € que paga en efectivo, **cuando** el administrador registra su pago como aportación de Luis y confirma la baja, **entonces** Luis queda con saldo 0 y dado de baja (RN-017).
5. **Dado** el único administrador activo, **cuando** se intenta darlo de baja, **entonces** el sistema lo rechaza. **Dados** los dos últimos administradores activos, una baja y un cambio de rol simultáneos nunca dejan el sistema sin administrador (EV-040; RN-041, INV-03).
6. **Cuando** se da de baja a una persona, **entonces** la acción queda en el registro de auditoría con su autor y su fecha (RF-139c).
7. **Dado** Luis reactivado tras su baja, **entonces** vuelve con saldo 0 aunque tuviera movimientos anteriores (RN-045; CA-136 con movimientos).

---

### User Story 6 - Ver el estado de la hucha y las deudas en el panel de avisos (Priority: P2)

Al abrir la aplicación, cualquier miembro ve el saldo teórico de la hucha y las personas con saldo por debajo del límite de deuda, además de los tipos en stock bajo (F2).

**Why this priority**: completa el panel de avisos de F2 (RF-021) y da transparencia sobre el dinero común (NEC-007).

**Independent Test**: con Luis en −6,00 € y el límite en −5,00 €, el panel muestra a Luis por debajo del límite y el saldo teórico de la hucha.

**Acceptance Scenarios**:

1. **Cuando** cualquier miembro abre la aplicación, **entonces** ve el panel de avisos con los tipos en stock bajo, el saldo teórico de la hucha y las personas por debajo del límite de deuda (CA-021; RF-021).
2. **Cada** miembro ve su saldo y el saldo teórico de la hucha, y registra desde ahí sus aportaciones (Assumptions).

---

### Edge Cases

- Reparto de 0,01 € entre 10 personas: una persona recibe 0,01 € y nueve, 0 €. La suma es exactamente el importe (EV-020; RN-014, INV-01).
- Reparto con un único miembro activo: recibe todo el importe (RN-014).
- Compra con stock negativo previo: el coste medio es solo el de la compra (RN-004, CA-041).
- Anulación de una compra con compras posteriores del mismo tipo y stock negativo intermedio: el coste medio se reconstruye con las compras vigentes en orden (EV-031; RN-012).
- Anulación de una compra que deja un tipo sin ninguna compra vigente: el tipo vuelve a no tener coste medio y deja de ofrecerse para registrar consumos (RN-006). Para la regularización (RN-012), el precio que «debió aplicarse» a los consumos posteriores es el coste de la siguiente compra vigente del tipo; si no hay ninguna, los cargos se mantienen y el arqueo absorbe la diferencia (Clarifications, punto 5).
- Anulación concurrente de una compra mientras se registra un consumo del mismo tipo: el stock y el coste medio guardados siguen coincidiendo con su recálculo (EV-030; INV-02).
- Arqueo con diferencia 0: se registra sin reparto (RN-015).
- Recuento de varios tipos a la vez, unos con faltante y otros con sobrante (RF-090, EV-080).
- Recuento con faltante de un tipo sin coste medio (por ejemplo, con stock procedente solo de un sobrante): el faltante vale 0 € y no se reparte nada; el stock sí se corrige (Clarifications, punto 6).
- Importe de aportación con más de dos decimales, o con un formato no numérico: se rechaza (RN-020).
- Un fallo a mitad de un registro económico no deja ningún efecto parcial (RNF-010).
- Sin conexión, las aportaciones, las compras y las acciones de administración no están disponibles (EXC-007).

## Requirements *(mandatory)*

### Functional Requirements

**Aportaciones** (§7.4)

- **RF-030**: Un miembro deberá poder registrar una aportación propia con un importe mayor que 0.
- **RF-031**: Cuando se registra una aportación, el sistema deberá generar un abono al autor y aumentar el saldo teórico de la hucha.
- **RF-032**: El sistema deberá rechazar importes ≤ 0 o superiores a 500 €.

**Compras** (§7.5)

- **RF-040**: Un miembro deberá poder registrar una compra con una o varias líneas (RN-037). Cada línea indica tipo, cantidad (> 0) e importe (> 0). Con una sola línea, el formulario pide el importe una vez. Con varias, muestra el total calculado para compararlo con el ticket. No hay importe máximo (Clarifications, punto 3).
- **RF-041**: Cuando se registra una compra, el sistema deberá aumentar el stock de cada tipo, recalcular su coste medio según RN-003/RN-004 y reducir el saldo teórico de la hucha.
- **RF-042**: La compra deberá registrar quién la hizo y permitir adjuntar una foto opcional del ticket, con las validaciones de RF-005.
- **RF-043**: Si el importe deja el saldo teórico de la hucha negativo, el cliente deberá mostrar el saldo teórico y pedir confirmación antes de enviar.
- **RF-044**: Cuando se confirma una compra que deja el saldo teórico negativo, el sistema deberá notificar a los administradores. En F4 el aviso queda registrado y visible en el panel; el envío push es de F5 (Clarifications, punto 1).
- **RF-045**: Cuando se anula una compra, el sistema deberá aplicar RN-012 y mostrar al autor de la anulación el resumen de regularizaciones generadas.
- **RF-046**: Las compras y las aportaciones deberán ser idempotentes mediante identificador de cliente, como en RF-016.

**Anulaciones de aportaciones y compras** (§7.6; Clarifications, punto 2)

- **RF-060**: Un miembro deberá poder anular sus propias aportaciones y compras dentro del plazo de autoanulación, indicando un motivo.
- **RF-061**: Un administrador deberá poder anular cualquier aportación o compra, indicando un motivo.
- **RF-062**: Si un miembro intenta anular una aportación o una compra ajena, o fuera de plazo, el sistema deberá rechazarlo con un mensaje que indique que debe pedirlo a un administrador.
- **RF-064**: Un administrador deberá poder anular, con motivo, el último arqueo y el último recuento de cada tipo según RN-036. Si el registro no es el último, el sistema deberá rechazar la anulación.

F3 aplica RF-060 a RF-062 a los consumos y añade RF-063.

**Arqueos y recuentos** (§7.7)

- **RF-080**: Un administrador deberá poder registrar un arqueo indicando el importe contado. El sistema guarda saldo teórico, contado y diferencia.
- **RF-081**: Cuando un arqueo tiene diferencia ≠ 0, el sistema deberá aplicar RN-015 y RN-014.
- **RF-082**: Antes de confirmar un arqueo o un recuento, el cliente deberá mostrar el importe por persona que generará el reparto.
- **RF-090**: Un administrador deberá poder registrar un recuento de stock con la cantidad contada de uno o varios tipos.
- **RF-091**: Cuando un recuento detecta un faltante, el sistema deberá aplicar RN-016 y RN-014.
- **RF-092**: Cuando un recuento detecta un sobrante, el sistema deberá aumentar el stock sin movimientos económicos.
- **RF-093**: El arqueo y el recuento deberán poder hacerse desde una pantalla común, como operaciones independientes.

**Bajas** (§7.10)

- **RF-135**: Un administrador deberá poder dar de baja a un usuario mediante un asistente que muestre su saldo y exija liquidarlo (pago, devolución o deuda incobrable) antes de confirmar. Si la devolución deja el saldo teórico de la hucha negativo, se aplica RN-019 (Clarifications, punto 4).

**Panel de avisos** (§7.3)

- **RF-021**: La aplicación deberá mostrar al abrirla un panel de avisos con los tipos en stock bajo, el saldo teórico de la hucha y las personas con saldo por debajo del límite de deuda. F4 completa lo que F2 empezó.

**Reglas de negocio** (§6.1, §6.2, §6.3): esta especificación es la dueña de RN-001 a RN-021, RN-030 a RN-037, RN-044 y RN-045 con movimientos.

- RN-001, RN-002, RN-005, RN-013 y RN-021 se refieren a los consumos. F4 los define y los prueba con consumos preparados; F3 los aplica al registrar y anular consumos.
- RN-012 (regularización) se prueba en F4 con consumos preparados (CA-045, EV-031, EV-090). F3 la repite con consumos registrados.
- RN-034 (nadie registra aportaciones a nombre de otra persona) se cumple porque el autor es siempre la persona con sesión. La única excepción es el pago de una baja, que registra el administrador a nombre de la persona que se va (RN-017).

### Non-Functional Requirements

- **RNF-001**: Las pantallas nuevas (aportación, compra, anulación, control de arqueos y recuentos, asistente de baja) cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro.
- **RNF-007**: Todos los permisos se comprueban en el servidor (EV-050).
- **RNF-010**: Cada registro económico y sus efectos (movimientos, stock, coste medio) se guardan en una única transacción.
- **RNF-012**: Toda la interfaz está en español, con los textos centralizados.
- Los importes se guardan como enteros en céntimos y el coste medio en diezmilésimas de euro (RN-020, constitución IV).
- Las acciones con efectos económicos sobre otras personas (arqueo, recuento, baja, anulación, compra que deja la hucha en negativo) muestran su efecto y piden confirmación (constitución X).
- Todas las acciones con formulario funcionan sin JavaScript cuando hay conexión (constitución XVII).

### Out of Scope

- Registrar consumos, «Deshacer» y la cola sin conexión: F3.
- Los saldos de todos, el historial económico completo y el detalle de movimientos (RF-110 a RF-113): F6.
- El envío push de los avisos (hucha negativa, stock negativo, deuda): F5.
- La pantalla para cambiar el plazo de autoanulación y el límite de deuda (RF-150): F7. F4 usa los valores del almacén de configuración de F1.
- Modos de reparto distintos de «por consumo», cuotas y cierres periódicos (EXC-001, EXC-002, EXC-004).
- Pagar compras con dinero propio y reembolsos (EXC-005).

### Key Entities

- **Aportación**: autor, importe, identificador de cliente, instante, estado (vigente o anulada) y anulación (autor, fecha y motivo).
- **Compra**: autor, líneas, importe total, foto del ticket opcional, identificador de cliente, instante, estado y anulación.
- **Línea de compra**: tipo de cápsula, cantidad e importe.
- **Movimiento**: apunte con importe con signo sobre una persona o sobre la hucha, y su origen (aportación, consumo, arqueo, recuento, reparto, regularización, liquidación). Los saldos se derivan de los movimientos vigentes (constitución IV).
- **Arqueo**: autor, saldo teórico, importe contado, diferencia, reparto y estado.
- **Recuento**: autor, tipos contados con su stock registrado y su cantidad contada, reparto y estado.
- **Reparto**: importe, miembros activos en ese momento, importe de cada uno y asignación registrada de los céntimos sobrantes (RN-014).
- **Regularización**: persona, consumo afectado, importe y compra anulada que la origina (RN-012).
- **Liquidación de baja**: persona, saldo previo, tipo (pago, devolución o deuda incobrable) y movimientos generados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-021, CA-030, CA-031, CA-040 a CA-043, CA-045, CA-064, CA-080, CA-081, CA-090 a CA-093 y CA-135**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **CA-060 a CA-062**: tienen sus pruebas con aportaciones y compras y pasan. F3 las repite con consumos.
- **CA-138**: el arqueo, el recuento y la baja piden la contraseña con 16 minutos desde la última autenticación.
- **EV-011, EV-020, EV-030, EV-031, EV-040, EV-080 y EV-090**: cada escenario tiene su prueba y pasa.
- **INV-01, INV-02, INV-03 e INV-05**: cada invariante tiene una prueba que intenta violarla (constitución IV).
- **Cobertura**: 90 % de líneas y ramas en el módulo de economía y en `dominio/` (constitución VIII).

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-030, CA-031 (RF-030 a RF-032, RN-008) | Saldo o hucha mal calculados; importes fuera de rango | 5,00 € con −4,00 €; 0, −3 y 500,01 € | Unidad + integración | Prevista |
| RF-046 | Aportación o compra duplicada | Reenvío con el mismo identificador | Integración | Prevista |
| CA-040, CA-041 (RF-040, RF-041, RN-003, RN-004, RN-037) | Coste medio o stock incorrectos | Dos líneas; stock 10 y −2 | Unidad con propiedades | Prevista |
| CA-042 (RF-042, RN-009) | La compra cambia el saldo del autor | Saldo de Marta antes y después | Integración | Prevista |
| CA-043 (RF-043, RF-044, RN-019) | Hucha negativa sin confirmación | 20,00 € con 12,00 € | Integración + E2E | Prevista |
| CA-045, EV-031, EV-090 (RF-045, RN-012, RN-037) | Regularización errónea; cargos originales modificados | Compra errónea con consumos; compras posteriores; stock negativo; dos líneas | Unidad con propiedades | Prevista |
| EV-030 (INV-02) | Stock o coste medio desfasados | Secuencias aleatorias de compras, consumos y anulaciones | Propiedades + integración concurrente | Prevista |
| CA-060 a CA-062, EV-011 (RF-060 a RF-062, RN-030 a RN-033, INV-05) | Anulación fuera de plazo, ajena o doble | 10 y 20 minutos; ajena; dos anulaciones simultáneas | Integración con concurrencia | Prevista |
| CA-080, CA-081, EV-020 (RF-080 a RF-082, RN-014, RN-015, INV-01) | Reparto que no suma el importe | 7,00 € entre 6; 0,01 € entre 10 | Unidad con propiedades + integración | Prevista |
| CA-090 a CA-093 (RF-090 a RF-093, RN-016) | Faltante sin reparto; sobrante con coste | 30 → 24; 20 → 23; varios tipos | Integración | Prevista |
| CA-064, EV-080 (RF-064, RN-036) | Anulación de un arqueo o recuento antiguo | A1 y A2; R1 y R2 por tipo | Integración | Prevista |
| CA-135, EV-040 (RF-135, RN-017, RN-018, RN-041, RN-044, INV-03) | Baja con saldo distinto de 0; sistema sin administrador | Deuda incobrable; devolución; pago; hucha negativa; dos últimos administradores | Integración con concurrencia + E2E | Prevista |
| CA-138 (RF-138, RN-050) | Acción económica desde una sesión olvidada | 15 y 16 minutos con reloj fijo | Integración | Prevista |
| CA-021 (RF-021) | Panel incompleto | Stock bajo, hucha y deudores | Integración + E2E | Prevista |
| RNF-010 | Efectos parciales | Fallo a mitad de una compra | Integración | Prevista |
| EV-050 (RNF-007) | Acceso de un miembro al control o a la baja | Cada ruta y acción de administración con rol miembro | Suite `acceso` | Prevista |

## Assumptions

- La pantalla de saldos de F4 muestra el saldo propio y el saldo teórico de la hucha, y permite registrar aportaciones y anular las propias. F6 añade los saldos de todos, los últimos movimientos y el historial (§10.5, `/saldos`) (Clarifications, punto 7).
- La pantalla de compras lista las compras recientes con su autor y permite anularlas según RF-060 a RF-062 (§10.5, `/compras`).
- El arqueo, el recuento y la baja exigen reautenticación (RN-050; §10.5: `/admin/control` y `/admin/usuarios`).
- El plazo de autoanulación y el límite de deuda se leen del almacén de configuración de F1. Sus valores por defecto son 15 minutos y −5 € (RF-150).
- El reparto usa un azar que las pruebas pueden sustituir (constitución VIII).

## Clarifications

### Session 2026-10-22

1. **Avisos antes de F5.** Las situaciones que generan un aviso (hucha negativa, personas por debajo del límite de deuda) quedan registradas y el panel de avisos las muestra. El envío push es de F5.
2. **Anulaciones.** F4 implementa RF-060 a RF-062 para las aportaciones y las compras. F3 los aplica a los consumos y añade «Deshacer» (RF-013, RF-063).
3. **Compras.** No tienen importe máximo. La confirmación de RN-019 sigue frenando los errores que dejan la hucha en negativo.
4. **Devolución por baja con la hucha en negativo.** Se trata como una compra: la aplicación muestra el saldo teórico, pide confirmación y avisa a los administradores (RN-019).
5. **Regularización sin compras vigentes (RN-012).** Al anular una compra, el precio que «debió aplicarse» a los consumos posteriores es el coste de la siguiente compra vigente del tipo. Si no queda ninguna, los cargos se mantienen y el arqueo absorbe la diferencia.
6. **Faltante sin coste medio (RN-016).** Un faltante de un tipo sin coste medio vale 0 €: no se reparte nada y el stock se corrige.
7. **Pantalla de saldos en F4.** Muestra el saldo propio y el saldo teórico de la hucha, y permite registrar aportaciones y anular las propias. F6 la completa.

### Session 2026-10-22 (aprobación del plan, D16)

8. **Redondeo.** El coste medio se redondea a la diezmilésima y el valor de un faltante al céntimo, los dos con mitad hacia arriba (como RN-021).
9. **Reconstrucción del coste medio.** Las compras anuladas se excluyen desde el principio. Un consumo anulado o una línea de recuento anulada cuentan como un cambio de stock en el instante de su anulación.
10. **Personas dadas de baja.** No reciben regularizaciones: la diferencia la absorbe el arqueo. Sus aportaciones no se pueden anular; sus compras sí.
11. **«Último arqueo» (RN-036).** Es el último vigente: tras anular A2, A1 pasa a ser el último. Igual por tipo en los recuentos.
12. **Regularización.** Una por cada consumo afectado; la pantalla agrupa el resumen por persona.
13. **Anulación por un administrador.** No pide reautenticación. La reautenticación queda para arqueo, recuento, sus anulaciones y la baja.
14. **Pago en la baja.** Cubre la deuda completa. No se combina con una deuda incobrable parcial.
