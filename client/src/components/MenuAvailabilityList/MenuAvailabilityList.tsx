import Switch from '@mui/material/Switch';
import { MENU_CATEGORIES, type MenuItem } from '@canteen/shared';
import { formatCurrency } from '@/utils/format';
import { CATEGORY_META } from '../categoryMeta';

export interface MenuAvailabilityListProps {
  items: MenuItem[];
  onToggle?: (item: MenuItem, isAvailable: boolean) => void;
  pendingIds?: ReadonlySet<string>;
}

/** Compact, category-grouped list with an availability switch per dish. */
export function MenuAvailabilityList({ items, onToggle, pendingIds }: MenuAvailabilityListProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {MENU_CATEGORIES.map((category) => {
        const inCategory = items.filter((i) => i.category === category);
        if (inCategory.length === 0) return null;
        const Icon = CATEGORY_META[category].icon;
        return (
          <section key={category}>
            <h4 className="mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-muted uppercase">
              <Icon fontSize="inherit" /> {category}
            </h4>
            <ul className="divide-y divide-line">
              {inCategory.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className={`min-w-0 truncate text-sm ${item.isAvailable ? '' : 'text-ink-muted line-through'}`}>
                    {item.name}
                  </span>
                  <span className="ml-auto text-sm text-ink-muted tabular-nums">{formatCurrency(item.price)}</span>
                  <Switch
                    size="small"
                    checked={item.isAvailable}
                    disabled={pendingIds?.has(item.id)}
                    onChange={(e) => onToggle?.(item, e.target.checked)}
                    slotProps={{ input: { 'aria-label': `${item.name} available` } }}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
