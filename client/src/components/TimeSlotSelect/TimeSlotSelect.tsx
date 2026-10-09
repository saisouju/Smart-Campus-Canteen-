import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { TimeSlot } from '@canteen/shared';

export interface TimeSlotSelectProps {
  slots: TimeSlot[];
  value: string;
  onChange: (slotId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
}

export function TimeSlotSelect({ slots, value, onChange, disabled, loading, error }: TimeSlotSelectProps) {
  const empty = !loading && slots.length === 0;
  const helper = error ?? (empty ? 'No pickup slots left today' : 'Orders are ready at the start of your slot');

  return (
    <FormControl fullWidth size="small" disabled={disabled || loading || empty} error={Boolean(error)}>
      <InputLabel id="time-slot-label">Pickup time slot</InputLabel>
      <Select
        labelId="time-slot-label"
        label="Pickup time slot"
        value={slots.some((s) => s.id === value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        startAdornment={
          <InputAdornment position="start">
            <ScheduleRounded fontSize="small" />
          </InputAdornment>
        }
      >
        {slots.map((slot) => (
          <MenuItem key={slot.id} value={slot.id} disabled={!slot.available}>
            <span className="flex w-full items-center justify-between gap-4">
              <span>{slot.label}</span>
              <span className={`text-xs ${slot.remaining <= 3 ? 'font-semibold text-brand' : 'text-ink-muted'}`}>
                {slot.available ? `${slot.remaining} left` : 'Full'}
              </span>
            </span>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{loading ? 'Loading slots…' : helper}</FormHelperText>
    </FormControl>
  );
}
