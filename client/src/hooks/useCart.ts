import type { MenuItem } from '@canteen/shared';
import { useCallback, useMemo, useState } from 'react';

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

const MAX_QTY = 20;

/** Cart keyed by menu item id; lines are derived from the live menu so prices stay current. */
export function useCart(menu: MenuItem[] | undefined) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQuantity = useCallback((id: string, quantity: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(MAX_QTY, quantity));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  }, []);

  const lines = useMemo<CartLine[]>(() => {
    if (!menu) return [];
    return menu
      .filter((item) => quantities[item.id])
      .map((item) => ({ item, quantity: quantities[item.id]! }));
  }, [menu, quantities]);

  const total = lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return {
    lines,
    total,
    count,
    quantityOf: (id: string) => quantities[id] ?? 0,
    add: (id: string) => setQuantity(id, (quantities[id] ?? 0) + 1),
    setQuantity,
    clear: () => setQuantities({}),
  };
}

export type Cart = ReturnType<typeof useCart>;
