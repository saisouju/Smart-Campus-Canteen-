import type { User } from '@canteen/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, errorMessage, setUnauthorizedHandler } from '@/api';

export type ViewMode = 'customer' | 'admin';

interface Session {
  /** undefined while the first /auth/me request is in flight. */
  user: User | null | undefined;
  googleConfigured: boolean;
  error: string | null;
  /** Admins can preview the customer experience; everyone else is always 'customer'. */
  view: ViewMode;
  setView: (view: ViewMode) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);
const VIEW_KEY = 'canteen.adminView';

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'customer' ? 'customer' : 'admin';
  } catch {
    return 'admin';
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminView, setAdminView] = useState<ViewMode>(readView);

  const refresh = useCallback(async () => {
    try {
      const state = await api.auth.me();
      setUser(state.user);
      setGoogleConfigured(state.googleConfigured);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Expired/revoked session anywhere in the app → back to sign-in.
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, [refresh]);

  const setView = useCallback((view: ViewMode) => {
    setAdminView(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* not persisted */
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const view: ViewMode = user?.role === 'admin' ? adminView : 'customer';

  const value = useMemo<Session>(
    () => ({ user, googleConfigured, error, view, setView, signOut, refresh }),
    [user, googleConfigured, error, view, setView, signOut, refresh],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
