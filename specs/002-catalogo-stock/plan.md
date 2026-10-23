# Implementation Plan: Catálogo de tipos de cápsula y stock (F2)

**Branch**: `main` (AGENTS.md §9) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) (aprobada el 2026-10-22)

**Estado**: propuesta de plan. Pendiente de aprobación de la persona usuaria en esta sesión. Sin aprobación no se generan `tasks.md` ni se implementa (AGENTS.md §2).

**Artefactos**: este archivo reúne la investigación (decisiones D1 a D8), los contratos de rutas y las pruebas. El modelo de datos está en [data-model.md](data-model.md).

## Summary

F2 entrega el catálogo de tipos de cápsula (alta, edición, retirada, reactivación, borrado y foto) y el estado de stock bajo con su estimación de días. Introduce el parte de `economia` que F4 y F3 ampliarán: la tabla de existencias y el registro de entradas en stock bajo.

El cambio principal es **separar `tipo_capsula` en dos tablas** (decisión D1), como anticipa `ARCHITECTURE.md` §3 y §14. Así `catalogo` escribe solo datos descriptivos y `economia` escribe solo stock, umbral y avisos, sin que dos módulos compartan columnas.

## Technical Context

**Language/Version**: TypeScript 6 estricto; Node 24 LTS.

**Primary Dependencies**: SvelteKit 3, Svelte 5 (runes), Drizzle ORM 0.45 con `better-sqlite3`, Zod 4, `ulid`. Nueva: **`sharp` 0.35** (ver D5 y la justificación de §13 de `ARCHITECTURE.md` más abajo).

**Storage**: SQLite (WAL) con una migración nueva que solo añade tablas (`drizzle/0001_f2-catalogo-stock.sql`). Fotos en `<DIRECTORIO_DATOS>/fotos/`.

**Testing**: Vitest (proyecto `servidor`: unidad e integración con SQLite real; concurrencia con `worker_threads`), Vitest Browser Mode para componentes con estado, Playwright (`chromium-movil`, `sin-js`, `acceso`, `a11y`).

**Target Platform**: Servidor Linux en Docker, una instancia (RT-010). Clientes móviles (RNF-013).

**Project Type**: aplicación SvelteKit única (ADR-0002).

**Performance Goals**: RNF-003 (50 tipos sin cambios de diseño). RNF-002 no aplica a F2.

**Constraints**: WCAG 2.2 AA en claro y oscuro (RNF-001); formularios que funcionan sin JavaScript (RF-005 incluido); fotos servidas solo con sesión (constitución V); sin datos personales en logs.

**Scale/Scope**: unos 10 usuarios; hasta 50 tipos de cápsula.

## Constitution Check

