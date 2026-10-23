# Contratos de rutas: Saldos y estadísticas (F6)

Todas exigen sesión y entran en `acceso` (EV-050) y `a11y`. Los filtros son `<form method="get">` validados con `z.strictObject` en el `load` de la página.

## `/saldos` (completa F4)

- `load`: `leerSaldos(actor)`, hucha y último arqueo, 5 últimas entradas de `leerHistorial(actor, { quien: 'todo' })`, aportaciones propias (F4).
- *Actions* de F4 sin cambios (`aportar`).
- Estados: sin movimientos, cargando, error, sin conexión.

## `/historial`

- Consulta: `z.strictObject({ quien: z.enum(['todo','mios']).default('todo'), tipo: z.enum(['todos','consumos','aportaciones','compras','control']).default('todos'), anulados: z.literal('on').optional(), pagina: z.coerce.number().int().min(1).default(1) })`.
- `load`: `leerHistorial` o, con `quien=mios`, `leerMovimientosPropios` además de los registros propios.
- Una consulta no válida responde con los valores por defecto y un aviso, no con un error (el filtro es de la propia persona).
- Estados: vacío por filtro («No hay registros con estos filtros»), cargando, error, sin conexión.

## `/historial/control/[id=ulid]`

- `load`: `leerRegistroDeControl(actor, id)`; 404 si no existe.

## `/estadisticas`

- Consulta: `z.strictObject({ vista: z.enum(['mias','equipo']).default('mias'), periodo: z.enum(['mes','anio','todo']).default('mes'), mes: esquemaMes.optional(), anio: z.coerce.number().int().min(2026).optional() })`.
- `load`: `leerPersonales(actor, actor.usuarioId, periodo)` o `leerEquipo(actor, periodo)`; lista de personas para el selector si es administrador.
- Estados: sin datos en el periodo (`EmptyState`), cargando, error, sin conexión.

## `/estadisticas/[usuarioId=ulid]`

- Misma consulta (sin `vista`).
- `load`: `leerPersonales(actor, usuarioId, periodo)`. Miembro y persona ajena: `error(403, 'No tienes permiso para ver estas estadísticas.')` sin datos (CA-122). Persona inexistente: 404.
