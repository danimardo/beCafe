# Índice de componentes

Todos se importan desde `#lib`. Demo interactiva: ejecutar la app y abrir `/componentes`.

## Base (ui)

| Componente | Qué es |
| --- | --- |
| [Glass](./Glass.md) | Superficie de cristal translúcido. Base de toda tarjeta, panel o tile. |
| [Button](./Button.md) | Botón de acción. Variantes: primary (una por pantalla), soft, ghost, danger, glass. Con `href` se renderiza como enlace. |
| [IconButton](./IconButton.md) | Botón solo de icono (editar, borrar, cerrar). |
| [Badge](./Badge.md) | Etiqueta corta de estado (Administrador, Correcta, Fallida…). |
| [Money](./Money.md) | Importe en euros formateado es-ES con signo (U+2212) y cifras tabulares. Recibe céntimos enteros. |
| [Avatar](./Avatar.md) | Iniciales de la persona en círculo. Decorativo. |
| [SegmentedControl](./SegmentedControl.md) | Selector de 2–4 opciones excluyentes (periodo, tipo de registro). Basado en Bits UI RadioGroup. |
| [TextField](./TextField.md) | Campo de texto (o área de texto con `rows`) con etiqueta visible, ayuda y error. |
| [PasswordField](./PasswordField.md) | Campo de contraseña con botón mostrar/ocultar y contador de mínimo 15 caracteres (RT-007/RN-047). |
| [MoneyField](./MoneyField.md) | Campo de importe: el usuario escribe «2,45» y el componente expone céntimos enteros (`bind:cents`). |
| [SelectField](./SelectField.md) | Selector nativo con etiqueta, ayuda y error. |
| [Switch](./Switch.md) | Interruptor on/off con etiqueta y descripción (preferencias de avisos). |
| [PhotoField](./PhotoField.md) | Elegir/hacer una foto con vista previa (RF-005). |
| [ColorField](./ColorField.md) | Selector de color de la cápsula entre presets (`capsulePresets`) o hex. |
| [Sheet](./Sheet.md) | Hoja modal: panel inferior en móvil, diálogo centrado en ≥md. Bits UI Dialog. |
| [ConfirmDialog](./ConfirmDialog.md) | Confirmación de acciones con consecuencias (reparto, hucha negativa). Bits UI AlertDialog. |
| [VoidDialog](./VoidDialog.md) | Anulación con motivo obligatorio (RN-030) y explicación de la consecuencia económica. |
| [ReauthDialog](./ReauthDialog.md) | Pide la contraseña de nuevo antes de acciones sensibles (RN-050). |
| [UndoToast](./UndoToast.md) | Aviso temporal con «Deshacer» (RF-013), 5 s. |
| [ToastRegion](./ToastRegion.md) | Contenedor de avisos: región `role=status` siempre montada. Ya está dentro de `AppShell`. |
| [Banner](./Banner.md) | Aviso en línea persistente: info, warning, negative, offline. |
| [EmptyState](./EmptyState.md) | Estado vacío con icono, texto y acción. |
| [Skeleton](./Skeleton.md) | Marcador de carga con forma del contenido. |
| [ListRow](./ListRow.md) | Fila genérica: leading + título/subtítulo + trailing. Enlace, botón o estática. |
| [Stepper](./Stepper.md) | Indicador de pasos (baja de usuario con liquidación). |
| [ThemeToggle](./ThemeToggle.md) | Selector Automático / Claro / Oscuro (perfil). |
| [Pagination](./Pagination.md) | Navegación entre páginas de una lista: «Página N de M» con «Anterior» y «Siguiente». |
| [CopyField](./CopyField.md) | Campo de solo lectura con botón «Copiar» para enlaces de invitación y de recuperación (RF-131). |

## Dominio (capsulas)

| Componente | Qué es |
| --- | --- |
| [CapsuleImage](./CapsuleImage.md) | Foto de la cápsula con aro de color; si no hay foto, dibujo de cápsula con `color`. |
| [CapsuleRow](./CapsuleRow.md) | Fila de la pantalla principal: toda la fila registra +1; botón aparte para invitado (RF-014). |
| [StockBadge](./StockBadge.md) | Insignia «Stock bajo» (≤ umbral) o «Agotada» (≤0). |
| [AlertsPanel](./AlertsPanel.md) | Panel de inicio con saldo de la hucha, tu saldo y avisos de stock/deuda. |
| [MovementRow](./MovementRow.md) | Fila de movimiento (consumo, aportación, compra, arqueo, recuento, reparto, regularización, baja y **relleno de agua**, que no tiene importe) con estados anulado y pendiente. |
| [KpiTile](./KpiTile.md) | Cifra grande con etiqueta. |
| [BarChart](./BarChart.md) | Gráfico de barras simple en SVG/HTML sin librería. |
| [SplitBar](./SplitBar.md) | Barra proporcional segmentada (cápsulas favoritas). |
| [MovementList](./MovementList.md) | Lista de movimientos con la hoja de detalle y el diálogo de anulación incluidos (RF-062, RF-112). |
| [WaterRefillCard](./WaterRefillCard.md) | Tarjeta de Inicio para registrar un relleno de agua (HU-17): último relleno, acción «He rellenado el agua», aguador del mes y enlace a los rellenos recientes. |
| [MovementDetailSheet](./MovementDetailSheet.md) | Detalle de un movimiento con el botón «Anular» o el texto que explica por qué no se puede (RF-111, RF-112, RF-062). |
| [RegularizationSummary](./RegularizationSummary.md) | Resumen de regularizaciones tras anular una compra (RN-012, RF-045): qué cargos y abonos se han recalculado. |

## Estructura (layout)

| Componente | Qué es |
| --- | --- |
| [AppShell](./AppShell.md) | Estructura de página: fondo, skip link, navegación, contenido, avisos. |
| [AppNav](./AppNav.md) | Navegación: píldora flotante inferior en móvil; barra lateral de cristal en ≥md con grupo Administración. |
| [PageHeader](./PageHeader.md) | Antetítulo + título (serif) + acciones. |
| [Section](./Section.md) | Bloque con título `h2` y acciones. |
| [BrandMark](./BrandMark.md) | Logotipo y nombre «beCafé» (RT-011). Tamaños `sm` (barra lateral), `md` (privacidad bloqueante) y `lg` (acceso). |
| [BackLink](./BackLink.md) | Enlace «‹ Volver» a la pantalla padre, para pantallas de detalle (p. ej. Mi saldo). |
| [ErrorPage](./ErrorPage.md) | Página de error con icono, texto y acciones: no encontrada, sin permiso, error del servidor y sin conexión. |

## Notificaciones

| Componente | Qué es |
| --- | --- |
| [NotificationBell](./NotificationBell.md) | Campana con contador de avisos nuevos que abre el panel (RF-107). Va en `PageHeader` de todas las pantallas. |
| [NotificationItem](./NotificationItem.md) | Una notificación del panel: icono por tipo, título, texto, tiempo relativo y marca «nuevo». |
| [NotificationPanel](./NotificationPanel.md) | Hoja con las notificaciones de los últimos 30 días, agrupadas en «Nuevos» y «Anteriores» (RF-107). Se marcan leídas al abrir. |

## Legal

| Componente | Qué es |
| --- | --- |
| [PrivacyText](./PrivacyText.md) | Texto de privacidad (Anexo A, **propuesto**) reutilizable en `/privacidad` y en la pantalla bloqueante. |
