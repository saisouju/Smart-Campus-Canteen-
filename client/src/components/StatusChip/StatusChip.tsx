import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import Chip, { type ChipProps } from '@mui/material/Chip';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@canteen/shared';

/** Status is never signalled by color alone: every state carries an icon and a label. */
export const STATUS_META: Record<OrderStatus, { color: ChipProps['color']; icon: SvgIconComponent }> = {
  placed: { color: 'info', icon: ReceiptLongRounded },
  preparing: { color: 'warning', icon: LocalFireDepartmentRounded },
  ready: { color: 'success', icon: NotificationsActiveRounded },
  completed: { color: 'default', icon: CheckCircleRounded },
};

export interface StatusChipProps {
  status: OrderStatus;
  size?: ChipProps['size'];
}

export function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const { color, icon: Icon } = STATUS_META[status];
  return (
    <Chip
      size={size}
      color={color}
      variant={status === 'completed' ? 'outlined' : 'filled'}
      icon={<Icon />}
      label={ORDER_STATUS_LABELS[status]}
    />
  );
}
