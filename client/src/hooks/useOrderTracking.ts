import type { Order } from '@canteen/shared';
import { useEffect, useState } from 'react';
import { api } from '@/api';

export type LiveState = 'connecting' | 'live' | 'polling';

const POLL_MS = 5000;

/**
 * Live status for one order. Uses the SSE stream; if the stream fails
 * (proxy, network), falls back to polling GET /api/orders/track/:id.
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
        if (!cancelled) setOrder(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Tracking failed');
      }
      if (!cancelled) pollTimer = window.setTimeout(poll, POLL_MS);
    };

    setLive('connecting');
    const source = new EventSource(api.orders.streamUrl(orderId), { withCredentials: true });
    source.addEventListener('status', (e) => {
      setOrder(JSON.parse((e as MessageEvent<string>).data) as Order);
      setLive('live');
    });
    source.onerror = () => {
      source.close();
      if (cancelled) return;
      setLive('polling');
      void poll();
    };

    return () => {
      cancelled = true;
      source.close();
      window.clearTimeout(pollTimer);
    };
  }, [orderId]);

  return { order, live, error };
}
