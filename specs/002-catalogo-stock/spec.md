# Feature Specification: Catálogo de tipos de cápsula y stock (F2)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F2 — Catálogo y stock, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§3, §6.5, §6.6, §7.1, §7.3, §9 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestionar el catálogo de tipos de cápsula (Priority: P1)

Un administrador da de alta los tipos de cápsula que se compran en el departamento, con su nombre, su marca, su color y, si la tiene, una foto. Después puede editarlos, retirarlos cuando dejan de comprarse, volver a activarlos y borrar los que se crearon por error.

**Why this priority**: sin tipos de cápsula no se pueden registrar compras (F4) ni consumos (F3). Es la base del resto de funcionalidades (§15).

**Independent Test**: un administrador da de alta «Ristretto» con foto y lo ve en el catálogo como activo y sin coste medio.

**Acceptance Scenarios**:

1. **Dado** un administrador autenticado, **cuando** da de alta «Ristretto» con todos los datos y una foto JPEG de 2 MB, **entonces** el tipo aparece en el catálogo como activo y sin coste medio. No se puede usar para registrar consumos hasta su primera compra (CA-001; RF-001, RN-006).
2. **Dado** un tipo activo «Ristretto», **cuando** un administrador da de alta «ristretto», **entonces** el sistema rechaza el alta con «Ya existe un tipo activo con ese nombre» (CA-002; RF-002).
3. **Dado** un tipo con stock 20, **cuando** un administrador cambia su umbral de 5 a 25, **entonces** el stock sigue en 20 y el tipo pasa a stock bajo (CA-003; RF-003, RN-071).
4. **Dado** un tipo retirado con registros previos, **entonces** no se ofrece para registrar consumos ni compras, y sus registros siguen contando en el historial y en las estadísticas (CA-004; RF-004).
5. **Dado** un fichero `.jpg` cuyo contenido real es un ejecutable, **cuando** se sube como foto, **entonces** el sistema lo rechaza. **Dada** una foto válida con datos GPS, **entonces** la imagen guardada no contiene metadatos (CA-005; RF-005).
6. **Dado** un tipo sin ningún registro, **entonces** un administrador puede borrarlo. **Dado** un tipo con un registro, **entonces** la opción de borrar no aparece y el servidor rechaza la petición directa (CA-006; RF-006).
7. **Dado** un tipo sin foto, **entonces** el catálogo lo muestra con su color y su nombre (Clarifications, punto 1).
8. **Dado** un miembro sin rol de administrador, **cuando** abre por URL la gestión del catálogo o envía una de sus acciones, **entonces** el servidor le niega el acceso (EV-050; RNF-007).

---

### User Story 2 - Saber qué tipos están en stock bajo y cuánto queda (Priority: P1)

Cualquier miembro ve qué tipos de cápsula están en stock bajo y cuántos días quedan aproximadamente de cada uno, para saber cuándo hay que comprar.

**Why this priority**: es la necesidad que originó la aplicación (NEC-001, NEC-002).

**Independent Test**: con un tipo de umbral 10 y stock 10, el panel de avisos lo muestra en stock bajo. Con stock 30 y 60 consumos en los últimos 30 días, el tipo indica «15 días estimados».

**Acceptance Scenarios**:

1. **Dado** un tipo con umbral 10 y stock 11, **cuando** su stock pasa a 10, **entonces** el tipo pasa a stock bajo (CA-020; RF-020, RN-071).
2. **Cuando** cualquier miembro abre la aplicación, **entonces** el panel de avisos muestra los tipos activos en stock bajo (CA-021, parcial: la hucha y las personas por debajo del límite de deuda se añaden en F4; RF-021).
3. **Dado** un tipo con stock 30 y 60 consumos en los últimos 30 días, **entonces** muestra «15 días estimados». **Sin** consumos en los últimos 30 días, muestra «sin datos» (CA-022; RF-022, RN-073).
4. **Dado** un tipo que entra en stock bajo, **cuando** su stock sigue bajando, **entonces** solo queda registrada una entrada en stock bajo. **Cuando** sale de stock bajo y vuelve a entrar, **entonces** queda registrada una entrada nueva (CA-023, parcial: el envío push es de F5; RF-023, RN-072).

---

### Edge Cases

