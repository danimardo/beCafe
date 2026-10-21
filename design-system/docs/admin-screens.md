# Pantallas de administración — **PROPUESTO**

> La especificación define las funciones de administración (HU-11 a HU-16) pero no su diseño visual. Estas pantallas son una **propuesta** construida con los mismos componentes; requieren revisión humana. Todas viven en `/admin/*`, ancho `wide`, y en móvil se entra desde Perfil → Administración.

| Pantalla | Ruta | Historias / requisitos | Contenido |
| --- | --- | --- | --- |
| Hub | `/admin` | — | Accesos a cada sección; Banner por prueba de restauración pendiente (RF-144) y por RN-042 |
| Cápsulas | `/admin/capsulas` | HU-11; RF-001–006 | Lista con foto, stock, insignias; Sheet de alta/edición (nombre, marca, intensidad, umbral, color, foto); Retirar/Activar; borrar solo si no hay registros (RF-006) |
| Usuarios | `/admin/usuarios` | HU-13; RF-130–139 | Lista con rol y saldo; alta con enlace de invitación; baja con Stepper y liquidación; reactivar; requiere ReauthDialog; no se puede dejar sin administrador (`ULTIMO_ADMIN`) |
| Arqueos y recuentos | `/admin/control` | HU-12; RF-080–092 | SegmentedControl Arqueo de la hucha / Recuento de stock; saldo teórico vs contado; reparto de la diferencia; anular el último con VoidDialog |
| Configuración | `/admin/configuracion` | HU-15; RF-150 | Parámetros (límite de deuda, plazo de autoanulación, etc.) con confirmación y reautenticación |
| Copias | `/admin/copias` | HU-16; RF-140–144 | Estado de las copias diarias (Correcta/Fallida), error visible, registro de pruebas de restauración |

## Reglas de diseño específicas

- Acciones destructivas o con consecuencias económicas: `ConfirmDialog tone="danger"` o `VoidDialog`; las sensibles, además `ReauthDialog`.
- En móvil las filas con acciones usan `ListRow stackTrailing` (acciones en segunda línea).
- Cada lista define su estado vacío.
