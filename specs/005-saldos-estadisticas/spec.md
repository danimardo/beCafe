# Feature Specification: Saldos, historial y estadísticas (F6)

**Feature Branch**: `main` (sin rama de funcionalidad, AGENTS.md §9)

**Created**: 2026-10-22

**Status**: Aprobada por la persona usuaria el 2026-10-22.

**Input**: User description: "F6 — Saldos y estadísticas, según historias.md §15"

**Fuente**: `historias.md` v0.14.0 (§6.4, §7.9, §9 y §15). Los IDs se conservan. Las decisiones del 2026-10-22 están en Clarifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver los saldos de todos y el historial económico (Priority: P1)

Cualquier miembro ve cuánto debe o tiene a favor cada persona, el saldo teórico de la hucha y todo lo que ha pasado con el dinero común: aportaciones, compras, arqueos, recuentos y repartos.

**Why this priority**: la transparencia del dinero es la base de la confianza entre compañeros (NEC-004, NEC-007; HU-07).

**Independent Test**: Luis ve los saldos de todos los miembros activos, la hucha y los últimos 5 movimientos; solo su propia fila abre el detalle.

**Acceptance Scenarios**:

1. **Cualquier** miembro ve los saldos de todos los miembros activos y el historial económico (CA-110; RF-110, RF-111, RN-060).
2. **La** pantalla de saldos muestra la hucha, los saldos de todos y los últimos 5 movimientos, con un enlace al historial. Solo la fila del propio usuario se puede pulsar, y abre el historial filtrado por sus movimientos (CA-111).
3. **Ana** ve el detalle de los movimientos de su saldo, con el origen de cada uno (CA-112; RF-112).
4. **Por** defecto, el historial no muestra registros anulados. Con «Mostrar anulados», aparecen marcados con autor, fecha y motivo (CA-113; RF-113, RN-062).
5. **El** historial se puede filtrar por «Todo» o «Míos» y por tipo de registro, y se pagina (§10.5).

---

### User Story 2 - Ver las estadísticas de consumo (Priority: P2)

Cualquier miembro ve las estadísticas globales de consumo. Cada persona ve las suyas; los administradores ven las de cualquiera.

**Why this priority**: es una petición original (ORIG-002, NEC-005), pero no afecta al dinero.

**Independent Test**: Ana ve sus estadísticas del mes; Luis, miembro, no puede ver las de Ana ni por URL directa.

**Acceptance Scenarios**:

1. **Las** estadísticas globales muestran consumos por tipo y por mes, con los de invitados separados (CA-120; RF-120).
2. **Ana** ve sus estadísticas por tipo y por periodo. Un administrador ve las de Ana (CA-121; RF-121, RF-123).
3. **Cuando** Luis (miembro) abre la URL de estadísticas de Ana, **entonces** el sistema responde «sin permiso» y no muestra datos (CA-122; RF-122, RN-061, EV-050).
4. **Los** periodos que se pueden elegir son mes natural, año natural y «desde el principio», en hora de Madrid (Clarifications, punto 1).

---

### Edge Cases

- Una persona dada de baja no aparece en la pantalla de saldos (RF-110), pero sus registros siguen en el historial y en las estadísticas globales (RN-046).
- Una persona sin ningún movimiento aparece con saldo 0,00 €.
- Un mes sin consumos aparece con 0 en las estadísticas, no desaparece (Clarifications, punto 2).
- Un consumo registrado a las 23:59 del último día del mes, hora de Madrid, cuenta en ese mes aunque en UTC sea del mes siguiente (constitución V).
- Un consumo anulado no cuenta en las estadísticas (RN-035).
- Un administrador que pierde el rol deja de ver las estadísticas ajenas en la siguiente petición (RN-061).
- Historial vacío, cargando, con error y sin conexión: cada estado tiene su mensaje (constitución X).

## Requirements *(mandatory)*

### Functional Requirements

**Saldos e historial** (§7.9)

- **RF-110**: Todos los miembros deberán poder ver el saldo de cada miembro activo.
- **RF-111**: Todos los miembros deberán poder ver el historial de aportaciones, compras, arqueos, recuentos y repartos.
- **RF-112**: Cada miembro deberá poder ver el detalle de los movimientos de su saldo.
- **RF-113**: Los historiales deberán aplicar RN-062.

**Estadísticas** (§7.9)

