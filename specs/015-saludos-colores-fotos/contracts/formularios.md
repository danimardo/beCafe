# Contratos de formulario: F15

Todos son `<form method="post">` con *action* con nombre y `use:enhance`, y funcionan sin JavaScript (constitución XVII). Los errores vuelven con `fallo(estado, errorZod, datos)`; `valores` nunca lleva archivos.

## Cápsula: alta (`admin/capsulas/nueva`, `?/crear`) y edición (`admin/capsulas/[capsulaId]`, `?/guardar`)

Campos nuevos o cambiados:

| Campo | Esquema | Error |
| --- | --- | --- |
| `color` | Token elegible, `cap-rosa` (solo si ya era el color del tipo) o `#rrggbb` | `COLOR_NO_VALIDO` («Elige un color de la lista o uno con el selector.»), `COLOR_NO_ELEGIBLE` («Ese color ya no se puede elegir. Elige otro.») |
| `colorPropio` | `#rrggbb`; solo se usa si `color = 'otro'` | Igual que `color` |
| `encuadreX`, `encuadreY`, `encuadreLado` | Ver `data-model.md`; todos o ninguno | `FOTO_ENCUADRE_NO_VALIDO` («La zona elegida no cabe en la foto. Vuelve a encuadrarla.») |

Antes de validar, el contrato combina `color` y `colorPropio`: el radio «Otro color» envía `color=otro` y el selector envía `colorPropio`.

## Cápsula: quitar foto (`admin/capsulas/[capsulaId]`, `?/quitarFoto`)

| Campo | Esquema |
| --- | --- |
| `quitar` | `z.literal('si')` |

- **Respuesta**: vuelve a cargar la página sin foto y con la confirmación «Foto quitada».
- **Error**: un miembro recibe 403 por `error()`.

## Persona: foto (alta en `admin/usuarios`, cambio en `admin/usuarios/[usuarioId]` y en Perfil, `?/foto`)

Se añaden `encuadreX`, `encuadreY` y `encuadreLado`, con el mismo esquema y el mismo error.

## Inicio: `load`

Se añade `mensajeDia: { id: string; texto: string } | null` a los datos de la página. No hay *action* nueva.
