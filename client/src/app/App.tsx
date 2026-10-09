import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import MovieFilterRounded from '@mui/icons-material/MovieFilterRounded';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';
import { lazy, Suspense, useState } from 'react';
import { IntroSequence, RoleSwitcher, UserMenu } from '@/components';
import { useSession } from '@/context/SessionContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { StudentDashboard } from '@/features/student/StudentDashboard';

// Admin pulls in Recharts; load it only when the admin view is opened.
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

const INTRO_KEY = 'canteen.introSeen';

function introSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

function ColorSchemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;
  if (!resolved) return null;
  const next = resolved === 'dark' ? 'light' : 'dark';
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`}>
        {resolved === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
      </IconButton>
    </Tooltip>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span className="font-display text-lg leading-none font-extrabold tracking-tight">
        Campus <span className="text-brand">Canteen</span>
      </span>
    </span>
  );
}

export function App() {
  const session = useSession();
  const user = session.user;
  const [introDone, setIntroDone] = useState(false);
  const [replaying, setReplaying] = useState(false);

  // Order on page load: auth check → intro → sign-in page / dashboard.
  // Signed-out visitors always see the intro before the sign-in page;
  // signed-in users see it once per browser session.
  const autoIntro = !introDone && user !== undefined && (user === null || !introSeen());
  const showIntro = replaying || autoIntro;

  const finishIntro = () => {
    setIntroDone(true);
    setReplaying(false);
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* replay next load */
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {showIntro && <IntroSequence onFinish={finishIntro} />}

      <AppBar position="sticky" color="inherit" elevation={0} className="static border-b border-line backdrop-blur md:sticky">
        <Toolbar className="mx-auto flex w-full max-w-7xl flex-wrap gap-3 py-2">
          <Logo />
          {/* Phones: logo + icons on row 1, view switch on row 2. Admins only. */}
          {user?.role === 'admin' && (
            <div className="order-3 w-full md:order-2 md:ml-auto md:w-auto">
              <RoleSwitcher view={session.view} onViewChange={session.setView} />
            </div>
          )}
          <div className="order-2 ml-auto flex items-center md:order-3 md:ml-0">
            <Tooltip title="Replay intro">
              <IconButton onClick={() => setReplaying(true)} aria-label="Replay intro">
                <MovieFilterRounded />
              </IconButton>
            </Tooltip>
            <ColorSchemeToggle />
            {user && <UserMenu user={user} onSignOut={() => void session.signOut()} />}
          </div>
        </Toolbar>
      </AppBar>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {session.error ? (
          <Alert severity="error">
            Can't reach the API ({session.error}). Start everything with <code>npm run dev</code> from the project root.
          </Alert>
        ) : user === undefined || autoIntro ? (
          // Nothing behind the intro: the sign-in page only mounts once it has finished.
          user === undefined && <div className="flex justify-center py-24"><CircularProgress /></div>
        ) : user === null ? (
          <div className="page-enter">
            <LoginPage googleConfigured={session.googleConfigured} />
          </div>
        ) : session.view === 'admin' ? (
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <CircularProgress />
              </div>
            }
          >
            <AdminDashboard key={user.id} admin={user} />
          </Suspense>
        ) : (
          <StudentDashboard key={user.id} user={user} />
        )}
      </main>
    </div>
  );
}
