/**
 * The UI kit. Every export here has a matching *.stories.tsx and is browsable
 * in Storybook (`npm run storybook`). Feature screens compose these components
 * instead of writing new markup, so what you review in Storybook is exactly
 * what ships.
 *
 * Charts live in '@/components/charts' (separate entry) so Recharts is only
 * downloaded by screens that draw charts.
 */
export { AdminAccessPanel, type AdminAccessPanelProps } from './AdminAccessPanel/AdminAccessPanel';
export { CATEGORY_META } from './categoryMeta';
export { CartSummary, type CartSummaryLine, type CartSummaryProps } from './CartSummary/CartSummary';
export { FlowSteps } from './FlowSteps/FlowSteps';
export { CategoryTabs, type CategoryFilter, type CategoryTabsProps } from './CategoryTabs/CategoryTabs';
export { ChartCard, type ChartCardProps, type ChartTable } from './ChartCard/ChartCard';
export { IntroSequence, INTRO_DURATION_MS, type IntroSequenceProps } from './IntroSequence/IntroSequence';
export { LiveIndicator, type LiveIndicatorState } from './LiveIndicator/LiveIndicator';
export { MenuAvailabilityList, type MenuAvailabilityListProps } from './MenuAvailabilityList/MenuAvailabilityList';
export { MenuCard, type MenuCardProps } from './MenuCard/MenuCard';
export { MenuItemFormDialog, type MenuItemFormDialogProps } from './MenuItemFormDialog/MenuItemFormDialog';
export { OrderConfirmationDialog, type OrderConfirmationDialogProps } from './OrderConfirmationDialog/OrderConfirmationDialog';
export { OrderQueueTable, type OrderQueueTableProps } from './OrderQueueTable/OrderQueueTable';
export { OrderTracker, type OrderTrackerProps } from './OrderTracker/OrderTracker';
export { QuantityStepper, type QuantityStepperProps } from './QuantityStepper/QuantityStepper';
export { RoleSwitcher, type RoleSwitcherProps, type RoleView } from './RoleSwitcher/RoleSwitcher';
export { AUTH_ERROR_MESSAGES, SignInCard, type SignInCardProps } from './SignInCard/SignInCard';
export { StatCard, type StatCardProps } from './StatCard/StatCard';
export { STATUS_META, StatusChip, type StatusChipProps } from './StatusChip/StatusChip';
export { TopCustomersTable, type TopCustomersTableProps } from './TopCustomersTable/TopCustomersTable';
export { TimeSlotSelect, type TimeSlotSelectProps } from './TimeSlotSelect/TimeSlotSelect';
export { UserMenu, type UserMenuProps } from './UserMenu/UserMenu';
