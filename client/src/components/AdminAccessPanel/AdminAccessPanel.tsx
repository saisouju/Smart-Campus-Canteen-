import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useState, type FormEvent } from 'react';
import { ALLOWED_EMAIL_DOMAIN, type AdminEmail } from '@canteen/shared';

export interface AdminAccessPanelProps {
  admins: AdminEmail[];
  /** Email of the admin viewing the panel (shown as "you"). */
  currentEmail?: string;
  /** Resolve to false to keep the typed email (e.g. the server rejected it). */
  onAdd: (email: string) => void | boolean | Promise<void | boolean>;
  onRemove: (email: string) => void | Promise<unknown>;
  busy?: boolean;
  error?: string | null;
}

const SUFFIX = `@${ALLOWED_EMAIL_DOMAIN}`;

/** Grant/revoke admin access by college email. The founding admin is locked. */
export function AdminAccessPanel({ admins, currentEmail, onAdd, onRemove, busy, error }: AdminAccessPanelProps) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  // Accept either "name" or "name@klh.edu.in".
  const email = (value.includes('@') ? value : value ? value + SUFFIX : '').trim().toLowerCase();
  const invalid = !email.endsWith(SUFFIX) || email.length <= SUFFIX.length || /\s/.test(email);
  const showError = touched && value.length > 0 && invalid;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    if ((await onAdd(email)) === false) return;
    setValue('');
    setTouched(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start" noValidate>
        <TextField
          size="small"
          label="College email"
          placeholder={`firstname.lastname${SUFFIX}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          error={showError}
          helperText={showError ? `Must be a ${SUFFIX} address` : `Only ${SUFFIX} accounts can be admins`}
          className="flex-1"
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { inputMode: 'email', autoComplete: 'off', 'aria-label': 'New admin email' },
          }}
        />
        <Button type="submit" variant="contained" startIcon={<PersonAddAlt1Rounded />} loading={busy} className="sm:mt-0.5">
          Add admin
        </Button>
      </form>

      {error && <Alert severity="error">{error}</Alert>}

      <ul className="divide-y divide-line" aria-label="Current admins">
        {admins.map((a) => (
          <li key={a.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {a.email}
                {a.email === currentEmail && <span className="ml-1.5 font-normal text-ink-muted">(you)</span>}
              </p>
              <p className="text-xs text-ink-muted">
                {a.permanent ? 'Founding admin' : `Added by ${a.addedBy ?? 'unknown'} · ${a.addedAt.slice(0, 10)}`}
              </p>
            </div>
            {!a.hasSignedIn && <Chip size="small" variant="outlined" label="Not signed in yet" />}
            {a.permanent ? (
              <Tooltip title="The founding admin cannot be removed">
                <LockRounded fontSize="small" className="mx-2 text-ink-muted" aria-label="Locked" />
              </Tooltip>
            ) : (
              <Tooltip title={`Remove ${a.email}`}>
                <IconButton size="small" onClick={() => onRemove(a.email)} disabled={busy} aria-label={`Remove admin ${a.email}`}>
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
