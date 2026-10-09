import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { ALLOWED_EMAIL_DOMAIN } from '@canteen/shared';

/** Maps ?authError= codes from the OAuth callback to readable messages. */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  domain: `Only @${ALLOWED_EMAIL_DOMAIN} Google accounts can sign in. Please choose your college account.`,
  cancelled: 'Sign-in was cancelled.',
  state: 'Your sign-in link expired. Please try again.',
  google: 'Google sign-in failed. Please try again.',
  not_configured: 'Google sign-in is not configured on the server yet.',
};

export interface SignInCardProps {
  signInHref: string;
  /** An AUTH_ERROR_MESSAGES key or free text. */
  error?: string | null;
  disabled?: boolean;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function SignInCard({ signInHref, error, disabled }: SignInCardProps) {
  const message = error ? (AUTH_ERROR_MESSAGES[error] ?? error) : null;
  return (
    <Paper variant="outlined" className="mx-auto flex w-full max-w-md flex-col items-center gap-5 p-8 text-center">
      <img src="/favicon.svg" alt="" className="size-14" />
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Campus <span className="text-brand">Canteen</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Order ahead, skip the queue. Sign in with your <strong>@{ALLOWED_EMAIL_DOMAIN}</strong> Google account.
        </p>
      </div>
      {message && (
        <Alert severity={error === 'cancelled' ? 'info' : 'error'} className="w-full text-left">
          {message}
        </Alert>
      )}
      <Button
        href={signInHref}
        variant="outlined"
        size="large"
        fullWidth
        disabled={disabled}
        startIcon={<GoogleMark />}
        className="bg-surface py-3 text-ink"
      >
        Sign in with Google
      </Button>
      <p className="text-xs text-ink-muted">Personal Gmail and other domains are not accepted.</p>
    </Paper>
  );
}