| Principio | Cumplimiento en F2 | Estado |
| --- | --- | --- |
| I. Fuente vigente | Cada comportamiento cita su RF, RN o CA de la spec. Las decisiones de Clarifications son del usuario | Cumple |
| II. Complejidad justificada | Dos tablas en lugar de una: justificada por D1. `sharp`: justificada por D5. Sin caché ni capa nueva | Cumple |
| III. Separación y módulos | Escrituras de stock solo en `economia`. `catalogo` sin reglas de stock | Cumple |
| IV. Integridad económica | F2 no registra dinero. El stock es un entero. Las entradas de stock bajo se escriben en la misma transacción que la variación | Cumple |
| V. Almacenamiento | Fotos en `/data/fotos`, servidas por la aplicación con sesión. Fechas en UTC | Cumple |
| VI. Seguridad y validación | Zod en formularios, parámetros de ruta (`ulid`) y el archivo subido. Tipo real del archivo con `sharp`. Permisos en el caso de uso | Cumple |
| VII. Tipado estricto | Sin `as`, `any` ni `!`. Tipos derivados de los esquemas | Cumple |
| VIII. Pruebas y cobertura | Cada CA del alcance tiene prueba (matriz). La estimación y el umbral son unidades puras. Cobertura de `economia/dominio/` al 90 % | Cumple |
| IX. Verificación | Lote a lote con `test:changed`; cierre con `npm run verify` y benchmark | Cumple |
| X. Usabilidad | Una acción primaria por pantalla. Estados vacío, cargando, error y sin conexión definidos en Contratos. Mensajes en español | Cumple |
| XI. Accesibilidad | Stock bajo con texto además del color. Foto con texto alternativo. axe en claro y oscuro | Cumple |
| XII. Redacción | Plan y contratos en ETS | Cumple |
| XIII. Errores | Códigos cerrados: se añade `NOMBRE_DUPLICADO` (D7) | Cumple |
| XIV. Migraciones | Solo añade tablas. No toca `0000` | Cumple |
| XV. Agentes | Este plan propone un cambio de `ARCHITECTURE.md` (§2, §3, §6, §9) que se hace en el mismo lote | Cumple |
| XVI. Registro técnico | Eventos del catálogo (§9 de `ARCHITECTURE.md`); sin nombres ni rutas de foto en los eventos | Cumple |
| XVII. SvelteKit idiomático | `load` en `+page.server.ts`; altas y ediciones con *actions* sin JavaScript; `+server.ts` solo para servir la imagen | Cumple |
| XVIII. Identidad visual | Colores solo de `cap-*` y tokens; el panel de avisos sobre superficie estable | Cumple |

**Resultado:** la puerta se supera. Un punto necesita aprobación explícita: la divergencia de `historias.md` §10.4 (D1).

## Architecture Check (`ARCHITECTURE.md` §15)

1. **Constitución:** sí (tabla anterior).
2. **Ubicaciones:** `catalogo/` (tabla `tipo_capsula`, fotos); `economia/` (tablas `existencia` y `entrada_stock_bajo`, `dominio/stock.ts`); `plataforma/imagenes.ts` (`sharp`, único archivo que lo importa).
3. **Grafo:** sin aristas nuevas. `economia → catalogo` ya existe en §4. `catalogo` no importa `economia`.
4. **Reutilización:** `AlertsPanel`, `StockBadge`, `CapsuleRow`, `CapsuleImage`, `PhotoField`, `ColorField`, `TextField`, `ConfirmDialog`, `Badge`, `EmptyState`, `Banner`, `PageHeader` de `lib/ui`.
5. **Piezas nuevas con su problema:** `sharp` (D5), tabla `existencia` (D1), `entrada_stock_bajo` (D4).
6. **Reglas, invariantes y escenarios:** cada RN del alcance (RN-006, RN-070 a RN-073) tiene dueño (`economia`) y prueba. INV-02 se comprueba recalculando `en_stock_bajo` desde `stock` y `umbral_minimo`.
7. **Repetición, retraso y fallo a mitad:**
   - Dos altas simultáneas del mismo nombre: el índice único parcial deja pasar solo una (D7).
   - Un fallo de `sharp` antes de la transacción no deja registro; el fichero temporal se borra.
   - Un fallo de la transacción después de guardar la foto borra el fichero nuevo.
   - F2 no tiene avisos push pendientes; la entrada de stock bajo queda registrada en la transacción (D4).
8. **Fuentes vigentes:** comportamiento en `spec.md`; diseño en este plan. `historias.md` §10.4 queda sin cambios hasta que el usuario autorice el CAMBIO (ver D1).
9. **Autorización:** en los casos de uso. Entran en EV-050: `/admin/capsulas`, `/admin/capsulas/nueva`, `/admin/capsulas/[capsulaId]` y `/fotos/[capsulaId]`.
10. **Afectados:** F3 (consumos), F4 (compras, coste medio), F5 (entradas de stock bajo se convierten en avisos), F6 (estadísticas por tipo).
11. **Migraciones:** `0001` solo añade tablas. No hay datos económicos que migrar.
12. **Datos y formularios:** alta, edición, retirada y borrado son *actions* con nombre y `use:enhance`. La subida de foto funciona sin JavaScript (constitución XVII).
13. **Eventos:** ver la lista de D9. Las pruebas usan `crearRegistroFalso()`.
14. **Pantallas:** estados definidos en Contratos; todas entran en la suite `a11y` en claro y oscuro.