- Un tipo con stock exactamente igual al umbral está en stock bajo; con uno más, no (RN-071).
- Un tipo con umbral 0 solo está en stock bajo con stock 0 o negativo (RN-071, RN-070).
- Un stock negativo cuenta como stock bajo (RN-070, RN-071).
- Reactivar un tipo retirado cuyo nombre coincide, sin distinguir mayúsculas, con otro tipo activo: se rechaza como un alta duplicada (RF-002).
- Editar el umbral de un tipo puede hacerlo entrar o salir de stock bajo sin ningún consumo ni compra (CA-003). Esa entrada cuenta para RN-072.
- Un fichero de más de 5 MB, o de un tipo distinto de JPEG, PNG o WebP aunque su extensión lo sea, se rechaza (RF-005).
- Dos administradores dan de alta a la vez dos tipos con el mismo nombre: solo uno se crea (RF-002).
- Borrar un tipo sin registros borra también su foto. Si entre la consulta y el borrado aparece un registro, el borrado se rechaza (RF-006).
- Sin conexión, la gestión del catálogo no está disponible. La aplicación dice qué ha pasado y qué puede hacer la persona (EXC-007; constitución X).

## Requirements *(mandatory)*

### Functional Requirements

**Catálogo** (§7.1)

- **RF-001**: Un administrador deberá poder dar de alta un tipo de cápsula con nombre, marca, intensidad opcional (1–13), color, foto y umbral mínimo. La foto es opcional y el umbral es obligatorio (Clarifications, puntos 1 y 2).
- **RF-002**: El sistema deberá rechazar un nombre igual al de otro tipo activo, sin distinguir mayúsculas.
- **RF-003**: Un administrador deberá poder editar los datos descriptivos y el umbral de un tipo. Editar no modifica stock ni coste medio.
- **RF-004**: Un administrador deberá poder retirar y volver a activar un tipo. Un tipo retirado no se muestra para registrar consumos ni compras y conserva su historial.
- **RF-005**: Cuando un administrador sube una foto, el sistema deberá validar el tipo real del fichero (JPEG, PNG o WebP), rechazar ficheros de más de 5 MB, redimensionar la imagen y eliminar sus metadatos.
- **RF-006**: Un administrador deberá poder borrar un tipo de cápsula sin ningún registro. Si tiene registros, el sistema solo permite retirarlo.

**Stock bajo y estimación** (§7.3)

- **RF-020**: El sistema deberá marcar como «stock bajo» los tipos que cumplan RN-071.
- **RF-021** (parcial): La aplicación deberá mostrar al abrirla un panel de avisos con los tipos en stock bajo. El saldo teórico de la hucha y las personas con saldo por debajo del límite de deuda se añaden en F4 (Clarifications, punto 3).
- **RF-022**: La aplicación deberá mostrar para cada tipo los días estimados restantes según RN-073, o «sin datos» si no hay consumos en los últimos 30 días.
- **RF-023**: Cuando un tipo entra en stock bajo, el sistema deberá generar el aviso según RN-072. En F2 el aviso queda registrado y visible en el panel; el envío push es de F5 (Clarifications, punto 3).

**Reglas de negocio** (§6.5, §6.6): RN-006, RN-070 a RN-073 y el ciclo de vida del tipo de cápsula (activo ⇄ retirado; borrado solo sin registros).

- RN-070 define el stock a partir de compras, consumos y recuentos. Esos registros llegan con F4 y F3. Hasta entonces, el stock de todos los tipos es 0 y las pruebas de F2 usan datos preparados.

### Non-Functional Requirements

- **RNF-001**: Las pantallas nuevas (catálogo, alta y edición de un tipo, panel de avisos) cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro. El color no es la única señal de stock bajo: se acompaña de texto o icono.
- **RNF-003**: El catálogo funciona con 50 tipos de cápsula sin cambios de diseño.
- **RNF-007**: Todos los permisos se comprueban en el servidor (EV-050).
- **RNF-012**: Toda la interfaz está en español, con los textos centralizados.
- Las fotos se guardan en el volumen de datos y se sirven a través de la aplicación, solo a personas con sesión (constitución V).
- Todas las acciones con formulario funcionan sin JavaScript cuando hay conexión, incluida la subida de la foto (constitución XVII).

### Out of Scope

