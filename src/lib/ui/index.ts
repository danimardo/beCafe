// Punto de entrada único de los componentes de interfaz: import { Button, Glass, … } from '#lib/ui';

// Base
export { default as Glass } from './Glass.svelte';
export { default as Button } from './Button.svelte';
export { default as IconButton } from './IconButton.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Money } from './Money.svelte';
export { default as Avatar } from './Avatar.svelte';
export { default as Paginacion } from './Paginacion.svelte';
export { default as SegmentedControl } from './SegmentedControl.svelte';
export { default as TextField } from './TextField.svelte';
export { default as PasswordField } from './PasswordField.svelte';
export { default as MoneyField } from './MoneyField.svelte';
export { default as SelectField } from './SelectField.svelte';
export { default as Switch } from './Switch.svelte';
export { default as PhotoField } from './PhotoField.svelte';
export { default as CapsuleColorField } from './CapsuleColorField.svelte';
export { default as ColorField, capsulePresets } from './ColorField.svelte';
export { default as Sheet } from './Sheet.svelte';
export { default as ConfirmDialog } from './ConfirmDialog.svelte';
export { default as VoidDialog } from './VoidDialog.svelte';
export { default as ReauthDialog } from './ReauthDialog.svelte';
export { default as UndoToast } from './UndoToast.svelte';
export { default as ToastRegion } from './ToastRegion.svelte';
export { default as Banner } from './Banner.svelte';
export { default as EmptyState } from './EmptyState.svelte';
export { default as Skeleton } from './Skeleton.svelte';
export { default as ListRow } from './ListRow.svelte';
export { default as Pagination } from './Pagination.svelte';
export { default as Stepper } from './Stepper.svelte';
export { default as TourInicio } from './TourInicio.svelte';
export { default as OfertaAvisos } from './OfertaAvisos.svelte';
export { default as TarjetaInstalacion } from './TarjetaInstalacion.svelte';
export { default as AyudaPanel } from './AyudaPanel.svelte';
export { default as CounterField } from './CounterField.svelte';
export { default as CopyField } from './CopyField.svelte';
export { default as ThemeToggle } from './ThemeToggle.svelte';

// Dominio (cápsulas, saldos, estadísticas)
export { default as CapsuleImage } from './CapsuleImage.svelte';
export { default as CapsuleIllustration } from './CapsuleIllustration.svelte';
export { default as CapsuleRow } from './CapsuleRow.svelte';
export { default as CapsuleTile } from './CapsuleTile.svelte';
export { default as StockBadge } from './StockBadge.svelte';
export { default as AlertsPanel } from './AlertsPanel.svelte';
export { default as MovementRow } from './MovementRow.svelte';
export type { MovementKind } from './movimientos';
export { default as WaterRefillCard } from './WaterRefillCard.svelte';
export { default as MovementList } from './MovementList.svelte';
export { default as MovementDetailSheet } from './MovementDetailSheet.svelte';
export { default as RegularizationSummary } from './RegularizationSummary.svelte';
export type { Regularization, RegularizationResult } from './RegularizationSummary.svelte';
export { default as KpiTile } from './KpiTile.svelte';
export { default as BarChart } from './BarChart.svelte';
export { default as LineChart } from './LineChart.svelte';
export { default as StackedBarChart } from './StackedBarChart.svelte';
export { default as SplitBar } from './SplitBar.svelte';

// Mascota (Capsulito: Rive + respaldo SVG + sincronización labial, RF-185 a RF-188)
export { default as Capsulito } from './Capsulito.svelte';
export { default as Bienvenida } from './Bienvenida.svelte';

// Legal
export { default as PrivacyText } from './PrivacyText.svelte';

// Notificaciones (RF-107)
export { default as NotificationBell } from './NotificationBell.svelte';
export { default as NotificationPanel } from './NotificationPanel.svelte';
export { default as NotificationItem } from './NotificationItem.svelte';

// Estructura
export { default as AppShell } from './AppShell.svelte';
export { default as AppNav } from './AppNav.svelte';
export { default as PanelGrid } from './PanelGrid.svelte';
export { default as PageHeader } from './PageHeader.svelte';
export { default as Section } from './Section.svelte';
export { default as BrandMark } from './BrandMark.svelte';
export { default as BackLink } from './BackLink.svelte';
export { default as ErrorPage } from './ErrorPage.svelte';
export type { NavItem, ErrorKind } from './types';

// Movimientos (orientación de la interfaz; las reglas las decide el servidor)
export { kindLabels, kindGroups, voidPolicy, voidConsequence } from './movimientos';
export type { MovementDetail, Viewer } from './movimientos';

// Clases compartidas
export { cn, buttonClasses, colorCapsulaCss } from './utils';
export { opcionesFormulario } from './formularios';
export type { ButtonVariant, ButtonSize } from './utils';

// Contextos de estado: los crea el layout raíz y los leen los componentes
export { crearContextoTema, usarTema, type EstadoTema, type PreferenciaTema, type TemaResuelto } from './contextos/tema.svelte';
export { crearContextoAvisos, usarAvisos, type EstadoAvisos, type AvisoDeshacer } from './contextos/avisos.svelte';
export {
	crearContextoNotificaciones,
	usarNotificaciones,
	type EstadoNotificaciones,
	type AvisoRecibido,
	type TipoAviso,
} from './contextos/notificaciones.svelte';
export { crearContextoMascota, usarMascota, EstadoMascota } from './contextos/mascota.svelte';
