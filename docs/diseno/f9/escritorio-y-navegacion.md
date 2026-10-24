# Navegación y escritorio (F9 · RF-182, RF-183, RF-184)

Hoy la app desplegada **no tiene navegación** (HALL-017) y en escritorio muestra la columna del móvil centrada. F9 monta la navegación del sistema de diseño, la amplía con un carril para tableta y añade una rejilla de panel para las pantallas que tienen resumen y contenido. Los enlaces usan `resolve()` y funcionan sin JavaScript.

Capturas: `capturas/despues/inicio-escritorio-claro.png`, `…-oscuro.png`, `inicio-tableta-claro.png`, `inicio-movil-claro.png`.

## 1. Puntos de ruptura

| Rango | Nombre | Navegación | Contenido |
| --- | --- | --- | --- |
| < 768 px | móvil | Píldora flotante inferior (sin cambios) | Una columna, márgenes de 20 px |
| 768–1023 px | **tableta** (nuevo) | **Carril de iconos** de 96 px: icono de 22 px y etiqueta corta de 11 px debajo; administración separada por una línea, con etiquetas cortas (`NavItem.short`: «Arqueos», «Ajustes», «Copias») | Una columna; el resumen va arriba |
| ≥ 1024 px | escritorio | Barra lateral de 240 px (la del sistema de diseño) con marca, grupo «Administración» y tarjeta de persona | **Dos columnas** (`PanelGrid`) en las pantallas `panel` |
| ≥ 1280 px | escritorio ancho | igual | La columna de resumen pasa de 352 a 384 px; la rejilla de cápsulas gana columnas sola |

Implementación: `referencia/src/lib/components/layout/AppNav.svelte` y `AppShell.svelte` (el relleno izquierdo del contenido es `md:pl-[8rem] lg:pl-[16.5rem]`).

## 2. Anchos de contenido (`AppShell width`)

| Valor | Máximo | Pantallas |
| --- | --- | --- |
| `panel` (nuevo) | 1200 px | `/`, `/saldos`, `/historial`, `/compras`, `/estadisticas` |
| `normal` | 672 px | `/perfil`, `/ayuda`, `/privacidad`, `/aceptar-privacidad` |
| `wide` | 1024 px | `/admin/*` |

Se elige en `(app)/+layout.svelte` con `widthFor(pathname)` (ver referencia).

## 3. `PanelGrid`: resumen, principal y secundario

```svelte
<PanelGrid>
  {#snippet resumen()}…{/snippet}     <!-- lo primero que se lee: cifras, estado, Capsulito -->
  {#snippet principal()}…{/snippet}   <!-- la acción de la pantalla -->
  {#snippet secundario()}…{/snippet}  <!-- lo que se consulta después -->
</PanelGrid>
```

```
Móvil y tableta (orden del DOM = orden de lectura)      Escritorio ≥ 1024 px
┌────────────────────┐                                  ┌──────────────────────────────┬────────────┐
│ resumen            │                                  │ principal                    │ resumen    │
├────────────────────┤                                  │                              │ (352–384)  │
│ principal          │                                  │                              ├────────────┤
├────────────────────┤                                  │                              │ secundario │
│ secundario         │                                  └──────────────────────────────┴────────────┘
└────────────────────┘
```

- El **orden del DOM no cambia** entre tamaños (accesibilidad: el lector de pantalla y el tabulador leen resumen → principal → secundario). Solo cambia la colocación con la rejilla CSS.
- Separación: 24 px en vertical (móvil) y 32 px entre columnas (escritorio).
- No anides `PanelGrid` ni lo uses en pantallas `normal` o `wide`.

## 4. Reparto por pantalla

| Pantalla | resumen | principal | secundario |
| --- | --- | --- | --- |
| **Inicio** | Capsulito contextual (`lg` en escritorio; `sm` en móvil solo si avisa o celebra) · `AlertsPanel` | «¿Qué cápsula te pones?» con rejilla de `CapsuleTile`: 2 columnas en móvil, 3 desde 640 px, `auto-fill minmax(11rem,1fr)` en escritorio (3–4 columnas) | `WaterRefillCard` · «Tus últimos consumos» (los que aún se pueden deshacer, F3 aclaración 6). **En móvil quedan después de las cápsulas (RF-184)** |
| **Saldos** | Tu saldo, la hucha y el formulario de aportación que ya existe · Capsulito `aviso-deuda` si tu saldo está bajo el límite | Saldos del equipo (`ListRow`; en ≥ 1280 px, 2 columnas de filas) | Últimos registros + «Ver historial completo» |
| **Historial** | El `<form method="get">` de filtros que ya existe (con «Aplicar» sin JavaScript); en escritorio queda fijo arriba (`lg:sticky lg:top-8`) | `MovementList` + `Pagination` + nota de rellenos | — |
| **Compras** | El formulario de compra que ya está en la página (R16, F4 T032), sobre superficie estable | Lista de compras recientes o vacío con Capsulito `vacio-compras` | — |
| **Estadísticas** | Mías/Equipo, periodo, persona (admin) y los 4 `KpiTile` en 2×2 | `BarChart`, `SplitBar` y ranking de rellenos; en ≥ 1280 px, las dos últimas tarjetas lado a lado | — |

Perfil, Ayuda y Privacidad siguen a 672 px (son lectura y formularios). La administración sigue a 1024 px con sus tablas.

## 5. Detalles de escritorio que no hay que olvidar

- **Avatar duplicado**: en escritorio la persona ya está en la barra lateral, así que el `Avatar` del `PageHeader` de Inicio solo se muestra en móvil (`md:hidden`).
- **Formularios**: siguen en la página y sobre superficie estable (F1 R16). F9 no los mueve a hojas.
- **Avisos flotantes**: abajo a la derecha en escritorio (sin cambios).
- **Hover**: las tarjetas pulsables (`CapsuleTile`, `ListRow` pulsable) suben 2 px la imagen y aclaran el botón al pasar el ratón; el foco de teclado sigue siendo el anillo de 3 px `accent`.
- **Teclado**: en escritorio, `Tab` recorre las tarjetas de cápsula en orden de lectura (por filas). No añadas atajos de teclado en esta fase.