## Decisiones

### D1. Separación de `tipo_capsula` (propone la aprobación)

`historias.md` §10.4 pone en `tipo_capsula` las columnas `stock`, `coste_medio` y `en_stock_bajo`. `ARCHITECTURE.md` §3 pide separarlas en F2/F4, y el propio §3 dice que solo `economia` escribe esas columnas.

**Decisión:** dos tablas.
- `tipo_capsula` (dueño `catalogo`): id, nombre, nombre normalizado, marca, intensidad, color, foto, estado (activo o retirado), instantes.
- `existencia` (dueño `economia`): tipo, umbral mínimo, stock, coste medio, indicador de stock bajo.

**Alternativas:** dejar todo en `tipo_capsula` y que `catalogo` escriba stock al dar de alta (rompe §3 y necesita una arista `catalogo → economia`, con ciclo). Rechazada.

**Consecuencia:** `historias.md` §10.4 recoge la separación con el CAMBIO-015 (0.15.0), autorizado el 22-10-2026.

### D2. Quién orquesta las escrituras

Las altas, las ediciones de umbral, la retirada, la reactivación y el borrado llaman a casos de uso de `economia`. Ese módulo llama a funciones de `catalogo` que reciben `tx` para escribir los datos descriptivos.

**Razón:** cualquier alta crea la fila de existencias, y un cambio de umbral puede generar una entrada de stock bajo. Si `catalogo` escribiera ambas tablas, necesitaría importar `economia` y el grafo tendría un ciclo.

### D3. Estado de stock bajo y estimación

- `dominio/stock.ts` (`economia`, puro): `estaEnStockBajo(stock, umbral)` devuelve `stock <= umbral` (RN-071; con umbral 0, solo stock 0 o negativo). `diasEstimados(stock, consumosUltimos30)` devuelve `Math.floor(stock / (consumos / 30))`, o «sin datos» si `consumos` es 0, o 0 si `stock <= 0` (Clarifications, punto 5).
- `en_stock_bajo` se guarda y se recalcula en la misma transacción que cambia `stock` o `umbral`. INV-02 se prueba comparándolo con el recálculo.
- Con F2 no hay consumos todavía: el número de consumos llega como parámetro. La prueba de CA-022 (30 y 60 consumos) es de unidad, y cuando exista F3 se repite con datos reales.

### D4. Entrada de stock bajo

`existencia` guarda el estado actual. Una fila en `entrada_stock_bajo` (tipo, instante) se crea solo en la transición de «no» a «sí» (RN-072). Una bajada posterior no crea otra; una salida y una nueva entrada sí.

**Razón:** RF-023 pide registrar la entrada y que F5 la entregue sin duplicados. ADR-0003 quiere que el aviso se registre en `notificaciones.registrarAviso(tx)`; ese módulo llega en F5. En F5 la entrada se convierte en aviso y la tabla queda como registro de origen. Este punto se anota en F5.

### D5. Fotos con `sharp`

- Un archivo se valida por su contenido real (JPEG, PNG o WebP), no por su extensión, con `sharp().metadata()`. Un fichero de más de 5 MB se rechaza antes con Zod (RF-005).
- Se redimensiona a 512 px en el lado mayor y se re-codifica a WebP. Re-codificar elimina los metadatos, incluido el GPS.
- Ruta: `<DIRECTORIO_DATOS>/fotos/<ulid>.webp`. `tipo_capsula.foto_ruta` guarda solo el nombre del fichero.
- Se sirve por `/fotos/[capsulaId]` (`+server.ts` GET) con sesión comprobada en el caso de uso.

**Alternativas:** guardar el original sin procesar (incumple RF-005), o validar con una herramienta que no redimensiona (dos librerías para el mismo problema, constitución II). `sharp` ya está en la lista obligatoria de la constitución (sección «Tecnologías obligatorias», 0.35.x) y `ARCHITECTURE.md` §11 lo aísla en `plataforma/imagenes.ts`.

