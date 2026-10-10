import AddRounded from '@mui/icons-material/AddRounded';
import CurrencyRupeeRounded from '@mui/icons-material/CurrencyRupeeRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import ShoppingBasketRounded from '@mui/icons-material/ShoppingBasketRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTemperatureStatusLabel, type AdminEmail, type CanteenTemperature, type MenuItem, type NewMenuItem, type User } from '@canteen/shared';
import { api, errorMessage } from '@/api';
import {
  AdminAccessPanel,
  LiveIndicator,
  MenuAvailabilityList,
  MenuItemFormDialog,
  OrderQueueTable,
  StatCard,
  TopCustomersTable,
} from '@/components';
import { PopularItemsChart, WeeklyEarningsChart } from '@/components/charts';
import { useAdminOrderQueue } from '@/hooks/useAdminOrderQueue';
import { useResource } from '@/hooks/useResource';
import { formatCurrency } from '@/utils/format';

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function AdminDashboard({ admin }: { admin: User }) {
  const analytics = useResource(api.admin.analytics, [admin.id]);
  const menu = useResource(api.menu.list, []);
  const [topLimit, setTopLimit] = useState<5 | 10>(10);
  const topCustomers = useResource(() => api.admin.topCustomers(topLimit), [topLimit]);
  const admins = useResource(api.admin.admins, []);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<CanteenTemperature | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [verification, setVerification] = useState<{ valid: boolean; message: string } | null>(null);
  const [verifyingQr, setVerifyingQr] = useState(false);

  useEffect(() => {
    let closed = false;

    const load = async () => {
      try {
        const current = await api.temperature.current();
        if (!closed) setTemperature(current);
      } catch {
        // Keep the latest reading visible during temporary network failures.
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 5000);

    return () => {
      closed = true;
      window.clearInterval(timer);
    };
  }, []);

  // Refresh analytics shortly after live order events (debounced so bursts cost one request).
  const reloadTimer = useRef<number | undefined>(undefined);
  const scheduleAnalyticsReload = () => {
    window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => {
      void analytics.reload();
      void topCustomers.reload();
    }, 800);
  };
  const queue = useAdminOrderQueue(admin.id, scheduleAnalyticsReload);

  const [queueFilter, setQueueFilter] = useState<'active' | 'all'>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const activeOrders = useMemo(() => queue.orders.filter((o) => o.status !== 'completed'), [queue.orders]);
  const shownOrders = queueFilter === 'active' ? activeOrders : queue.orders;
  const totals = analytics.data?.totals;

  async function addItem(item: NewMenuItem) {
    setSaving(true);
    setSaveError(null);
    try {
      const created = await api.menu.create(item);
      menu.setData((list) => [...(list ?? []), created]);
      setDialogOpen(false);
      setToast(`${created.name} added to the menu`);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function changeAdmins(action: () => Promise<AdminEmail[]>, success: string): Promise<boolean> {
    setAdminBusy(true);
    setAdminError(null);
    try {
      admins.setData(await action());
      setToast(success);
      return true;
    } catch (e) {
      setAdminError(errorMessage(e));
      return false;
    } finally {
      setAdminBusy(false);
    }
  }

  async function toggleAvailability(item: MenuItem, isAvailable: boolean) {
    setTogglingIds((s) => new Set(s).add(item.id));
    // Optimistic update; rolled back on failure.
    menu.setData((list) => list?.map((m) => (m.id === item.id ? { ...m, isAvailable } : m)));
    try {
      await api.menu.update(item.id, { isAvailable });
    } catch (e) {
      menu.setData((list) => list?.map((m) => (m.id === item.id ? item : m)));
      setToast(`Couldn't update ${item.name}: ${errorMessage(e)}`);
    } finally {
      setTogglingIds((s) => {
        const next = new Set(s);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function verifyQrCode() {
    const trimmed = qrCode.trim();
    if (!trimmed) {
      setVerification({ valid: false, message: 'Paste or scan a QR code first.' });
      return;
    }

    setVerifyingQr(true);
    setVerification(null);
    try {
      const result = await api.admin.verifyQr(trimmed);
      setVerification({ valid: result.valid, message: result.message });
      if (result.valid) setToast(`Verified: ${result.userName} (${result.orderId})`);
    } catch (e) {
      setVerification({ valid: false, message: errorMessage(e) });
    } finally {
      setVerifyingQr(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-brand">Canteen admin</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Today at the counter</h1>
        {analytics.data && (
          <p className="text-sm text-ink-muted">
            Week of {shortDate(analytics.data.weekStart)} – {shortDate(analytics.data.weekEnd)}
          </p>
        )}
      </header>

      {analytics.error && <Alert severity="error">Analytics unavailable: {analytics.error}</Alert>}

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

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totals ? (
          <>
            <StatCard label="Revenue this week" value={formatCurrency(totals.weekRevenue)} icon={CurrencyRupeeRounded} />
            <StatCard label="Orders this week" value={String(totals.weekOrders)} icon={ReceiptLongRounded} />
            <StatCard label="Average order" value={formatCurrency(totals.averageOrderValue)} icon={ShoppingBasketRounded} />
            <StatCard
              label="Active orders now"
              value={String(activeOrders.length)}
              hint="Placed, preparing or awaiting pickup"
              icon={LocalFireDepartmentRounded}
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={112} />)
        )}
      </section>

      <section aria-label="Weekly analytics" className="grid gap-4 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          {analytics.data ? <WeeklyEarningsChart data={analytics.data.weeklyEarnings} /> : <Skeleton variant="rounded" height={360} />}
        </div>
        <div className="min-w-0 xl:col-span-2">
          {analytics.data ? <PopularItemsChart data={analytics.data.popularItems} /> : <Skeleton variant="rounded" height={360} />}
        </div>
      </section>

      <Paper variant="outlined" component="section" aria-label="Live order queue" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold">Live order queue</h2>
            <LiveIndicator state={queue.live} />
          </div>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={queueFilter}
            onChange={(_, v) => v && setQueueFilter(v)}
            aria-label="Filter orders"
          >
            <ToggleButton value="active">Active · {activeOrders.length}</ToggleButton>
            <ToggleButton value="all">All today · {queue.orders.length}</ToggleButton>
          </ToggleButtonGroup>
        </div>
        {queue.error && (
          <Alert severity="error" className="mx-5 mb-3">
            {queue.error}
          </Alert>
        )}
        {queue.loading ? (
          <div className="p-5">
            <Skeleton variant="rounded" height={200} />
          </div>
        ) : (
          <OrderQueueTable
            orders={shownOrders}
            pendingIds={queue.pendingIds}
            onAdvance={queue.advance}
            emptyMessage={queueFilter === 'active' ? 'All caught up — no active orders.' : 'No orders yet today.'}
          />
        )}
      </Paper>

      <Paper variant="outlined" component="section" aria-label="Top customers" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Top customers</h2>
            <p className="text-sm text-ink-muted">All-time, ranked by items ordered</p>
          </div>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={topLimit}
            onChange={(_, v: 5 | 10 | null) => v && setTopLimit(v)}
            aria-label="How many customers to show"
          >
            <ToggleButton value={5}>Top 5</ToggleButton>
            <ToggleButton value={10}>Top 10</ToggleButton>
          </ToggleButtonGroup>
        </div>
        {topCustomers.error && (
          <Alert severity="error" className="mx-5 mb-3">
            {topCustomers.error}
          </Alert>
        )}
        {topCustomers.data ? (
          <TopCustomersTable customers={topCustomers.data} />
        ) : (
          <div className="p-5">
            <Skeleton variant="rounded" height={240} />
          </div>
        )}
      </Paper>

      <Paper variant="outlined" component="section" aria-label="Order verification" className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-xl font-bold">Order verification</h2>
          <p className="text-sm text-ink-muted">Scan or paste a customer QR code to confirm it matches the same pickup order.</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <TextField
            fullWidth
            label="Paste copied QR payload"
            value={qrCode}
            onChange={(event) => setQrCode(event.target.value)}
            placeholder="canteen://verify/ORD-ABC123/…"
            helperText="Copy the QR text from the student's order screen and paste it here to verify pickup."
          />
          <Button variant="contained" onClick={verifyQrCode} disabled={verifyingQr}>
            {verifyingQr ? 'Verifying…' : 'Verify pickup'}
          </Button>
        </div>

        {verification && (
          <Alert severity={verification.valid ? 'success' : 'error'}>{verification.message}</Alert>
        )}
      </Paper>

      <Paper variant="outlined" component="section" aria-label="Menu management" className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Menu management</h2>
            <p className="text-sm text-ink-muted">Toggle availability instantly; students see changes on their next refresh.</p>
          </div>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => {
              setSaveError(null);
              setDialogOpen(true);
            }}
          >
            Add menu item
          </Button>
        </div>
        {menu.error && <Alert severity="error">{menu.error}</Alert>}
        {menu.data ? (
          <MenuAvailabilityList items={menu.data} onToggle={toggleAvailability} pendingIds={togglingIds} />
        ) : (
          <Skeleton variant="rounded" height={240} />
        )}
      </Paper>

      <Paper variant="outlined" component="section" aria-label="Admin access" className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-xl font-bold">Admin access</h2>
          <p className="text-sm text-ink-muted">
            People on this list get the admin dashboard when they sign in with Google. Changes apply immediately.
          </p>
        </div>
        {admins.error && <Alert severity="error">{admins.error}</Alert>}
        {admins.data ? (
          <AdminAccessPanel
            admins={admins.data}
            currentEmail={admin.email}
            busy={adminBusy}
            error={adminError}
            onAdd={(email) => changeAdmins(() => api.admin.addAdmin(email), `${email} is now an admin`)}
            onRemove={(email) => changeAdmins(() => api.admin.removeAdmin(email), `${email} is no longer an admin`)}
          />
        ) : (
          <Skeleton variant="rounded" height={160} />
        )}
      </Paper>

      <MenuItemFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={addItem}
        submitting={saving}
        error={saveError}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
}