- **RF-120**: Todos los miembros deberán poder ver estadísticas globales de consumo por tipo y por mes, separando invitados.
- **RF-121**: Cada miembro deberá poder ver sus estadísticas de consumo por tipo y por periodo. Los periodos son mes natural, año natural y «desde el principio» (Clarifications, punto 1).
- **RF-122**: Si un miembro no administrador pide las estadísticas de otra persona, incluso por URL directa, el sistema deberá denegarlo.
- **RF-123**: Un administrador deberá poder ver las estadísticas de cualquier persona.

**Reglas de negocio** (§6.4): RN-060, RN-061 y RN-062. RN-063 (rellenos) es de F8.

### Non-Functional Requirements

- **RNF-001**: Las pantallas nuevas (saldos, historial y estadísticas) cumplen WCAG 2.2 AA y superan axe en tema claro y oscuro. Las gráficas tienen una alternativa en texto o en tabla.
- **RNF-003**: Las pantallas funcionan con 30 usuarios y varios años de registros sin cambios de diseño.
- **RNF-007**: Todos los permisos se comprueban en el servidor (EV-050).
- Los saldos se derivan siempre del libro de movimientos; ninguna caché puede mostrar un saldo desfasado (constitución, orden de prioridad).
- Los filtros del historial y de las estadísticas son formularios con método GET y funcionan sin JavaScript (constitución XVII).

### Out of Scope

- Registrar aportaciones y anular registros: F4 y F3.
- El ranking de rellenos y los rellenos en las estadísticas personales (RF-175): F8.
- Exportar datos.

### Key Entities

- **Saldo**: suma de los movimientos vigentes de una persona (RN-010). Se calcula; no se guarda aparte.
- **Entrada del historial**: registro económico con su tipo, autor, fecha, importe, estado y anulación.
- **Estadística de consumo**: recuento de consumos vigentes por persona, tipo, periodo y marca de invitado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **CA-110 a CA-113 y CA-120 a CA-122**: cada criterio tiene al menos una prueba que lo nombra y pasa.
- **EV-050**: ninguna estadística ajena responde con datos a un miembro sin rol de administrador.
- **RNF-001**: cada pantalla nueva supera axe sin infracciones en tema claro y oscuro.
- **Carga**: la primera pantalla de lectura se mide con `perf:seed` y `perf:load` (`ARCHITECTURE.md` §14) y responde dentro del objetivo de RNF-002.

## Traceability Matrix

Niveles previstos según `docs/pruebas.md` §14.1. El plan los concreta.

| Regla y fuente | Riesgo o invariante | Escenario o contraejemplo | Nivel | Evidencia |
| --- | --- | --- | --- | --- |
| CA-110, CA-111 (RF-110, RF-111, RN-060) | Saldo oculto o de una persona dada de baja | Saldos con una baja; últimos 5 movimientos | Integración + E2E | Prevista |
| CA-112 (RF-112) | Movimiento sin origen | Detalle con todos los orígenes | Integración | Prevista |
| CA-113 (RF-113, RN-062) | Anulado contado o visible por defecto | Historial con y sin «Mostrar anulados» | Integración + E2E | Prevista |
| CA-120, CA-121 (RF-120, RF-121, RF-123) | Estadística errónea o en otro huso | Fin de mes en hora de Madrid; invitados; anulados | Unidad + integración | Prevista |
| CA-122, EV-050 (RF-122, RN-061) | Estadísticas ajenas visibles | URL directa con rol miembro | Integración + suite `acceso` | Prevista |
| RNF-001 | Gráfica sin alternativa | Saldos, historial y estadísticas | Suite `a11y`, claro y oscuro | Prevista |

## Assumptions

- F6 completa la pantalla de saldos de F4 y el historial de F3 (`/saldos` y `/historial`, §10.5).
- Las estadísticas globales cuentan también los consumos de las personas dadas de baja (RN-046).

## Clarifications

### Session 2026-10-22

1. **Periodos.** Las estadísticas personales y el ranking de rellenos (F8) usan los mismos periodos: mes natural, año natural y «desde el principio», en hora de Madrid.
2. **Meses sin consumos.** Aparecen con 0 en las estadísticas.

### Session 2026-10-22 (aprobación del plan, D10)

3. **Consumos ajenos en el historial.** Un miembro no ve los consumos de los demás; un administrador sí.
4. **Últimos movimientos de `/saldos`.** Son los 5 registros más recientes del historial «Todo».
5. **Hora de las estadísticas.** Cuenta la hora del toque, no la de recepción.
6. **Periodos.** Mes, año y «desde el principio» (no «Semana» del diseño).
7. **Tamaño de página del historial.** 20 registros.