**Justificación de §13 (`ARCHITECTURE.md`):** necesidad: validar y redimensionar imágenes. Alternativa presente: ninguna. Mantenimiento y licencia: paquete activo, Apache-2.0. Seguridad: `npm audit` en la CI. Impacto: binarios nativos; la imagen Docker debe incluirlos (se comprueba en la CI, F7).

### D6. Permisos

- Leer el catálogo y las estadísticas de stock: cualquier miembro con sesión (`actor`).
- Dar de alta, editar, retirar, reactivar, borrar y subir foto: rol administrador, comprobado en el caso de uso (RNF-007). No exige reautenticación (la spec lo fija).

### D7. Nombre único sin distinguir mayúsculas

`tipo_capsula.nombre_normalizado` = nombre sin espacios sobrantes en minúsculas. Índice único parcial: `UNIQUE (nombre_normalizado) WHERE estado = 'activo'`. Un conflicto de la base de datos se traduce al código `NOMBRE_DUPLICADO`, que se añade al conjunto cerrado de `ARCHITECTURE.md` §6 (RF-002).

**Razón:** dos administradores que dan de alta a la vez el mismo nombre solo crean uno (la base de datos decide). La comprobación previa en el caso de uso solo mejora el mensaje.

### D8. Borrado con registros

F2 no tiene tablas de consumos ni de compras. El borrado comprueba una función `hayRegistrosDeTipo(tx, id)` de `economia`, que F2 implementa devolviendo `false` para las tablas que aún no existen, y que F3 y F4 completan al añadir sus tablas. Así el contrato queda fijado antes de que existan los registros.

**Consecuencia para CA-006:** la parte «con un registro» de CA-006 no se puede probar en F2 sin tablas de consumos. Se prueba con el registro simulado de `economia/pruebas/` en F2 y se repite con un consumo real en F3. Se anota en `tasks.md` cuando exista.

### D9. Eventos (`ARCHITECTURE.md` §9)

Ya en el catálogo: `capsula.alta`, `capsula.modificada`, `capsula.desactivada`, `foto.procesada` (info), `foto.rechazada` (warn).

Se añaden: `capsula.reactivada`, `capsula.borrada` (info), `stock.entrada_bajo_registrada` (info). Ninguno contiene nombres, valores de stock ni rutas.

## Contratos

### Rutas (`contracts/rutas.md`, resumido)

| Ruta | Carga (`load`) | Acciones | Permiso | Estados |
| --- | --- | --- | --- | --- |
| `/` (panel de avisos y estado de stock, `(app)/+page.server.ts`) | `leerAvisosStock(actor)` y `leerEstadoTipos(actor)` | ninguna | miembro | vacío («Todavía no hay tipos de cápsula»), cargando, error, sin conexión |
| `/admin/capsulas` | `leerCatalogo(actor)` | ninguna | admin | vacío, error |
| `/admin/capsulas/nueva` | ninguna | `crear` | admin | error de campos, éxito con redirección |
| `/admin/capsulas/[capsulaId=ulid]` | `leerTipo(actor, id)` | `guardar`, `retirar`, `reactivar`, `borrar` (con confirmación) | admin | no encontrado (404), error |
| `/fotos/[capsulaId=ulid]` | sesión comprobada en el caso de uso | GET | miembro | sin foto (404) |

**Errores de formulario:** `fallo(estado, errorZod, datos)`. Los valores del formulario no incluyen el archivo.

**Textos de los estados:** en `lib/shared/textos.ts`. Sin conexión: «Necesitas conexión para gestionar el catálogo». Error: «No se ha podido cargar el catálogo. Vuelve a intentarlo.»

### Validación de entrada (`lib/shared/contratos/capsulas.ts`)

