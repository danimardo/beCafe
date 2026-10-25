# Data Model: F11

Una migración nueva, `drizzle/0008_f11-frases.sql`, solo de avance. No toca cargos, movimientos ni ninguna tabla económica (constitución XIV).

## Tabla nueva `frase_entregada` (módulo `usuarios`)

| Columna | Tipo | Reglas |
| --- | --- | --- |
| `usuario_id` | `text` | FK `usuario.id`, no nulo |
| `lista` | `text` | `CHECK (lista IN ('registro', 'saludo'))` |
| `ciclo` | `integer` | ≥ 1; empieza en 1 por persona y lista |
| `frase_id` | `text` | Identificador estable del catálogo (`registro_01`…`registro_80`, `saludo_01`…`saludo_80`) |
| `entregada_en` | `text` | `InstanteUtc` ISO 8601 |

- Clave primaria: `(usuario_id, lista, ciclo, frase_id)`. Impide entregar dos veces la misma frase en un ciclo (EV-108).
- Índice: `(usuario_id, lista, entregada_en)` para leer el último saludo (RN-089).
- Retención: sin plazo propio; las filas de un ciclo completo se pueden borrar al empezar el siguiente, porque no son registros económicos ni de auditoría. El caso de uso borra los ciclos anteriores al actual − 1 para que la tabla no crezca (máximo 160 filas por persona y lista).

### Reglas derivadas

- **Ciclo actual** = `max(ciclo)` de `(usuario, lista)`, o 1 si no hay filas.
- **Disponibles** = ids del catálogo − ids entregados en el ciclo actual. Los ids entregados que ya no están en el catálogo se ignoran (edge case de la spec).
- Si no hay disponibles, el ciclo pasa a `actual + 1` y disponibles = todo el catálogo (RN-088).
- **Último saludo** = `max(entregada_en)` con `lista = 'saludo'`. `saludoDisponible` ⇔ no existe o `ahora − último ≥ 2 h` (RN-089).

## Función pura `dominio/ciclo-frases.ts`

```text
siguienteFrase(catalogo: readonly string[], entregadas: ReadonlySet<string>, cicloActual: number, azar: Azar)
  → { fraseId: string; ciclo: number }
```

Propiedades (fast-check): en `n = |catalogo|` llamadas seguidas no hay repetidos; la llamada `n + 1` sube el ciclo; nunca devuelve un id fuera del catálogo.

## Catálogos tipados (sin base de datos)

- `src/lib/shared/mascota/frases.ts`: `FRASES_REGISTRO` y `FRASES_SALUDO`, cada una `readonly { id; texto; textoVoz; pose: Pose }[]` de 80 elementos. `texto` es literal de `frases.md` (prueba: compara con el anexo).
- `src/lib/shared/mascota/momentos.ts`: se retiran las variantes de `consumo.confirmado` y `consumo.invitado_confirmado` (sustituidas por RF-213) salvo su texto base, que sigue sirviendo de respaldo sin mascota; se añaden `error.peticion`, `error.sin_permiso`, `error.no_encontrada`, `error.servidor` y las poses de los pasos del tour.
- `src/lib/shared/avatar.ts`: `ILUSTRACIONES_AVATAR` (8) e `ilustracionAvatar(usuarioId)`.

## Cambios en tablas existentes

Ninguno. La foto del alta usa la columna `usuario.foto_ruta` de F10.

## Datos del navegador

Sin cambios en la lista cerrada del principio V: mascota, voz, tema y «Reducir transparencia» siguen en `localStorage` con las mismas claves; solo cambian de pantalla.
