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
 * Today's order queue is polled for serverless compatibility. `onChange` fires
 * when a refreshed queue differs so dependent data can be reloaded.
 */
export function useAdminOrderQueue(adminId: string, onChange?: () => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>('connecting');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const onChangeRef = useRef(onChange);
  const snapshotRef = useRef('');
  onChangeRef.current = onChange;

  const upsert = useCallback((order: Order) => {
    setOrders((prev) => sortQueue([...prev.filter((o) => o.id !== order.id), order]));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = sortQueue(await api.admin.todaysOrders());
      const snapshot = next.map((order) => `${order.id}:${order.status}`).join('|');
      if (snapshotRef.current && snapshotRef.current !== snapshot) onChangeRef.current?.();
      snapshotRef.current = snapshot;
      setOrders(next);
      setError(null);
      setLive('live');
    } catch (e) {
      setError(errorMessage(e));
      setLive('polling');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [adminId, refresh, upsert]);

  const setStatus = useCallback(
    async (id: string, status?: OrderStatus) => {
      setPendingIds((s) => new Set(s).add(id));
      try {
        upsert(await api.admin.setStatus(id, status));
        setError(null);
        onChangeRef.current?.();
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
