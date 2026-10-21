// Punto de entrada único del sistema de diseño: import { Button, Glass, … } from '#lib';

// UI base
export { default as Glass } from './components/ui/Glass.svelte';
export { default as Button } from './components/ui/Button.svelte';
export { default as IconButton } from './components/ui/IconButton.svelte';
export { default as Badge } from './components/ui/Badge.svelte';
export { default as Money } from './components/ui/Money.svelte';
export { default as Avatar } from './components/ui/Avatar.svelte';
export { default as SegmentedControl } from './components/ui/SegmentedControl.svelte';
export { default as TextField } from './components/ui/TextField.svelte';
export { default as PasswordField } from './components/ui/PasswordField.svelte';
export { default as MoneyField } from './components/ui/MoneyField.svelte';
export { default as SelectField } from './components/ui/SelectField.svelte';
export { default as Switch } from './components/ui/Switch.svelte';
export { default as PhotoField } from './components/ui/PhotoField.svelte';
export { default as ColorField, capsulePresets } from './components/ui/ColorField.svelte';
export { default as Sheet } from './components/ui/Sheet.svelte';
export { default as ConfirmDialog } from './components/ui/ConfirmDialog.svelte';
export { default as VoidDialog } from './components/ui/VoidDialog.svelte';
export { default as ReauthDialog } from './components/ui/ReauthDialog.svelte';
export { default as UndoToast } from './components/ui/UndoToast.svelte';
export { default as ToastRegion } from './components/ui/ToastRegion.svelte';
export { default as Banner } from './components/ui/Banner.svelte';
export { default as EmptyState } from './components/ui/EmptyState.svelte';
export { default as Skeleton } from './components/ui/Skeleton.svelte';
export { default as ListRow } from './components/ui/ListRow.svelte';
export { default as Pagination } from './components/ui/Pagination.svelte';
export { default as Stepper } from './components/ui/Stepper.svelte';
export { default as CopyField } from './components/ui/CopyField.svelte';
export { default as ThemeToggle } from './components/ui/ThemeToggle.svelte';

// Dominio (cápsulas, saldos, estadísticas)
export { default as CapsuleImage } from './components/capsulas/CapsuleImage.svelte';
export { default as CapsuleRow } from './components/capsulas/CapsuleRow.svelte';
export { default as StockBadge } from './components/capsulas/StockBadge.svelte';
export { default as AlertsPanel } from './components/capsulas/AlertsPanel.svelte';
export { default as MovementRow } from './components/capsulas/MovementRow.svelte';
export type { MovementKind } from './components/capsulas/MovementRow.svelte';
export { default as WaterRefillCard } from './components/capsulas/WaterRefillCard.svelte';
export { default as MovementList } from './components/capsulas/MovementList.svelte';
export { default as MovementDetailSheet } from './components/capsulas/MovementDetailSheet.svelte';
export { default as RegularizationSummary } from './components/capsulas/RegularizationSummary.svelte';
export type { Regularization, RegularizationResult } from './components/capsulas/RegularizationSummary.svelte';
export { default as KpiTile } from './components/capsulas/KpiTile.svelte';
export { default as BarChart } from './components/capsulas/BarChart.svelte';
export { default as SplitBar } from './components/capsulas/SplitBar.svelte';

// Legal
export { default as PrivacyText } from './components/legal/PrivacyText.svelte';

// Notificaciones (RF-107)
export { default as NotificationBell } from './components/notificaciones/NotificationBell.svelte';
export { default as NotificationPanel } from './components/notificaciones/NotificationPanel.svelte';
export { default as NotificationItem } from './components/notificaciones/NotificationItem.svelte';

// Estructura
export { default as AppShell } from './components/layout/AppShell.svelte';
export { default as AppNav } from './components/layout/AppNav.svelte';
export { default as PageHeader } from './components/layout/PageHeader.svelte';
export { default as Section } from './components/layout/Section.svelte';
export { default as BrandMark } from './components/layout/BrandMark.svelte';
export { default as BackLink } from './components/layout/BackLink.svelte';
export { default as ErrorPage } from './components/layout/ErrorPage.svelte';
export type { NavItem, ErrorKind } from './components/layout/types';

// Utilidades y estado
export { kindLabels, kindGroups, voidPolicy, voidConsequence } from './movements';
export type { MovementDetail, Viewer } from './movements';
export { cn, formatMoney, formatMoneyPlain, parseMoney, formatUnitCost, formatDate, initials, buttonClasses } from './utils';
export { theme } from './theme.svelte';
export { toasts } from './toast.svelte';
export { notifications } from './notifications.svelte';
export type { AppNotification, NotificationKind } from './notifications.svelte';
