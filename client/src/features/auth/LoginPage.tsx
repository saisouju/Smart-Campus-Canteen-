import { useState } from 'react';
import { api } from '@/api';
import { SignInCard } from '@/components';

/** Reads (then clears) the ?authError= code the OAuth callback redirects with. */
function takeAuthError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('authError');
  if (code) {
    params.delete('authError');
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
  }
  return code;
}

export function LoginPage({ googleConfigured }: { googleConfigured: boolean }) {
  const [error] = useState(takeAuthError);
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <SignInCard
        signInHref={api.auth.signInUrl}
        error={googleConfigured ? error : 'not_configured'}
        disabled={!googleConfigured}
      />
    </div>
  );
}
