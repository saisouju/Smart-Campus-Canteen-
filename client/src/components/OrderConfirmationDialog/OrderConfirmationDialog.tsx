import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import type { CartSummaryLine } from '../CartSummary/CartSummary';
import { formatCurrency } from '@/utils/format';

export interface OrderConfirmationDialogProps {
  open: boolean;
  lines: CartSummaryLine[];
  total: number;
  slotLabel: string;
  customerName?: string;
  placing?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function OrderConfirmationDialog({
  open,
  lines,
  total,
  slotLabel,
  customerName,
  placing,
  error,
  onConfirm,
  onClose,
}: OrderConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={placing ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle className="font-display">Confirm your order</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        {customerName && <p className="text-sm text-ink-muted">Ordering as {customerName}</p>}
        <div className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">
          <ScheduleRounded fontSize="small" /> Pickup: {slotLabel}
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map(({ item, quantity }) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {quantity} × {item.name}
              </span>
              <span className="tabular-nums">{formatCurrency(item.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <Divider />
        <div className="flex justify-between font-display text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-ink-muted">Pay at the counter when you collect your order.</p>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions className="px-6 pb-5">
        <Button onClick={onClose} disabled={placing} color="inherit">
          Back
        </Button>
        <Button variant="contained" onClick={onConfirm} loading={placing}>
          Place order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
