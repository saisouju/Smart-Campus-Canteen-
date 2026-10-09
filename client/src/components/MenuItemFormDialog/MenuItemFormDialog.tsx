import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useEffect, useState, type FormEvent } from 'react';
import { MENU_CATEGORIES, type MenuCategory, type NewMenuItem } from '@canteen/shared';

export interface MenuItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: NewMenuItem) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
  /** Prefill (e.g. for editing). */
  initial?: Partial<NewMenuItem>;
}

interface FormState {
  name: string;
  category: MenuCategory;
  price: string;
  isAvailable: boolean;
}

const toForm = (initial?: Partial<NewMenuItem>): FormState => ({
  name: initial?.name ?? '',
  category: initial?.category ?? 'Lunch',
  price: initial?.price === undefined ? '' : String(initial.price),
  isAvailable: initial?.isAvailable ?? true,
});

function validate(form: FormState) {
  const errors: Partial<Record<'name' | 'price', string>> = {};
  if (form.name.trim().length < 2) errors.name = 'Enter at least 2 characters';
  const price = Number(form.price);
  if (!form.price || Number.isNaN(price) || price <= 0) errors.price = 'Enter a price above ₹0';
  else if (price > 10_000) errors.price = 'Price looks too high';
  return errors;
}

/** Admin form: Name, Category, Price, Availability. */
export function MenuItemFormDialog({ open, onClose, onSubmit, submitting, error, initial }: MenuItemFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(initial));
      setTouched(false);
    }
  }, [open, initial]);

  const errors = validate(form);
  const show = (field: keyof typeof errors) => (touched ? errors[field] : undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    void onSubmit({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      isAvailable: form.isAvailable,
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle className="font-display">{initial?.name ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2!">
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={Boolean(show('name'))}
            helperText={show('name')}
            autoFocus
            required
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
          >
            {MENU_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={Boolean(show('price'))}
            helperText={show('price')}
            required
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { min: 1, step: 1, inputMode: 'decimal' },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
            }
            label={form.isAvailable ? 'Available to order' : 'Hidden as sold out'}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions className="px-6 pb-5">
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            Save item
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
