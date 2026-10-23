# Implementation Plan: Economía: aportaciones, compras, arqueos, recuentos y bajas (F4)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: plan aprobado por la persona usuaria el 2026-10-22, con las decisiones propuestas. Las decisiones están en la sección Clarifications de la spec.

**Artefactos**: este archivo reúne la investigación (decisiones D1 a D16) y la revisión de arquitectura. El modelo de datos está en [data-model.md](data-model.md), los contratos de rutas en [contracts/rutas.md](contracts/rutas.md) y la guía de validación en [quickstart.md](quickstart.md).

**Orden**: F4 se implementa antes que F3 (spec, «Orden»). F4 crea la tabla `consumo` para poder probar las regularizaciones con consumos preparados (D3). F3 añade el registro, la anulación y la cola.

## Summary

F4 entrega el núcleo económico: el libro de movimientos, las aportaciones, las compras con varias líneas y su coste medio, las anulaciones con regularización, los arqueos y recuentos con reparto exacto, la baja con liquidación y el panel de avisos completo (hucha y deudores).

El diseño se apoya en dos funciones puras de `economia/dominio/`: `coste-medio.ts` (cálculo incremental y reconstrucción por reproducción de la historia del tipo) y `repartos.ts` (división exacta en céntimos con azar inyectable). Todas las escrituras van en una transacción `BEGIN IMMEDIATE` dentro de `economia`, que llama a `usuarios` y a `auth` con `tx` para la baja.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: SvelteKit 3, Svelte 5 (runes), Drizzle ORM 0.45 con `better-sqlite3`, Zod 4, `ulid`, `sharp` (foto del ticket, ya instalada en F2), `fast-check` (ya instalada). Nueva de desarrollo: **StrykerJS 10** (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`), piloto de mutación sobre `economia/dominio/` previsto para F4 (`historias.md` §10.3, `ARCHITECTURE.md` §14).

**Storage**: SQLite (WAL). Migración nueva `drizzle/0002_f4-economia.sql` que solo añade tablas. Fotos de tickets en `<DIRECTORIO_DATOS>/fotos/`.

**Testing**: Vitest (`servidor`): unidad y propiedades con `fast-check` en `dominio/`; integración con SQLite real; concurrencia con `worker_threads`. Vitest Browser Mode para el formulario de compra con líneas. Playwright: `chromium-movil`, `chromium-escritorio`, `sin-js`, `acceso`, `a11y`.

**Target Platform**: servidor Linux en Docker, una instancia (RT-010). Clientes móviles (RNF-013).

**Project Type**: aplicación SvelteKit única (ADR-0002).

**Performance Goals**: sin objetivo nuevo. Los saldos se calculan con `SUM` sobre `movimiento` con índice; con unos 10 usuarios no hace falta caché (constitución II y orden de prioridad 1 sobre 4).

**Constraints**: importes en céntimos y coste medio en diezmilésimas (RN-020); ninguna fila económica se borra; los movimientos no cambian de importe; formularios sin JavaScript (constitución XVII); WCAG 2.2 AA en claro y oscuro.

**Scale/Scope**: unos 10 usuarios, hasta 50 tipos, unos miles de movimientos al año.

## Constitution Check

| Principio | Cumplimiento en F4 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Cada comportamiento cita su RF, RN, CA o EV. Los huecos de reglas se resolvieron como decisiones de la persona usuaria (D16), no se inventaron | Cumple (D16 aprobada el 2026-10-22) |
| II. Complejidad justificada | Dos funciones puras (`coste-medio`, `repartos`) exigidas por `ARCHITECTURE.md` §3. Tablas nuevas, cada una con su problema (Complexity Tracking). Sin caché ni capa nueva. StrykerJS ya está en la lista obligatoria | Cumple |
| III. Separación y módulos | Toda la lógica económica en `economia`. `usuarios.marcarBaja` y `auth.cerrarSesionesPorBaja` reciben `tx`. Rutas finas | Cumple |
| IV. Integridad económica | Enteros; registros anulados, no borrados; saldos derivados de `movimiento`; una transacción por registro; `cliente_id` único en aportaciones y compras; cada invariante con una prueba que intenta violarla | Cumple |
| V. Almacenamiento | Fechas UTC; ULID; datos derivados (`existencia`) recalculados en la misma transacción y comprobados con propiedades (EV-030) | Cumple |
| VI. Seguridad y validación | Zod en cada formulario, con importes convertidos a céntimos en el esquema; permisos y plazos en el caso de uso; reautenticación en arqueo, recuento y baja | Cumple |
| VII. Tipado estricto | Sin `as`, `any` ni `!`; tipos inferidos de los esquemas | Cumple |
| VIII. Pruebas y cobertura | Matriz de la spec concretada en «Pruebas»; 90 % en `economia` y `dominio/`; propiedades en repartos y coste medio; mutación piloto | Cumple |
| IX. Verificación | `verify` en cada lote que cambia esquema, migración, contrato o `plataforma/`; benchmark al cerrar | Cumple |
| X. Usabilidad | Confirmación con efecto visible antes de arqueo, recuento, baja, anulación y compra con hucha negativa. Una acción primaria por pantalla. Estados definidos en `contracts/rutas.md` | Cumple |
| XI. Accesibilidad | Importes con signo y texto, no solo color. axe en claro y oscuro en todas las pantallas nuevas | Cumple |
| XII. Redacción | Plan y contratos en ETS | Cumple |
| XIII. Errores | Códigos nuevos del conjunto cerrado (D13) con mensaje en español | Cumple |
| XIV. Migraciones | `0002` solo añade tablas. No toca `0000` ni `0001` | Cumple |
| XV. Agentes | Los cambios de `ARCHITECTURE.md` van en el mismo lote (ver «Cambios en otros documentos») | Cumple |
| XVI. Registro técnico | Eventos de D14 sin importes, nombres ni motivos | Cumple |
| XVII. SvelteKit idiomático | Todo con *actions*; las líneas de compra y los pasos de confirmación funcionan sin JavaScript (D10) | Cumple |
| XVIII. Identidad visual | Formularios y listas sobre superficie estable; cristal solo en la navegación existente | Cumple |

**Resultado:** la puerta se supera. Las decisiones de D16, que cambian el reparto de dinero entre personas, se aprobaron el 2026-10-22 (spec, Clarifications 8 a 14).

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí (tabla anterior).
2. **Ubicaciones:** tablas nuevas en `economia/esquema.ts`; `economia/dominio/coste-medio.ts` y `economia/dominio/repartos.ts`; casos de uso en `economia/<caso>.ts`; `usuarios/baja.ts`; `plataforma/azar.ts`; contratos en `lib/shared/contratos/economia.ts`; rutas en `src/routes/(app)/saldos`, `compras`, `admin/control` y `admin/usuarios/[usuarioId=ulid]/baja`.
3. **Grafo:** sin aristas nuevas. Usa `economia → usuarios`, `economia → auth`, `economia → configuracion` y `economia → catalogo`, ya presentes en §4. `economia → notificaciones` sigue sin usarse hasta F5 (D9).
4. **Reutilización:** `MoneyField`, `Money`, `MovementRow`, `MovementList`, `RegularizationSummary`, `VoidDialog`, `ReauthDialog`, `ConfirmDialog`, `Stepper`, `SegmentedControl`, `KpiTile`, `AlertsPanel`, `PhotoField`, `SelectField`, `ListRow`, `EmptyState`, `Banner` de `lib/ui`; `parseMoney`, `formatMoney`, `formatUnitCost` de `lib/shared/dinero.ts`.
5. **Piezas nuevas con su problema:** ver «Complexity Tracking».
6. **Reglas, invariantes y escenarios:** cada RN del alcance tiene dueño (`economia`), mecanismo y prueba (sección «Pruebas»). INV-01 (repartos), INV-02 (existencias), INV-03 (último administrador), INV-05 (anulaciones) e INV-06 (baja) tienen prueba que intenta violarlas.
7. **Repetición, retraso y fallo a mitad:**
   - Reenvío de una aportación o una compra: `cliente_id` único; el reenvío devuelve el registro original (RF-046, D5).
   - Dos anulaciones simultáneas del mismo registro: actualización condicionada a `estado = 'vigente'`; la segunda recibe `YA_ANULADO` (EV-011, D6).
   - Vista previa de un reparto desactualizada al confirmar: el formulario envía el saldo teórico previsto y el servidor rechaza si cambió (D10).
   - Fallo a mitad de una compra: la foto se escribe antes de la transacción y se borra si la transacción falla (patrón de F2); los movimientos, el stock y el coste medio están en la misma transacción (RNF-010).
   - Avisos pendientes: hucha negativa queda registrada en la transacción (D9); F5 la entrega.
8. **Fuentes vigentes:** comportamiento en la spec; diseño en este plan y `data-model.md`. `historias.md` §10.4 es la base aceptada: las diferencias se listan en «Cambios en otros documentos» y solo se trasladan con autorización y CAMBIO-NNN. No cambia ningún contrato de `/api/` (F4 no tiene cola sin conexión).
9. **Autorización:** en los casos de uso. Entran en EV-050: `/saldos`, `/saldos/aportaciones/[aportacionId]`, `/compras`, `/compras/[compraId]`, `/admin/control`, `/admin/usuarios/[usuarioId]/baja` y `/fotos/compras/[compraId]`.
10. **Afectados:** F3 (consumos: usa `consumo`, el precio, `hayRegistrosDeTipo`, anulaciones), F5 (avisos de hucha negativa y deuda), F6 (historial y saldos de todos sobre `movimiento`), F7 (plazo y límite configurables).
11. **Migraciones:** `0002` solo añade tablas e índices. No hay datos económicos previos.
12. **Datos y formularios:** todas las pantallas cargan en `+page.server.ts` y cambian datos con *actions* con nombre. Sin excepciones del principio XVII.
13. **Eventos:** D14. Las pruebas los comprueban con `crearRegistroFalso()`.
14. **Pantallas:** estados en `contracts/rutas.md`; todas entran en la suite `a11y` en claro y oscuro.

## Decisiones

### D1. Libro de movimientos

- Tabla `movimiento` (`historias.md` §10.4, DT-001): `cuenta` (`persona` o `hucha`), `usuario_id` (nulo si `hucha`), `tipo`, `importe` con signo en céntimos, `origen_tipo`, `origen_id`, `creado_en`, `vigente`.
- **Saldo de una persona** (RN-010) = `SUM(importe)` de sus movimientos vigentes de `cuenta = 'persona'`. **Saldo teórico de la hucha** (RN-011) = `SUM(importe)` de los movimientos vigentes de `cuenta = 'hucha'`.
- Un movimiento nunca cambia de importe ni se borra (RN-007, constitución IV). La anulación de su origen lo marca `vigente = 0` en la misma transacción, y nunca vuelve a `1` (INV-05). Las correcciones de precio son movimientos nuevos (regularizaciones).
- Tipos de `historias.md` §10.4: `cargo_consumo`, `abono_aportacion`, `hucha_aportacion`, `hucha_compra`, `hucha_ajuste_arqueo`, `reparto_arqueo`, `reparto_recuento`, `regularizacion`, `devolucion_baja`, `hucha_devolucion_baja`, `abono_incobrable`, `reparto_incobrable`. Un `CHECK` limita `tipo` y la coherencia `cuenta`/`usuario_id`.

**Alternativa descartada:** contraasientos (insertar un movimiento opuesto al anular) en lugar del indicador `vigente`. Duplica filas, complica el detalle de F6 y diverge del modelo aceptado de §10.4. El indicador solo cambia una vez y siempre con la anulación de su origen.

### D2. Coste medio y stock (`dominio/coste-medio.ts`)

- `costeTrasCompra(stock, costeMedio, cantidad, importeCentimos)`: con `stock > 0` y coste conocido, `(stock × coste + importe × 100) ÷ (stock + cantidad)` (RN-003); con `stock ≤ 0` o sin coste, `importe × 100 ÷ cantidad` (RN-004). Resultado en diezmilésimas, redondeado según D16-1.
- `precioDeConsumo(costeMedio)`: coste medio redondeado al céntimo, mitad hacia arriba (RN-021). Lo usa F3; F4 lo prueba.
- `reconstruir(historia)`: reproduce en orden los hechos de un tipo y devuelve stock, coste medio y el coste vigente en el instante de cada consumo. La semántica de la reproducción está en D16-2.
- Las funciones no usan reloj ni azar. Reciben números enteros y devuelven enteros.

**Ejemplos que fijan las pruebas:** CA-041 (stock 10 a 0,4000 € + 50 por 17,00 € → 60 a 0,3500 €; stock −2 → 48 a 0,3400 €).

### D3. Tabla `consumo` en F4

F4 crea la tabla `consumo` de §10.4 (con `precio_aplicado`, `hora_gesto`, `hora_registro`, estado y anulación) y un constructor de pruebas en `economia/pruebas/`. Así RN-012, CA-045, EV-031, EV-090 y CA-006 «con registro» se prueban contra la base real.

F3 añade el caso de uso de registro, la anulación, «Deshacer» y la cola. `hayRegistrosDeTipo` (plan F2, D8) pasa a consultar `consumo` y `linea_compra` (y `linea_recuento`).

### D4. Repartos (`dominio/repartos.ts`)

- `repartir(importeCentimos, miembros, azar)`: `base = trunc(|importe| ÷ n)`, `resto = |importe| mod n`. Se eligen al azar `resto` miembros distintos, que reciben un céntimo más. El signo del importe se aplica a todos (RN-014, RN-015).
- Propiedades probadas: la suma es exactamente el importe (INV-01); cada parte difiere de otra en un céntimo como máximo; con un solo miembro, recibe todo; con importe 0 no hay reparto.
- **Azar inyectable:** `plataforma/azar.ts` (nuevo) define `Azar { entero(maximoExclusivo): number }` con `crypto.randomInt`, y un azar fijo para las pruebas. `Ambiente` recibe `azar`.
- **Registro de la asignación:** una fila en `reparto` (origen, importe, número de miembros, instante) y un movimiento por persona con `origen_tipo = 'reparto'`. Los importes de los movimientos muestran quién recibió el céntimo extra; no hace falta otra tabla.
- **Miembros activos:** usuarios con estado `activo` en el momento del reparto, de cualquier rol (glosario). En la deuda incobrable se excluye a la persona que se da de baja (RN-017).

### D5. Idempotencia

- `aportacion.cliente_id` y `compra.cliente_id` son `UNIQUE` (RF-046). El formulario lleva un `clienteId` (ULID) en un campo oculto que genera el `load`. Reenviar el mismo formulario (doble toque, recarga del POST) reutiliza el identificador.
- Un reenvío devuelve el registro original sin crear otro, como RF-016. El caso de uso busca primero por `cliente_id` dentro de la transacción y, si existe, lo devuelve.

### D6. Anulación de aportaciones y compras

- Estados y campos de anulación en cada tabla de registro: `estado` (`vigente` o `anulado`), `anulado_por`, `anulado_en`, `motivo_anulacion`. Un `CHECK` exige que los tres campos estén presentes si y solo si el estado es `anulado`.
- **Permiso** (RN-032, RN-033, RF-062): el autor, si `registrada_en + plazo ≥ ahora` (plazo de `configuracion`); un administrador, siempre. En otro caso, `FUERA_DE_PLAZO` o `SIN_PERMISO`, con el mensaje «Pídelo a un administrador».
- **Concurrencia (EV-011, INV-05):** `UPDATE … SET estado = 'anulado' … WHERE id = ? AND estado = 'vigente'`. Si no cambia ninguna fila, `YA_ANULADO`. Después se marcan `vigente = 0` los movimientos del origen.
- **Compra:** además, por cada línea, `stock -= cantidad`, reconstrucción del coste medio del tipo (D2), regularizaciones (D7) y transición de stock bajo con `fijarStock` de F2. El resumen de regularizaciones se devuelve a la *action* (RF-045).
- **Motivo:** texto obligatorio de 1 a 200 caracteres.

### D7. Regularización (RN-012)

- Al anular una compra, para cada tipo de sus líneas (RN-037), `reconstruir` da el coste que debió aplicarse a cada consumo vigente posterior a la compra anulada.
- Para cada consumo afectado con diferencia ≠ 0: una fila en `regularizacion` (compra anulada, consumo, persona, importe = precio aplicado − precio debido) y un movimiento `regularizacion` a la persona. Los cargos originales no cambian (RN-007).
- Sin compra vigente anterior al consumo: el precio debido es el coste de la siguiente compra vigente del tipo; si no hay ninguna, no hay regularización y el arqueo absorbe la diferencia (spec, Clarifications 5).
- Si la anulación deja el tipo sin compras vigentes, `existencia.coste_medio` pasa a nulo y el tipo deja de ofrecerse para consumos (RN-006).
- Una regularización por consumo afectado (entidad «Regularización» de la spec). La pantalla agrupa el resumen por persona (D16-5).

### D8. Arqueos y recuentos

- **Arqueo:** en la transacción se calcula el saldo teórico; `diferencia = contado − teórico`. Si es ≠ 0: un movimiento `hucha_ajuste_arqueo` por la diferencia y un reparto (`reparto_arqueo`). Tras el arqueo, el saldo teórico es el contado (CA-080, CA-081).
- **Recuento:** una fila `recuento` y una `linea_recuento` por tipo, con `registrado`, `contado`, `diferencia`, `coste_medio_aplicado`. Faltante F: `stock -= F` y reparto en cargos de F × coste medio, redondeado según D16-1 (RN-016). Sobrante: `stock += S` sin movimientos ni cambio de coste (RF-092). Faltante de un tipo sin coste: vale 0 € y no hay reparto (Clarifications 6).
- **Un reparto por línea de recuento**, para que cada línea se pueda anular por separado (RN-036, CA-064 «R1 no se puede anular para Ristretto»). La línea tiene su propio estado y sus campos de anulación.
- **Anulación (RN-036, RF-064):** solo el último arqueo y, por tipo, la última línea de recuento (D16-4). Revierte el ajuste y el reparto (movimientos a `vigente = 0`) y, en un recuento, devuelve el stock (`stock -= diferencia`) sin cambiar el coste medio.
- **Reautenticación** (RN-050, RF-138, CA-138): arqueo, recuento, sus anulaciones y la baja llaman a `auth.exigirReautenticacion` antes de la transacción.

### D9. Avisos sin F5

- ADR-0003 pide registrar los avisos con `notificaciones.registrarAviso(tx)`. El módulo llega en F5. Igual que F2 hizo con `entrada_stock_bajo`, F4 registra en `economia` la tabla `aviso_economia` (tipo, origen, instante) cuando una compra o una devolución por baja dejan la hucha en negativo (`tipo = 'hucha_negativa'`, RF-044, Clarifications 1 y 4). F3 añade `tipo = 'stock_negativo'` (RF-017) en la misma tabla.
- El panel de avisos muestra el saldo teórico actual (negativo o no) y las personas con saldo por debajo del límite de deuda (`saldo < limite_deuda_centimos`, RN-074), calculadas al leer. F5 convierte esos registros en avisos push.

### D10. Formularios sin JavaScript y pasos de confirmación

- **Líneas de compra:** los campos repetidos (`tipo[]`, `cantidad[]`, `importe[]`) se normalizan a lista con un esquema reutilizable (`ARCHITECTURE.md` §6.1). Sin JavaScript, «Añadir línea» es un botón de envío a la *action* `anadirLinea`, que devuelve los valores con una línea más. Con JavaScript, la línea se añade en el cliente. Con una línea, el formulario muestra un solo importe; con varias, el total calculado (CA-040).
- **Hucha negativa (RF-043):** con JavaScript, el formulario compara el total con el saldo teórico que envía el `load` y pide confirmación antes de enviar. El servidor siempre comprueba: sin `confirmoHuchaNegativa`, una compra que deja la hucha en negativo responde `fail(409, CONFIRMACION_REQUERIDA)` con el saldo teórico, y la página muestra la confirmación. Sin JavaScript hay que volver a adjuntar la foto del ticket (un archivo no se devuelve en `valores`); el formulario lo indica.
- **Vista previa de repartos (RF-082):** arqueo, recuento y baja tienen dos *actions*: `previsualizar` (calcula y devuelve el efecto: diferencia, número de personas, importes mínimo y máximo por persona) y `confirmar`. `confirmar` envía el saldo teórico (o el stock registrado) de la vista previa; si cambió entretanto, el servidor responde `CAMBIO_CONCURRENTE` y muestra la vista previa nueva.

### D11. Baja con liquidación (RF-135)

- `economia.darDeBaja(ambiente, actor, entrada)` en una transacción: lee el saldo; comprueba que el modo coincide con su signo; aplica la liquidación; llama a `usuarios.marcarBaja(tx, …)` (nueva, comprueba INV-03 dentro de la transacción), a `auth.cerrarSesionesPorBaja(tx, …)` y a `usuarios.anotarAuditoria(tx, …)` (RF-139c).
- **`auth.cerrarSesionesPorBaja`** (nueva) borra las sesiones (RN-051) y guarda sus `id_hash` en `sesion_cerrada_por_baja`. Así la cola sin conexión de F3 puede responder `USUARIO_DE_BAJA` a quien envía con una sesión cerrada por la baja (RN-054), sin revelar nada en el inicio de sesión (RN-055). `reactivarPersona` borra esas filas. INV-06 se comprueba al final: el saldo es 0.
- **Modos:** saldo 0, sin movimientos; saldo negativo con `pago` (aportación a nombre de la persona registrada por el administrador por el importe de la deuda, RN-017 y excepción de RN-034) o `incobrable` (abono a la persona y reparto en cargos entre los demás activos); saldo positivo con `devolucion` (cargo a la persona y movimiento de hucha, RN-018; con hucha negativa, D10 y D9).
- **Reactivación (RN-045):** `reactivarPersona` de F1 no cambia. Como la baja deja el saldo en 0, la persona vuelve con saldo 0. D16-3 cubre los registros que podrían cambiar ese saldo después de la baja.

### D12. Pantallas y rutas

Resumen; el detalle está en [contracts/rutas.md](contracts/rutas.md).

| Ruta | Contenido | Acciones |
| --- | --- | --- |
| `/` | Panel de avisos: stock bajo (F2), saldo teórico de la hucha y personas por debajo del límite | — |
| `/saldos` | Saldo propio, saldo teórico de la hucha, aportaciones propias recientes; formulario de aportación (Clarifications 7) | `aportar` |
| `/saldos/aportaciones/[aportacionId]` | Detalle de una aportación | `anular` |
| `/compras` | Compras recientes con autor; formulario de compra con líneas y foto | `registrar`, `anadirLinea`, `quitarLinea` |
| `/compras/[compraId]` | Detalle con líneas y foto; resumen de regularizaciones tras anular | `anular` |
| `/admin/control` | Arqueo y recuento en pestañas (`SegmentedControl`), últimos registros | `previsualizarArqueo`, `confirmarArqueo`, `previsualizarRecuento`, `confirmarRecuento`, `anularArqueo`, `anularRecuento` |
| `/admin/usuarios/[usuarioId]/baja` | Asistente de baja (`Stepper`): saldo, modo de liquidación, efecto y confirmación | `previsualizar`, `confirmar` |
| `/fotos/compras/[compraId]` | Foto del ticket (GET, con sesión) | — |

### D13. Errores nuevos (`ARCHITECTURE.md` §6)

Se reutilizan `SIN_PERMISO`, `FUERA_DE_PLAZO`, `YA_ANULADO`, `VALIDACION`, `REAUTENTICACION_REQUERIDA`, `ULTIMO_ADMIN`, `ESTADO_INCORRECTO`, `FOTO_NO_VALIDA` y `RecursoNoEncontrado`. Se añaden:

| Código | Situación | HTTP | Mensaje (resumen) |
| --- | --- | --- | --- |
| `CONFIRMACION_REQUERIDA` | Compra o devolución que deja la hucha en negativo sin confirmar | 409 | «La hucha debería tener X. Confirma para continuar.» |
| `NO_ES_EL_ULTIMO` | Anular un arqueo o una línea de recuento que no es el último (RN-036) | 409 | «Solo se puede anular el último arqueo (o recuento de este tipo).» |
| `CAMBIO_CONCURRENTE` | La vista previa ya no coincide con los datos | 409 | «Los datos han cambiado. Revisa el nuevo reparto.» |
| `TIPO_NO_DISPONIBLE` | Línea de compra o recuento con un tipo retirado o inexistente | 400 | «Ese tipo de cápsula no está disponible.» |

### D14. Eventos (`ARCHITECTURE.md` §9)

Ya en el catálogo: `compra.registrada`, `aportacion.registrada`, `anulacion.registrada`, `arqueo.registrado`, `recuento.registrado`, `reparto.aplicado`, `liquidacion.aplicada`, `operacion.rechazada` (info) e `invariante.violada` (error).

Se añaden: `registro.duplicado` (info: `tipo`, `id`), `regularizacion.aplicada` (info: `compraId`, `consumos`), `hucha.negativa_registrada` (info: `origenTipo`, `origenId`) y `usuario.baja` con `modo` (ya existe `usuario.baja`; se añade el campo). Ningún evento lleva importes, nombres ni motivos: solo identificadores, recuentos y códigos.

`invariante.violada` se emite si, al anular una compra, la reconstrucción del stock no coincide con el stock guardado. La transacción se deshace.

### D15. Permisos

| Operación | Quién | Reautenticación |
| --- | --- | --- |
| Ver saldo propio, hucha, compras y detalle | Cualquier miembro con sesión (RN-060) | No |
| Aportar, comprar | Cualquier miembro, a su nombre (RN-034) | No |
| Anular aportación o compra propia en plazo | Autor | No |
| Anular aportación o compra ajena o fuera de plazo | Administrador | No (D16-6) |
| Arqueo, recuento, sus anulaciones, baja | Administrador | Sí (RN-050) |

### D16. Decisiones de la persona usuaria (reglas no definidas en la spec)

Estas decisiones cambian el reparto de dinero. La persona usuaria aprobó la propuesta de cada una el 2026-10-22; están en la spec, Clarifications 8 a 14. Las alternativas se conservan como registro.

1. **Redondeo del coste medio y de los faltantes.** El coste medio se redondea a la diezmilésima y el valor de un faltante (F × coste medio) al céntimo, los dos con mitad hacia arriba, como RN-021. *Alternativa:* truncar.
2. **Semántica de la reconstrucción (INV-02, RN-012).** Al reproducir la historia de un tipo:
   - las compras anuladas se excluyen desde el principio (RN-012 recalcula como si no hubieran existido);
   - un consumo anulado o una línea de recuento anulada cuentan como un cambio de stock en el instante de la anulación, porque su anulación no recalcula el coste medio (RN-013, RN-036).
   Sin esta regla, el coste guardado y el recalculado divergen cuando hubo una compra entre un consumo y su anulación.
3. **Personas dadas de baja (INV-06).** Una regularización a una persona dada de baja no se genera: la diferencia la absorbe el arqueo (como Clarifications 5). Una aportación de una persona dada de baja no se puede anular (`ESTADO_INCORRECTO`). Sus compras sí, porque no cambian su saldo (RN-009).
4. **«Último arqueo» (RN-036).** Es el último **vigente**: tras anular A2, A1 pasa a ser el último y se puede anular. Lo mismo por tipo en los recuentos. *Alternativa:* el último registrado, aunque esté anulado (entonces A1 ya no se podría anular nunca).
5. **Regularización por consumo.** Una fila y un movimiento por cada consumo afectado; la pantalla agrupa el resumen por persona. *Alternativa:* un movimiento por persona y compra anulada.
6. **Anulación por un administrador sin reautenticación.** La spec solo pide reautenticación para arqueo, recuento y baja (Assumptions, CA-138). RN-050 habla de «acciones de administrador» en general. *Alternativa:* pedirla también para anular registros ajenos.
7. **Pago en la baja.** El pago cubre la deuda completa. No se combinan un pago parcial y una deuda incobrable en la misma baja. *Alternativa:* permitir la combinación.

## Pruebas

| Regla o escenario | Nivel | Archivo previsto |
| --- | --- | --- |
| RN-003, RN-004, CA-041, RN-021, D16-1 | Unidad con ejemplos y propiedades | `economia/dominio/coste-medio.test.ts` |
| RN-014, RN-015, EV-020, INV-01 | Propiedades (suma exacta, diferencia ≤ 1 céntimo, azar fijo) | `economia/dominio/repartos.test.ts` |
| EV-030, INV-02, D16-2 | Propiedades: secuencias aleatorias de compras, consumos, recuentos y anulaciones; el estado incremental coincide con `reconstruir` | `economia/dominio/coste-medio.test.ts` |
| EV-031, EV-090, CA-045, RN-012, RN-037 | Unidad sobre `reconstruir` + integración de la anulación | `economia/dominio/coste-medio.test.ts`, `economia/compras.test.ts` |
| CA-030, CA-031, RF-046, RN-008, RN-034 | Integración | `economia/aportaciones.test.ts` |
| CA-040 a CA-043, RF-046, RNF-010 | Integración (fallo provocado a mitad: sin efectos) | `economia/compras.test.ts` |
| CA-060 a CA-062 (aportaciones y compras), EV-011 | Integración + concurrencia con `worker_threads` | `economia/anulaciones.test.ts` |
| CA-080, CA-081, CA-090 a CA-093, CA-064, EV-080 | Integración | `economia/control.test.ts` |
| CA-135, RN-017, RN-018, INV-06, EV-040, INV-03, RF-139c | Integración + concurrencia | `economia/baja.test.ts`, `usuarios/baja.test.ts` |
| CA-138 | Integración con reloj fijo (15 y 16 minutos) | `economia/control.test.ts`, `economia/baja.test.ts` |
| CA-021 | Integración + E2E | `economia/panel.test.ts`, `e2e/flujos/economia.spec.ts` |
| CA-006 con registro (T-F2-14) | Integración | `economia/capsulas.test.ts` |
| *Actions* (mapeo de errores, `fallo`) | Ruta con evento falso | Junto a cada `+page.server.ts` |
| Formulario de compra con líneas | Componente (Browser Mode) | `src/routes/(app)/compras/FormularioCompra.test.ts` |
| Flujos completos, `sin-js`, EV-050, axe | E2E | `e2e/flujos/economia.spec.ts`, `e2e/sin-js/economia.spec.ts`, `e2e/acceso/rutas.ts`, `e2e/a11y/economia.spec.ts` |
| Calidad de las pruebas de `dominio/` | Mutación (piloto, sin umbral hasta medir la línea base) | `stryker.config.mjs` |

**Concurrencia:** como en T-F2-13, cada `worker_threads` abre su conexión al mismo archivo y ejecuta el SQL de la operación con `BEGIN IMMEDIATE`. Comprueba la garantía de la base de datos (actualización condicionada y recuento dentro de la transacción). En producción hay un solo proceso y las transacciones síncronas ya se serializan.

## Lotes de implementación (orientativo; se concretan en `tasks.md`)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F4-L0 Preparación | `plataforma/azar.ts` y `Ambiente.azar`; StrykerJS instalado y configurado para `dominio/` | — | `verify` (plataforma) |
| F4-L1 Dominio | `coste-medio.ts`, `repartos.ts` con propiedades | EV-020, EV-030, EV-031, EV-090, CA-041 | `test:changed` + mutación piloto |
| F4-L2 Esquema | Migración `0002`, tablas, constructores de pruebas, `hayRegistrosDeTipo` completo | CA-006 con registro | `verify` (migración) |
| F4-L3 Aportaciones y saldos | Casos de uso, consultas de saldo y hucha, anulación | CA-030, CA-031, CA-060 a CA-062, EV-011 | `test:changed` |
| F4-L4 Compras | Registro con líneas y foto, hucha negativa, anulación con regularización | CA-040 a CA-043, CA-045, EV-090 | `test:changed` |
| F4-L5 Control | Arqueos, recuentos, repartos, anulación del último, reautenticación | CA-064, CA-080, CA-081, CA-090 a CA-093, CA-138, EV-080 | `test:changed` |
| F4-L6 Baja | `usuarios.marcarBaja`, `economia.darDeBaja`, asistente | CA-135, EV-040, RN-045 | `test:changed` |
| F4-L7 Pantallas | `/saldos`, `/compras`, `/admin/control`, baja, panel de `/` | CA-021, RNF-001, EV-050 | `test:e2e:quick`, `sin-js`, `acceso`, `a11y` |
| F4-L8 Cierre | `ARCHITECTURE.md`, `textos.ts`, benchmark | Todos | `verify` + benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §3: tablas nuevas de `economia` (`reparto`, `regularizacion`, `aviso_economia`), `consumo` creada en F4 y `sesion_cerrada_por_baja` en `auth`. §6: códigos de D13. §9: eventos de D14. §11: `plataforma/azar.ts` como fuente única de azar | F4-L8 |
| `specs/003-economia/spec.md` | Clarifications con las decisiones de D16 aprobadas | Antes de `tasks.md` |
| `historias.md` §10.4 | Tablas `reparto`, `regularizacion` y `aviso_economia`; estado por línea de recuento en lugar de por recuento. Solo con autorización y CAMBIO-NNN, con respaldo en `.respaldos/` | Pendiente de autorización |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La reconstrucción del coste medio diverge del valor incremental | Una sola función `reconstruir` en `dominio/`; propiedades EV-030 sobre secuencias aleatorias; `invariante.violada` aborta la anulación |
| Un reparto deja un céntimo sin asignar | Propiedad INV-01 sobre importes y número de miembros aleatorios |
| La vista previa y la confirmación difieren por un registro intermedio | `CAMBIO_CONCURRENTE` (D10) |
| Pérdida de la foto del ticket sin JavaScript en el paso de confirmación | Mensaje explícito para volver a adjuntarla; con JavaScript la confirmación ocurre antes de enviar |
| El piloto de StrykerJS alarga la verificación | Se ejecuta aparte (`npm run test:mutacion`), no en `verify`, hasta fijar el umbral |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| `dominio/coste-medio.ts` con `reconstruir` | RN-012 y INV-02 exigen recalcular el coste con la historia vigente | Recalcular solo desde la compra anulada no tiene en cuenta compras posteriores ni stock negativo intermedio (EV-031) |
| `plataforma/azar.ts` | RN-014 exige azar y la constitución VIII exige sustituirlo en las pruebas | `Math.random()` directo no se puede sustituir y está prohibido en `dominio/` |
| Tabla `reparto` | Registrar la asignación de RN-014 y revertir un reparto completo (RN-036) | Movimientos sueltos sin cabecera no permiten saber qué movimientos forman un reparto |
| Tabla `regularizacion` | RF-045 muestra el resumen y la spec pide persona, consumo y compra | Un movimiento con `origen_id` de la compra pierde el consumo afectado |
| Tabla `aviso_economia` | RF-044 (y RF-017 en F3) exigen registrar el aviso antes de F5 (Clarifications 1) | Sin registro, F5 no sabe qué avisos entregar. Una tabla con `tipo` evita una tabla por aviso |
| Tabla `sesion_cerrada_por_baja` (`auth`) | RN-054 pide indicar al móvil que sus consumos en cola se rechazan por la baja | Sin ella, una sesión borrada es indistinguible de una caducada |
| Estado por línea de recuento | RN-036 anula por tipo («último recuento que lo incluyó») | Un estado por recuento no permite anular solo un tipo |
| StrykerJS (desarrollo) | Medir si las pruebas de `dominio/` detectan errores reales de dinero | Ya está en la lista obligatoria de la constitución; sin él no hay forma de medirlo |
