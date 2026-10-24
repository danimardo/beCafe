# Pantalla por pantalla (F9)

Qué cambia en cada pantalla. Todo lo que no se menciona **se queda como está**: formularios en la página (F1 R16), textos de F1–F8, filtros con formulario GET y confirmaciones sin JavaScript. El reparto en columnas está en `escritorio-y-navegacion.md`.

Tamaños de Capsulito: `xs` 40 · `sm` 64 · `md` 112 · `lg` 160 · `xl` 240 px. Los momentos están en `capsulito.md` §4.

## Común a todo `(app)` (RF-182)
- `AppShell` con navegación: barra inferior, carril o barra lateral según el ancho.
- `PageHeader` con campana en todas las pantallas, también en Inicio.
- Fuera de Inicio la tarjeta «Mi perfil / Cerrar sesión»: Perfil está en la navegación y «Cerrar sesión» sigue en Perfil.
- Administradores en móvil: entran a Administración desde Perfil, como ya define el diseño.

## Inicio `/` (RF-184, RF-185, RF-186)

Referencia completa: `referencia/src/routes/(app)/+page.svelte`. Capturas: `capturas/despues/inicio-*.png`.

| Orden en móvil | Contenido | Escritorio (≥ 1024 px) |
| --- | --- | --- |
| 1 | Cabecera: fecha, «Hola, {nombre}», avatar (solo en móvil) y campana | Igual, sin avatar |
| 2 | `Banner` persistentes (pendientes, rechazado), como ahora | Igual |
| 3 | Capsulito `sm`, **solo si avisa o celebra** (tono distinto de «neutro») | Capsulito `lg` **siempre**, arriba a la derecha |
| 4 | `AlertsPanel`: hucha y tu saldo con icono, y una línea de stock bajo si la hay. Sustituye las secciones sueltas «Hucha (teórica)» y «Stock bajo» | Columna derecha |
| 5 | **«¿Qué cápsula te pones?»** + «Toca para apuntar tu café · [icono] para un invitado» + `CapsuleTile` en 2 columnas | Columna izquierda, 3–4 columnas |
| 6 | `WaterRefillCard` (sin cambios de comportamiento) | Columna derecha |
| 7 | «Tus últimos consumos» (los que aún se pueden deshacer, enlazados a su detalle; F3 aclaración 6) | Columna derecha |

- **Qué dice Capsulito**, por prioridad (`momentoInicio()`): consumo rechazado → pendientes → deuda propia → stock bajo → aguador del mes → saludo de mañana o de tarde.
- **Celebraciones**: el relleno de agua y el primer consumo (`esPrimerConsumo` en el `load`). El café normal sigue con su aviso de cápsula.
- **Vacío**: `EmptyState momento="vacio-capsulas"`, con el texto actual: «Todavía no hay cápsulas para registrar. Un administrador debe registrar la primera compra.».

## Saldos `/saldos`
- Capsulito `sm` `aviso-deuda` encima del saldo, solo si tu saldo está por debajo del límite.
- Aportación con éxito: celebración `aportacion-registrada`, o `deuda-saldada` si el saldo pasa de negativo a 0 o más.
- Escritorio: tu saldo, la hucha y el formulario de aportación a la derecha; los saldos del equipo a la izquierda; los últimos registros debajo, a la derecha.

## Historial `/historial`
- Vacío: `vacio-movimientos`.
- En escritorio, los filtros a la derecha, fijos al desplazar.
- Sin otros cambios: el formulario GET con «Aplicar» se queda.

## Compras `/compras`
- Vacío: `vacio-compras`.
- Compra con éxito: celebración `compra-registrada`. Si la hucha queda en negativo, primero la confirmación de siempre.
- Lista con fecha corta y signo.
- En el formulario, el selector de tipo muestra la miniatura de la cápsula si el componente lo permite sin perder el funcionamiento sin JavaScript (si no, se deja como está).

## Estadísticas `/estadisticas`
- Vacío del periodo: `vacio-estadisticas`.
- `KpiTile` con icono, y miniatura de cada cápsula en la leyenda de favoritas.
- En escritorio, los selectores y los KPI a la derecha y los gráficos a la izquierda.

## Perfil `/perfil` (RF-187)
- En Apariencia, debajo de «Reducir transparencia»: interruptor «Mostrar a Capsulito» y enlace «Ver la bienvenida otra vez» (los dos solo funcionan con JavaScript, igual que el de transparencia).

## Ayuda `/ayuda` (RF-188)
- Empieza por «Cómo funciona»: los 4 pasos de la bienvenida con Capsulito `sm`. Se ven sin JavaScript.
- Con JavaScript, botón «Ver la bienvenida».
- Después, la ayuda de instalación de siempre.

## Avisos, errores y sin conexión
- Panel o página de avisos vacía: `vacio-avisos`.
- `ErrorPage`: `sin-conexion`, `no-encontrada`, `sin-permiso` y `servidor` (`md`).
- La página «Sin conexión» del service worker también muestra a Capsulito: precargar las imágenes de 128, 256 y 512 px.

## Acceso `/login`, `/acceso/[token]`
- Capsulito `acceso-hola` (`md`; `xl` a la izquierda en escritorio) y `acceso-contrasena` junto a la ayuda de la contraseña.
- Sin mascota en el bloqueo por intentos ni en los enlaces caducados.

## Sin mascota
- `/aceptar-privacidad`, `/privacidad` y las tablas y formularios de `/admin/*`. En administración solo aparece en los vacíos.