- Registrar compras, consumos y recuentos, que son los que cambian el stock: F4 y F3.
- El coste medio y su cálculo (RN-002 a RN-005): F4.
- La pantalla principal con los tipos para registrar consumos (RF-010): F3.
- El envío push del aviso de stock bajo y la preferencia de cada persona: F5.
- Varias cafeteras o cápsulas incompatibles (EXC-010).

### Key Entities

- **Tipo de cápsula**: nombre, marca, intensidad opcional (1–13), color de la paleta del sistema de diseño, foto opcional, umbral mínimo, estado (activo o retirado). El stock, el coste medio y el estado de stock bajo se derivan de los registros vigentes (constitución V, INV-02).
- **Foto**: imagen redimensionada y sin metadatos de un tipo de cápsula (RF-005).
- **Entrada en stock bajo**: instante en que un tipo entra en stock bajo. Sirve para no repetir el aviso mientras sigue en stock bajo (RN-072, RF-103).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-001 a CA-006**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **CA-020, CA-022 y CA-023**: tienen sus pruebas con datos preparados y pasan. Las de CA-020 y CA-023 se repiten con consumos reales en F3.
- **CA-021**: el panel de avisos muestra los tipos en stock bajo. El resto de CA-021 se comprueba en F4.
- **EV-050**: ninguna ruta del catálogo responde con su contenido a un miembro.
- **RNF-001**: cada pantalla nueva supera axe sin infracciones en tema claro y oscuro.

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-001 (RF-001, RN-006) | Tipo sin compras usable para consumos | Alta completa, con y sin foto | Integración + E2E | Prevista |
| CA-002 (RF-002) | Dos tipos activos con el mismo nombre | «ristretto» frente a «Ristretto»; alta simultánea; reactivación con nombre ocupado | Integración | Prevista |
| CA-003 (RF-003, RN-071) | Editar cambia stock o coste medio | Umbral de 5 a 25 con stock 20 | Integración | Prevista |
| CA-004 (RF-004) | Tipo retirado comprable o historial perdido | Retirar con registros; volver a activar | Integración | Prevista |
| CA-005 (RF-005) | Fichero malicioso o datos de localización publicados | Ejecutable con extensión `.jpg`; foto con GPS; 5 MB + 1 byte | Integración | Prevista |
| CA-006 (RF-006) | Borrado de un tipo con registros | Petición directa de borrado con un registro | Integración | Prevista |
| CA-020 (RF-020, RN-071) | Aviso tardío | Umbral 10: stock 11, 10 y negativo | Unidad | Prevista |
| CA-022 (RF-022, RN-073) | Estimación errónea | 30 de stock y 60 consumos; sin consumos | Unidad | Prevista |
| CA-023 (RF-023, RN-072) | Avisos repetidos | Entrada, más bajadas, salida y nueva entrada | Integración | Prevista |
| EV-050 (RNF-007) | Acceso de un miembro al catálogo | Cada ruta y acción del catálogo con rol miembro | Suite `acceso` | Prevista |
| RNF-001 | Pantalla no accesible | Catálogo, alta, edición y panel | Suite `a11y`, claro y oscuro | Prevista |

## Assumptions

- El color de un tipo se elige de la paleta cerrada de colores de cápsula del sistema de diseño (`cap-*`), porque la interfaz no usa colores fuera de los tokens (constitución X).
- Un tipo retirado no aparece en el panel de avisos aunque su stock esté bajo, porque ya no se compra (RF-004) (Clarifications, punto 4).
- Con stock 0 o negativo, la estimación de días restantes muestra 0 días (Clarifications, punto 5).
- La gestión del catálogo no exige reautenticación, porque no tiene efectos económicos (§10.5: `/admin/capsulas` exige rol administrador, sin reautenticación).

## Clarifications

### Session 2026-10-22

1. **Foto del tipo de cápsula.** Es opcional. Un tipo sin foto se muestra con su color y su nombre.
2. **Umbral mínimo.** Es obligatorio y no tiene valor por defecto: el administrador lo escribe al dar de alta el tipo. Es un entero de 0 o más.
3. **Avisos antes de F5.** El panel de avisos muestra desde F2 el estado actual (tipos en stock bajo). Las entradas en stock bajo quedan registradas para que F5 envíe los push sin duplicados.
4. **Tipo retirado y stock bajo.** Un tipo retirado no aparece en el panel de avisos aunque su stock esté bajo.
5. **Estimación con stock 0 o negativo.** La estimación de días restantes muestra 0 días.
