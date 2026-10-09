import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';
import type { MenuItem } from '@canteen/shared';
import { formatCurrency, pluralize } from '@/utils/format';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';

export interface CartSummaryLine {
  item: MenuItem;
  quantity: number;
}

export interface CartSummaryProps {
  lines: CartSummaryLine[];
  total: number;
  onQuantityChange?: (item: MenuItem, quantity: number) => void;
  onClear?: () => void;
  /** Slot for checkout controls (time slot select, place-order button). */
  footer?: ReactNode;
}

export function CartSummary({ lines, total, onQuantityChange, onClear, footer }: CartSummaryProps) {
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <Paper variant="outlined" className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <ShoppingBagOutlined className="text-brand" /> Your order
        </h2>
        {lines.length > 0 && onClear && (
          <Button size="small" color="inherit" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
          Your cart is empty. Add something tasty from the menu.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lines.map(({ item, quantity }) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.name}</p>
                <p className="text-xs text-ink-muted tabular-nums">
                  {formatCurrency(item.price)} × {quantity} = {formatCurrency(item.price * quantity)}
                </p>
              </div>
              <QuantityStepper value={quantity} label={item.name} onChange={(q) => onQuantityChange?.(item, q)} />
            </li>
          ))}
        </ul>
      )}

      <Divider />
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">{pluralize(count, 'item')}</span>
        <span className="font-display text-2xl font-extrabold tabular-nums">{formatCurrency(total)}</span>
      </div>
      {footer}
    </Paper>
  );
}