- Nombre: texto de 1 a 60 caracteres, sin espacios sobrantes.
- Marca: texto de 1 a 60 caracteres.
- Intensidad: opcional, entero de 1 a 13 (`z.coerce.number().int().min(1).max(13)`, con cadena vacía → nulo).
- Color: uno de la paleta `cap-*`.
- Umbral: entero de 0 o más, obligatorio (Clarifications, punto 2).
- Foto: opcional; tamaño máximo 5 MB, validado en Zod.

## Validación (quickstart)

1. `npm run check` y `npm run arch` pasan.
2. `npm run test:changed` con las pruebas de `catalogo/` y `economia/` (stock).
3. Con la siembra E2E, un administrador da de alta «Ristretto» con foto, la edita, la retira y la vuelve a activar.
4. Un miembro abre `/admin/capsulas`, `/admin/capsulas/nueva` y `/fotos/...` y recibe «sin permiso» (EV-050).
5. El panel de avisos muestra los tipos en stock bajo preparados.

## Lotes de implementación (orientativo; se concretan en `tasks.md`)

| Lote | Contenido | CA/EV | Cierre |
| --- | --- | --- | --- |
| F2-L0 Dependencias y `sharp` | Instalar `sharp`, comprobar binarios en Linux y Windows, `plataforma/imagenes.ts` | CA-005 | `test:changed` |
| F2-L1 Migración y tablas | `0001`: `tipo_capsula`, `existencia`, `entrada_stock_bajo`; esquemas; `dominio/stock.ts` | CA-020, CA-022 | `test:changed` + `verify` (esquema y migración) |
| F2-L2 Catálogo | Altas, ediciones, retirada, reactivación, borrado, foto; casos de uso | CA-001 a CA-006 | `test:changed` + `verify` |
| F2-L3 Stock y avisos | Umbral, transición, entrada de stock bajo, panel, estimación | CA-003, CA-020, CA-021 (parcial), CA-022, CA-023 | `test:changed` |
| F2-L4 Pantallas | `/admin/capsulas*`, `/fotos`, panel en `/` | RNF-001, EV-050 | `test:e2e:quick`, `sin-js`, `acceso`, `a11y` |
| F2-L5 Cierre | `ARCHITECTURE.md` (§2, §3, §6, §9, §14), `historias.md` (sin cambios hasta autorizar), benchmark | Todos | `npm run verify` y benchmark |

## Cambios en otros documentos

| Documento | Cambio | Lote |
| --- | --- | --- |
| `ARCHITECTURE.md` | §3: tablas separadas (`tipo_capsula` en `catalogo`, `existencia` y `entrada_stock_bajo` en `economia`). §6: `NOMBRE_DUPLICADO`. §9: los eventos de D9. §14: retirar «separar tipo_capsula» de los pendientes | F2-L5 |
| `historias.md` §10.4 | Divergencia D1. Solo con autorización y CAMBIO-NNN, con respaldo en `.respaldos/` | Pendiente de autorización |
| `docs/pruebas.md` | Solo si aparece una tarea de verificación nueva | — |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `sharp` no instala binarios en Windows o en la imagen Docker | Probar en L0 en Linux; anotar la prueba en Windows; la CI construye la imagen en F7 |
| Foto muy grande consume memoria | Límite de 5 MB en Zod antes de `sharp`; `sharp` con `limitInputPixels` |
| Divergencia con `historias.md` §10.4 | D1 se presenta a la aprobación; sin CAMBIO, la fuente sigue siendo la spec de F2 |

## Complexity Tracking

| Pieza | Problema concreto | Alternativa más simple descartada porque… |
| --- | --- | --- |
| Tabla `existencia` separada (D1) | `catalogo` no puede escribir stock sin un ciclo | Una sola tabla con columnas de dos dueños: viola §3 |
| `entrada_stock_bajo` (D4) | RF-023 exige registrar cada entrada sin duplicados | Calcular las entradas al vuelo pierde la historia de transiciones |
| `sharp` (D5) | RF-005: validar el tipo real, redimensionar y quitar metadatos | Sin librería no hay forma fiable de redimensionar ni de quitar el GPS |
