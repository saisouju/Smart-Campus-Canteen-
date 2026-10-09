import AddRounded from '@mui/icons-material/AddRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import IconButton from '@mui/material/IconButton';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible name of the thing being counted, e.g. "Masala Dosa". */
  label: string;
  size?: 'small' | 'medium';
}

/** −  2  + control shared by menu cards and the cart. */
export function QuantityStepper({ value, onChange, min = 0, max = 20, label, size = 'small' }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-1" role="group" aria-label={`${label} quantity`}>
      <IconButton size={size} aria-label={`Remove one ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <RemoveRounded fontSize="small" />
      </IconButton>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <IconButton size={size} aria-label={`Add one ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <AddRounded fontSize="small" />
      </IconButton>
    </div>
  );
}
