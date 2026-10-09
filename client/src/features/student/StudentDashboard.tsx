import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTemperatureStatusLabel, MENU_CATEGORIES, type CanteenTemperature, type User } from '@canteen/shared';
import { api, errorMessage } from '@/api';
import {
  CartSummary,
  CategoryTabs,
  FlowSteps,
  MenuCard,
  OrderConfirmationDialog,
  OrderTracker,
  StatusChip,
  TimeSlotSelect,
  type CategoryFilter,
} from '@/components';
import { useCart } from '@/hooks/useCart';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useResource } from '@/hooks/useResource';
import { firstName, formatClock, formatCurrency } from '@/utils/format';


const SLOT_REFRESH_MS = 60_000;
const trackingKey = (userId: string) => `canteen.tracking.${userId}`;

function readTracked(userId: string): string | null {
  try {
    return localStorage.getItem(trackingKey(userId));
  } catch {
    return null;
  }
}

/** Menu ➔ Time slot ➔ Confirmation ➔ Live tracking. Remount (key) per user to reset the cart. */
export function StudentDashboard({ user }: { user: User }) {
  const menu = useResource(api.menu.list, []);
  const slots = useResource(api.orders.timeSlots, []);
  const myOrders = useResource(api.orders.mine, [user.id]);
  const cart = useCart(menu.data);

  const [category, setCategory] = useState<CategoryFilter>('All');
  const [slotId, setSlotId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [trackedId, setTrackedId] = useState<string | null>(() => readTracked(user.id));
  const [temperature, setTemperature] = useState<CanteenTemperature | null>(null);
  const tracking = useOrderTracking(trackedId);
  const trackerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let closed = false;
    let source: EventSource | null = null;

    const load = async () => {
      const current = await api.temperature.current();
      if (!closed) setTemperature(current);
    };

    void load();
    source = new EventSource(api.temperature.streamUrl());
    source.addEventListener('temperature', (event: MessageEvent<string>) => {
      if (closed) return;
      setTemperature(JSON.parse(event.data) as CanteenTemperature);
    });

    return () => {
      closed = true;
      source?.close();
    };
  }, []);

  // Keep slot capacity fresh while the page is open.
  useEffect(() => {
    const t = window.setInterval(() => void slots.reload(), SLOT_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [slots.reload]);

  useEffect(() => {
    const source = new EventSource(api.orders.mineStreamUrl(), { withCredentials: true });
    source.addEventListener('change', () => void myOrders.reload());
    const refresh = window.setInterval(() => void myOrders.reload(), 15_000);
    return () => {
      source.close();
      window.clearInterval(refresh);
    };
  }, [myOrders.reload]);

  // With nothing remembered, follow the newest active order.
  useEffect(() => {
    if (trackedId || !myOrders.data) return;
    const active = myOrders.data.find((o) => o.status !== 'completed');
    if (active) setTrackedId(active.id);
  }, [myOrders.data, trackedId]);

  useEffect(() => {
    try {
      if (trackedId) localStorage.setItem(trackingKey(user.id), trackedId);
    } catch {
      /* non-critical */
    }
  }, [trackedId, user.id]);

  // Reflect live status changes in the "Recent orders" list.
  const liveStatus = tracking.order?.status;
  useEffect(() => {
    if (liveStatus) void myOrders.reload();
  }, [liveStatus, myOrders.reload]);

  const counts = useMemo(() => {
    const items = menu.data ?? [];
    const c: Partial<Record<CategoryFilter, number>> = { All: items.length };
    for (const cat of MENU_CATEGORIES) c[cat] = items.filter((i) => i.category === cat).length;
    return c;
  }, [menu.data]);

  const visible = (menu.data ?? []).filter((i) => category === 'All' || i.category === category);
  const selectedSlot = slots.data?.find((s) => s.id === slotId && s.available);
  const step = trackedId && tracking.order?.status !== 'completed' && cart.count === 0 ? 4 : confirmOpen ? 3 : cart.count > 0 ? 2 : 1;

  async function placeOrder() {
    if (!selectedSlot) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const order = await api.orders.place({
        timeSlotId: selectedSlot.id,
        items: cart.lines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity })),
      });
      cart.clear();
      setSlotId('');
      setConfirmOpen(false);
      setTrackedId(order.id);
      setToast(`Order ${order.id} placed for ${order.timeSlot}`);
      void myOrders.reload();
      void slots.reload();
      requestAnimationFrame(() => trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      setPlaceError(errorMessage(e));
      void slots.reload();
      void menu.reload();
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">Hi {firstName(user.name)} 👋</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">What are you craving today?</h1>
        </div>
        <FlowSteps active={step} />
      </header>

      <Paper variant="outlined" className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-ink-muted uppercase">Canteen temperature</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{temperature ? `${temperature.celsius.toFixed(1)}°C` : '--°C'}</span>
            <span className="text-sm text-ink-muted">{temperature ? getTemperatureStatusLabel(temperature.celsius) : 'Updating…'}</span>
          </div>
        </div>
        <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          {temperature?.source === 'hardware' ? 'Hardware sensor' : 'Live sensor feed'}
        </div>
      </Paper>

      {trackedId && (
        <div ref={trackerRef} className="scroll-mt-24">
          {tracking.order ? (
            <OrderTracker order={tracking.order} live={tracking.live} />
          ) : tracking.error ? (
            <Alert severity="warning" onClose={() => setTrackedId(null)}>
              Couldn't load order {trackedId}: {tracking.error}
            </Alert>
          ) : (
            <Skeleton variant="rounded" height={260} />
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Menu" className="flex min-w-0 flex-col gap-4">
          <Paper variant="outlined" className="px-2">
            <CategoryTabs value={category} onChange={setCategory} counts={counts} />
          </Paper>

          {menu.error && <Alert severity="error">Menu unavailable: {menu.error}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {menu.loading && !menu.data
              ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={230} />)
              : visible.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={cart.quantityOf(item.id)}
                  onAdd={(i) => cart.add(i.id)}
                  onQuantityChange={(i, q) => cart.setQuantity(i.id, q)}
                />
              ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <CartSummary
            lines={cart.lines}
            total={cart.total}
            onQuantityChange={(i, q) => cart.setQuantity(i.id, q)}
            onClear={cart.clear}
            footer={
              <div className="flex flex-col gap-3">
                <TimeSlotSelect
                  slots={slots.data ?? []}
                  value={slotId}
                  onChange={setSlotId}
                  loading={slots.loading && !slots.data}
                  error={slots.error}
                  disabled={cart.count === 0}
                />
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardRounded />}
                  disabled={cart.count === 0 || !selectedSlot}
                  onClick={() => {
                    setPlaceError(null);
                    setConfirmOpen(true);
                  }}
                >
                  {cart.count === 0 ? 'Add items to continue' : !selectedSlot ? 'Choose a pickup slot' : 'Review order'}
                </Button>
              </div>
            }
          />

          {myOrders.data && myOrders.data.length > 0 && (
            <Paper variant="outlined" className="p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Recent orders</h2>
              <ul className="flex flex-col gap-1">
                {myOrders.data.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setTrackedId(o.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand-soft ${o.id === trackedId ? 'bg-brand-soft' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-semibold">{o.id}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          {formatClock(o.createdAt)} · {formatCurrency(o.totalAmount)}
                        </span>
                      </span>
                      <StatusChip status={o.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </Paper>
          )}
        </aside>
      </div>

      <OrderConfirmationDialog
        open={confirmOpen}
        lines={cart.lines}
        total={cart.total}
        slotLabel={selectedSlot?.label ?? ''}
        customerName={user.name}
        placing={placing}
        error={placeError}
        onConfirm={placeOrder}
        onClose={() => setConfirmOpen(false)}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
}
