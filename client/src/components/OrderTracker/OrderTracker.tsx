import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import type { StepIconProps } from '@mui/material/StepIcon';
import Button from '@mui/material/Button';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { buildOrderVerificationPayload, ORDER_STATUS_LABELS, ORDER_STATUSES, type Order, type OrderStatus } from '@canteen/shared';
import { formatClock, formatCurrency } from '@/utils/format';
import { LiveIndicator, type LiveIndicatorState } from '../LiveIndicator/LiveIndicator';
import { STATUS_META } from '../StatusChip/StatusChip';

const HEADLINES: Record<OrderStatus, { title: string; body: string }> = {
  placed: { title: 'Order received', body: 'The kitchen has your order and will start on it shortly.' },
  preparing: { title: 'Cooking now', body: 'Your food is being prepared fresh.' },
  ready: { title: 'Ready for pickup!', body: 'Head to the counter and show your order code.' },
  completed: { title: 'Enjoy your meal', body: 'Order collected. See you next time!' },
};

function TrackerStepIcon({ active, completed, icon }: StepIconProps) {
  const status = ORDER_STATUSES[Number(icon) - 1] ?? 'placed';
  const Icon = STATUS_META[status].icon;
  const tone = completed
    ? 'bg-brand text-white dark:text-stone-900'
    : active
      ? 'bg-brand text-white ring-4 ring-brand-soft dark:text-stone-900'
      : 'bg-line text-ink-muted';
  return (
    <span className={`relative flex size-10 items-center justify-center rounded-full transition-all duration-500 ${tone}`}>
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-25" />}
      <Icon fontSize="small" />
    </span>
  );
}

export interface OrderTrackerProps {
  order: Order;
  /** Connection state of the live stream; hidden when omitted. */
  live?: LiveIndicatorState;
}

/** Stepper visualising Placed ➔ Preparing ➔ Ready for Pickup ➔ Completed. */
export function OrderTracker({ order, live }: OrderTrackerProps) {
  const index = ORDER_STATUSES.indexOf(order.status);
  const qrPayload = useMemo(() => buildOrderVerificationPayload(order.id, order.verificationToken), [order.id, order.verificationToken]);
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);

  async function copyQrPayload() {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrPayload, { width: 220, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((src: string) => {
        if (!cancelled) setQrSrc(src);
      })
      .catch(() => {
        if (!cancelled) setQrSrc('');
      });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  // A completed order shows every step as done.
  const activeStep = order.status === 'completed' ? ORDER_STATUSES.length : index;
  const headline = HEADLINES[order.status];

  return (
    <Paper variant="outlined" className="overflow-hidden">
      <div className={`flex flex-wrap items-start justify-between gap-3 p-5 ${order.status === 'ready' ? 'bg-leaf-soft' : 'bg-brand-soft'}`}>
        <div aria-live="polite">
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">Order {order.id}</p>
          <h2 className="font-display text-2xl font-extrabold">{headline.title}</h2>
          <p className="text-sm text-ink-muted">{headline.body}</p>
        </div>
        {live && <LiveIndicator state={live} />}
      </div>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        className="px-2 py-6"
        sx={{
          '& .MuiStepConnector-root': { top: 20 },
          '& .MuiStepConnector-line': { borderTopWidth: 2, transition: 'border-color 400ms' },
          '& .Mui-active .MuiStepConnector-line, & .Mui-completed .MuiStepConnector-line': {
            borderColor: 'primary.main',
          },
        }}
      >
        {ORDER_STATUSES.map((status) => (
          <Step key={status}>
            <StepLabel slots={{ stepIcon: TrackerStepIcon }}>{ORDER_STATUS_LABELS[status]}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="border-t border-line p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ink-muted">Pickup slot</dt>
            <dd className="font-semibold">{order.timeSlot}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Placed at</dt>
            <dd className="font-semibold">{formatClock(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Items</dt>
            <dd className="font-semibold">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Total</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</dd>
          </div>
        </dl>

        <div className="mx-auto mt-6 flex w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white p-3 dark:bg-stone-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Pickup QR</p>
          {qrSrc ? (
            <img src={qrSrc} alt={`Verification QR for order ${order.id}`} className="h-36 w-36 rounded-xl border border-line bg-white p-2" />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-muted">
              Loading QR…
            </div>
          )}
          <div className="w-full rounded-xl border border-line bg-stone-50 p-2 dark:bg-stone-900">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">QR payload</p>
            <code className="block break-all text-[10px] text-ink-muted">{qrPayload}</code>
          </div>
          <Button size="small" variant="outlined" startIcon={<ContentCopyRounded />} onClick={copyQrPayload}>
            {copied ? 'Copied!' : 'Copy QR'}
          </Button>
          <p className="text-center text-[11px] text-ink-muted">Copy the QR text and paste it into the admin verification box.</p>
        </div>
      </div>
    </Paper>
  );
}
