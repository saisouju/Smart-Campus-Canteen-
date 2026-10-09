import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { nextOrderStatus, type Order, type OrderStatus } from '@canteen/shared';
import { formatClock, formatCurrency } from '@/utils/format';
import { StatusChip } from '../StatusChip/StatusChip';

/** Verb shown on the button that moves an order out of each status. */
const ACTION_LABEL: Record<Exclude<OrderStatus, 'completed'>, string> = {
  placed: 'Start preparing',
  preparing: 'Mark ready',
  ready: 'Complete',
};

export interface OrderQueueTableProps {
  orders: Order[];
  /** Order ids with an in-flight status update. */
  pendingIds?: ReadonlySet<string>;
  onAdvance?: (orderId: string) => void;
  emptyMessage?: string;
}

export function OrderQueueTable({ orders, pendingIds, onAdvance, emptyMessage = 'No orders yet today.' }: OrderQueueTableProps) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Today's orders">
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Pickup</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" className="py-10 text-ink-muted">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => {
            const next = nextOrderStatus(order.status);
            return (
              <TableRow key={order.id} hover className={order.status === 'completed' ? 'opacity-60' : ''}>
                <TableCell>
                  <p className="font-mono text-xs font-semibold">{order.id}</p>
                  <p className="text-xs text-ink-muted">{formatClock(order.createdAt)}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">{order.userName}</TableCell>
                <TableCell className="min-w-48">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </TableCell>
                <TableCell className="whitespace-nowrap">{order.timeSlot}</TableCell>
                <TableCell align="right" className="tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <StatusChip status={order.status} />
                </TableCell>
                <TableCell align="right">
                  {next && order.status !== 'completed' ? (
                    <Button
                      size="small"
                      variant={order.status === 'ready' ? 'outlined' : 'contained'}
                      color={order.status === 'preparing' ? 'success' : 'primary'}
                      endIcon={<ArrowForwardRounded />}
                      loading={pendingIds?.has(order.id)}
                      onClick={() => onAdvance?.(order.id)}
                      className="whitespace-nowrap"
                    >
                      {ACTION_LABEL[order.status]}
                    </Button>
                  ) : (
                    <span className="text-xs text-ink-muted">Done</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
