import type { Order } from '@canteen/shared';
import { useEffect, useState } from 'react';
import { api } from '@/api';

export type LiveState = 'connecting' | 'live' | 'polling';

const POLL_MS = 5000;

/**
 * Live status for one order, refreshed by polling for serverless compatibility.
 */
export function useOrderTracking(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [live, setLive] = useState<LiveState>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrder(null);
    setError(null);
    if (!orderId) return;

    let pollTimer: number | undefined;
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await api.orders.track(orderId);
        if (!cancelled) {
          setOrder(next);
          setLive('live');
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Tracking failed');
          setLive('polling');
        }
      }
      if (!cancelled) pollTimer = window.setTimeout(poll, POLL_MS);
    };

    setLive('connecting');
    void poll();

    return () => {
      cancelled = true;
      window.clearTimeout(pollTimer);
    };
  }, [orderId]);

  return { order, live, error };
}
