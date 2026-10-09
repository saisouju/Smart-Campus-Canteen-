import AddShoppingCartRounded from '@mui/icons-material/AddShoppingCartRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import type { MenuItem } from '@canteen/shared';
import { formatCurrency } from '@/utils/format';
import { CATEGORY_META } from '../categoryMeta';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';

export interface MenuCardProps {
  item: MenuItem;
  /** How many of this item are already in the cart. */
  quantity?: number;
  onAdd?: (item: MenuItem) => void;
  onQuantityChange?: (item: MenuItem, quantity: number) => void;
}

export function MenuCard({ item, quantity = 0, onAdd, onQuantityChange }: MenuCardProps) {
  const { icon: Icon, tile } = CATEGORY_META[item.category];
  const soldOut = !item.isAvailable;

  return (
    <Card
      className={`flex h-full flex-col transition-shadow duration-200 hover:shadow-lg ${soldOut ? 'opacity-60' : ''} ${quantity > 0 ? 'ring-2 ring-brand' : ''}`}
    >
      <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${tile}`}>
        <Icon sx={{ fontSize: 52 }} aria-hidden />
        {soldOut && <Chip label="Sold out" size="small" color="default" className="absolute top-3 right-3" />}
        {quantity > 0 && (
          <Chip label={`${quantity} in cart`} size="small" color="primary" className="absolute top-3 right-3" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg leading-tight font-bold text-ink">{item.name}</h3>
            <p className="text-xs tracking-wide text-ink-muted uppercase">{item.category}</p>
          </div>
          <span className="font-display text-lg font-bold text-brand tabular-nums">{formatCurrency(item.price)}</span>
        </div>

        <div className="mt-auto">
          {quantity > 0 ? (
            <QuantityStepper value={quantity} label={item.name} onChange={(q) => onQuantityChange?.(item, q)} />
          ) : (
            <Button
              fullWidth
              variant={soldOut ? 'outlined' : 'contained'}
              disabled={soldOut}
              startIcon={<AddShoppingCartRounded />}
              onClick={() => onAdd?.(item)}
            >
              {soldOut ? 'Unavailable' : 'Add to cart'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
