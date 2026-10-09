import type { Order, OrderStatus } from '@canteen/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '@/api';
import type { LiveState } from './useOrderTracking';

const sortQueue = (orders: Order[]) =>
  [...orders].sort((a, b) => {
    const aDone = a.status === 'completed' ? 1 : 0;
    const bDone = b.status === 'completed' ? 1 : 0;
    return aDone - bDone || a.createdAt.localeCompare(b.createdAt);
  });

/**
 * Today's order queue kept in sync over SSE. `onChange` fires on every pushed
 * event so the dashboard can refresh dependent data (e.g. analytics).
 */
export function useAdminOrderQueue(adminId: string, onChange?: () => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>('connecting');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const upsert = useCallback((order: Order) => {
    setOrders((prev) => sortQueue([...prev.filter((o) => o.id !== order.id), order]));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setOrders(sortQueue(await api.admin.todaysOrders()));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const source = new EventSource(api.admin.streamUrl(), { withCredentials: true });
    const handle = (e: Event) => {
      upsert(JSON.parse((e as MessageEvent<string>).data) as Order);
      onChangeRef.current?.();
    };
    source.addEventListener('ready', () => setLive('live'));
    source.addEventListener('created', handle);
    source.addEventListener('updated', handle);
    // EventSource reconnects on its own; resync once it's back so nothing is missed.
    source.onerror = () => setLive('connecting');
    source.onopen = () => void refresh();
    return () => source.close();
  }, [adminId, refresh, upsert]);

  const setStatus = useCallback(
    async (id: string, status?: OrderStatus) => {
      setPendingIds((s) => new Set(s).add(id));
      try {
        upsert(await api.admin.setStatus(id, status));
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setPendingIds((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [upsert],
  );

  return { orders, loading, error, live, pendingIds, advance: (id: string) => setStatus(id), refresh };
}
